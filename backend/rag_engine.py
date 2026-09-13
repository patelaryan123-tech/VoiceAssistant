"""
rag_engine.py — RAG (Retrieval-Augmented Generation) for ARIA
Indexes your local Documents folder (PDF, TXT, MD) with ChromaDB + sentence-transformers
Then answers questions about them using Ollama — 100% offline
"""

import os
import re
import json
import hashlib
import threading
from pathlib import Path
from typing import Optional

# ── Optional heavy deps ───────────────────────────────────────────────────────
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    _CHROMA_AVAILABLE = True
except ImportError:
    _CHROMA_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False

try:
    import pypdf
    _PYPDF_AVAILABLE = True
except ImportError:
    try:
        import PyPDF2 as pypdf
        _PYPDF_AVAILABLE = True
    except ImportError:
        _PYPDF_AVAILABLE = False

# Data directory for ChromaDB persistence
_DB_DIR = Path(__file__).parent / "rag_db"
_DB_DIR.mkdir(exist_ok=True)


class RAGEngine:
    """
    Local Retrieval-Augmented Generation engine.
    - Scans ~/Documents for PDF, TXT, MD files
    - Embeds chunks with sentence-transformers (all-MiniLM-L6-v2)
    - Stores in ChromaDB (local, persistent)
    - Queries relevant chunks → feeds to Ollama for answer
    """

    CHUNK_SIZE   = 400   # characters per chunk
    CHUNK_OVERLAP = 80
    TOP_K        = 4     # chunks to retrieve

    def __init__(self):
        self._ready       = False
        self._loading     = False
        self._doc_count   = 0
        self._chunk_count = 0
        self._embed_model : Optional[SentenceTransformer] = None
        self._collection  = None
        self._lock        = threading.Lock()

    # ── Init ──────────────────────────────────────────────────────────────────
    def initialize(self):
        """Load models + index documents. Call in a background thread."""
        if not _CHROMA_AVAILABLE:
            print("[RAG] chromadb not installed — RAG disabled")
            return
        if not _ST_AVAILABLE:
            print("[RAG] sentence-transformers not installed — RAG disabled")
            return

        self._loading = True
        try:
            print("[RAG] Loading embedding model...")
            self._embed_model = SentenceTransformer("all-MiniLM-L6-v2")

            print("[RAG] Connecting to ChromaDB...")
            client = chromadb.PersistentClient(
                path=str(_DB_DIR),
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = client.get_or_create_collection(
                name="aria_documents",
                metadata={"hnsw:space": "cosine"},
            )
            print(f"[RAG] Collection has {self._collection.count()} chunks")
            self._ready = True
            print("[RAG] Engine ready ✓")
        except Exception as e:
            print(f"[RAG] Init failed: {e}")
            self._ready = False
        finally:
            self._loading = False

    # ── Document scanning ─────────────────────────────────────────────────────
    def scan_documents(self, folder: Optional[str] = None) -> dict:
        """
        Scan a folder for documents and index them.
        Skips already-indexed files (by content hash).
        """
        if not self._ready:
            return {"success": False, "text": "RAG engine not ready. Install chromadb + sentence-transformers."}

        scan_path = Path(folder) if folder else Path.home() / "Documents"
        if not scan_path.exists():
            return {"success": False, "text": f"Folder not found: {scan_path}"}

        extensions = {".pdf", ".txt", ".md"}
        files = [f for f in scan_path.rglob("*") if f.suffix.lower() in extensions]

        if not files:
            return {"success": False, "text": f"No PDF/TXT/MD files found in {scan_path}"}

        added = 0
        skipped = 0
        for file_path in files[:50]:  # safety cap: max 50 files
            try:
                result = self._index_file(file_path)
                if result:
                    added += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"[RAG] Skip {file_path.name}: {e}")

        self._doc_count   = added + skipped
        self._chunk_count = self._collection.count()

        return {
            "success": True,
            "text": f"📄 Indexed {added} new files ({skipped} already indexed). Total: {self._chunk_count} chunks ready.",
            "data": {
                "files_added": added,
                "files_skipped": skipped,
                "total_chunks": self._chunk_count,
                "folder": str(scan_path),
            }
        }

    def _index_file(self, path: Path) -> bool:
        """Index a single file. Returns True if newly added."""
        content = self._extract_text(path)
        if not content or len(content) < 50:
            return False

        file_hash = hashlib.md5(content.encode()).hexdigest()[:12]
        # Check if already indexed
        existing = self._collection.get(where={"file_hash": file_hash}, limit=1)
        if existing and existing["ids"]:
            return False

        chunks = self._chunk_text(content, path.name)
        if not chunks:
            return False

        # Embed + store
        texts  = [c["text"] for c in chunks]
        embeddings = self._embed_model.encode(texts, show_progress_bar=False).tolist()
        ids    = [f"{file_hash}_{i}" for i in range(len(chunks))]
        metas  = [{**c["meta"], "file_hash": file_hash} for c in chunks]

        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metas,
        )
        print(f"[RAG] Indexed '{path.name}' → {len(chunks)} chunks")
        return True

    # ── Text extraction ───────────────────────────────────────────────────────
    def _extract_text(self, path: Path) -> str:
        suffix = path.suffix.lower()
        try:
            if suffix == ".pdf":
                return self._extract_pdf(path)
            else:  # .txt, .md
                return path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"[RAG] Extract error {path.name}: {e}")
            return ""

    def _extract_pdf(self, path: Path) -> str:
        if not _PYPDF_AVAILABLE:
            return ""
        try:
            import pypdf as _pypdf
            reader = _pypdf.PdfReader(str(path))
            return " ".join(
                page.extract_text() or "" for page in reader.pages
            ).strip()
        except Exception:
            try:
                import PyPDF2
                with open(path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    return " ".join(
                        page.extract_text() or "" for page in reader.pages
                    ).strip()
            except Exception as e:
                print(f"[RAG] PDF error {path.name}: {e}")
                return ""

    # ── Chunking ───────────────────────────────────────────────────────────────
    def _chunk_text(self, text: str, filename: str) -> list[dict]:
        text = re.sub(r"\s+", " ", text).strip()
        chunks = []
        start  = 0
        idx    = 0
        while start < len(text):
            end  = min(start + self.CHUNK_SIZE, len(text))
            chunk_text = text[start:end].strip()
            if len(chunk_text) > 30:
                chunks.append({
                    "text": chunk_text,
                    "meta": {"filename": filename, "chunk_idx": idx},
                })
            start = end - self.CHUNK_OVERLAP
            idx  += 1
        return chunks

    # ── Query ─────────────────────────────────────────────────────────────────
    def query(self, question: str, ollama_model: str = "llama3") -> dict:
        """
        Retrieve top-k relevant chunks → ask Ollama to answer the question.
        """
        if not self._ready:
            return {"success": False, "text": "RAG engine not ready. Say 'load my documents' first."}
        if self._collection.count() == 0:
            return {"success": False, "text": "No documents indexed yet. Say 'load my documents' first."}

        try:
            # Embed the question
            q_embedding = self._embed_model.encode([question], show_progress_bar=False).tolist()

            # Retrieve top-k
            results = self._collection.query(
                query_embeddings=q_embedding,
                n_results=min(self.TOP_K, self._collection.count()),
            )
            docs      = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0]

            if not docs:
                return {"success": False, "text": "No relevant content found in your documents."}

            # Build context
            context_parts = []
            sources = set()
            for doc, meta, dist in zip(docs, metadatas, distances):
                if dist < 1.0:  # cosine similarity threshold
                    context_parts.append(f"[{meta.get('filename','?')}]: {doc}")
                    sources.add(meta.get("filename", "?"))

            if not context_parts:
                return {"success": False, "text": "Could not find relevant context in your documents."}

            context = "\n---\n".join(context_parts)

            # Ask Ollama
            import urllib.request
            import json as _json

            rag_prompt = (
                f"You are ARIA. Answer the user's question using ONLY the context below from their files.\n"
                f"If the answer is not in the context, say so.\n\n"
                f"Context from documents:\n{context}\n\n"
                f"Question: {question}\n\n"
                f"Answer (concise, plain text):"
            )

            payload = {
                "model": ollama_model,
                "prompt": rag_prompt,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 300},
            }
            data = _json.dumps(payload).encode("utf-8")
            req  = urllib.request.Request(
                "http://localhost:11434/api/generate",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = _json.loads(resp.read().decode("utf-8"))

            answer = result.get("response", "").strip()
            if not answer:
                answer = "Could not generate an answer from your documents."

            return {
                "success": True,
                "text": f"📄 {answer}",
                "intent_type": "rag_answer",
                "data": {
                    "answer": answer,
                    "sources": list(sources),
                    "chunks_used": len(context_parts),
                },
            }

        except Exception as e:
            return {"success": False, "text": f"RAG query error: {e}"}

    # ── Status ────────────────────────────────────────────────────────────────
    @property
    def is_ready(self) -> bool:
        return self._ready

    @property
    def status(self) -> str:
        if not _CHROMA_AVAILABLE or not _ST_AVAILABLE:
            return "disabled (missing deps)"
        if self._loading:
            return "loading..."
        if self._ready:
            n = self._collection.count() if self._collection else 0
            return f"ready ({n} chunks)"
        return "not initialized"


# Shared singleton
_rag = RAGEngine()

def get_rag() -> RAGEngine:
    return _rag


def init_rag():
    """Initialize RAG in background thread."""
    threading.Thread(target=_rag.initialize, daemon=True).start()
