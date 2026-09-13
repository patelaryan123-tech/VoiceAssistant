"""
llm.py — Local AI via Ollama with Conversation Memory
100% offline · no API key · uses urllib only
REST: http://localhost:11434/api/generate
"""

import json
import urllib.request
from collections import deque

OLLAMA_BASE = "http://localhost:11434"

def get_system_prompt(jarvis_mode: bool = False) -> str:
    name = "JARVIS" if jarvis_mode else "ARIA"
    desc = "from Iron Man" if jarvis_mode else "inspired by JARVIS from Iron Man"
    return (
        f"You are {name} — an intelligent, witty personal assistant {desc}. "
        "You run entirely on the user's local machine with full privacy. "
        "Be concise, helpful, and slightly witty. "
        "Keep responses under 150 words unless the user asks for detail. "
        "Respond in plain text only — no markdown, no asterisks, no bullet symbols — "
        "because your response will be read aloud by text-to-speech."
    )


# ══════════════════════════════════════════════════════════════════════════════
# Conversation Memory
# ══════════════════════════════════════════════════════════════════════════════
class ConversationMemory:
    """
    Rolling context window.  Stores last MAX_TURNS (user, assistant) pairs
    and builds a single prompt string for Ollama.
    """
    MAX_TURNS = 10          # keep last 10 exchanges
    MAX_CHARS = 3000        # hard cap to avoid context overflow

    def __init__(self):
        self._turns: deque[dict] = deque(maxlen=self.MAX_TURNS * 2)

    def add_user(self, text: str):
        self._turns.append({"role": "user", "text": text})

    def add_assistant(self, text: str):
        # Strip emoji prefix if present
        clean = text.lstrip("🤖🧠 ").strip()
        self._turns.append({"role": "assistant", "text": clean})

    def clear(self):
        self._turns.clear()

    def build_prompt(self, new_user_msg: str, jarvis_mode: bool = False) -> str:
        """Assemble full prompt: system + history + new user turn."""
        name = "JARVIS" if jarvis_mode else "ARIA"
        parts = [get_system_prompt(jarvis_mode), "\n\n"]

        # Build conversation history
        history_text = ""
        for turn in self._turns:
            if turn["role"] == "user":
                history_text += f"User: {turn['text']}\n"
            else:
                history_text += f"{name}: {turn['text']}\n"

        # Trim if too long (keep most recent)
        if len(history_text) > self.MAX_CHARS:
            history_text = history_text[-self.MAX_CHARS:]
            # Find first complete line
            idx = history_text.find("\n")
            if idx != -1:
                history_text = history_text[idx + 1:]

        parts.append(history_text)
        parts.append(f"User: {new_user_msg}\n{name}:")
        return "".join(parts)

    @property
    def turn_count(self) -> int:
        return len(self._turns) // 2


# Shared global memory instance
_memory = ConversationMemory()


def get_memory() -> ConversationMemory:
    """Return the shared conversation memory instance."""
    return _memory


# ══════════════════════════════════════════════════════════════════════════════
# Ollama helpers
# ══════════════════════════════════════════════════════════════════════════════
def _check_ollama_running() -> bool:
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=3):
            return True
    except Exception:
        return False


def list_models() -> list[str]:
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


# ══════════════════════════════════════════════════════════════════════════════
# Main ask function — with memory
# ══════════════════════════════════════════════════════════════════════════════
def ask_ollama(prompt: str, model: str = "llama3", use_memory: bool = True, jarvis_mode: bool = False) -> dict:
    """
    Send a prompt to local Ollama with conversation context.
    Memory is updated automatically on success.
    """
    if not _check_ollama_running():
        return {
            "success": False,
            "text": (
                "Ollama is not running! Start it with:\n"
                "  ollama serve\n"
                "Then try again. Make sure llama3 is pulled:\n"
                "  ollama pull llama3"
            ),
        }

    # Build prompt with conversation history
    if use_memory:
        full_prompt = _memory.build_prompt(prompt, jarvis_mode)
    else:
        name = "JARVIS" if jarvis_mode else "ARIA"
        full_prompt = f"{get_system_prompt(jarvis_mode)}\n\nUser: {prompt}\n{name}:"

    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 300,
            "top_p": 0.9,
            "stop": ["\nUser:", "\n\nUser:"],
        },
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{OLLAMA_BASE}/api/generate",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        text = result.get("response", "").strip()
        if not text:
            return {"success": False, "text": "Ollama returned an empty response. Try again."}

        # Clean leaked stop tokens
        for stop in ["\nUser:", "User:"]:
            if stop in text:
                text = text[: text.index(stop)].strip()

        # ── Store in memory ────────────────────────────────────────────────
        if use_memory:
            _memory.add_user(prompt)
            _memory.add_assistant(text)

        return {
            "success": True,
            "text": f"🤖 {text}",
            "data": {
                "model": model,
                "tokens": result.get("eval_count", 0),
                "load_ms": round(result.get("load_duration", 0) / 1_000_000),
                "eval_ms": round(result.get("eval_duration", 0) / 1_000_000),
                "memory_turns": _memory.turn_count,
            },
        }

    except urllib.error.URLError as e:
        if "Connection refused" in str(e):
            return {"success": False, "text": "Cannot connect to Ollama. Run 'ollama serve' first."}
        return {"success": False, "text": f"Ollama connection error: {str(e)}"}
    except Exception as e:
        return {"success": False, "text": f"AI error: {str(e)}"}
