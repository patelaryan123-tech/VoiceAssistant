"""
llm.py — Local AI via Ollama (100% offline, no API key, no internet)
Ollama must be running: https://ollama.com
Detected model: llama3

REST API: http://localhost:11434/api/generate
No SDK needed — uses Python stdlib urllib only.
"""

import json
import urllib.request

OLLAMA_BASE = "http://localhost:11434"

# JARVIS-style system prompt prefix
_SYSTEM_PROMPT = (
    "You are ARIA — an intelligent, witty personal assistant inspired by JARVIS from Iron Man. "
    "You run entirely on the user's local machine with full privacy. "
    "Be concise, helpful, and slightly witty. "
    "Keep responses under 150 words unless the user asks for detail. "
    "Respond in plain text only — no markdown, no asterisks, no bullet symbols — "
    "because your response will be read aloud by text-to-speech."
)


def _check_ollama_running() -> bool:
    """Ping Ollama to see if it's running."""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=3):
            return True
    except Exception:
        return False


def list_models() -> list[str]:
    """Return list of locally available Ollama model names."""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def ask_ollama(prompt: str, model: str = "llama3") -> dict:
    """
    Send a prompt to the local Ollama model and return the response.
    Uses /api/generate with stream=False for a single synchronous response.
    """

    # 1. Check Ollama is running
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

    # 2. Build full prompt with ARIA persona prefix
    full_prompt = f"{_SYSTEM_PROMPT}\n\nUser: {prompt}\n\nARIA:"

    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 300,       # max tokens in response
            "top_p": 0.9,
            "stop": ["\nUser:", "\n\nUser:"],  # stop before next turn
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

        # Ollama can be slow on first run (model loading) — 60s timeout
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        text = result.get("response", "").strip()

        if not text:
            return {"success": False, "text": "Ollama returned an empty response. Try again."}

        # Clean up any leaked stop tokens
        for stop in ["\nUser:", "User:"]:
            if stop in text:
                text = text[: text.index(stop)].strip()

        return {
            "success": True,
            "text": f"🤖 {text}",
            "data": {
                "model": model,
                "tokens": result.get("eval_count", 0),
                "load_ms": round(result.get("load_duration", 0) / 1_000_000),
                "eval_ms": round(result.get("eval_duration", 0) / 1_000_000),
            },
        }

    except urllib.error.URLError as e:
        if "Connection refused" in str(e):
            return {
                "success": False,
                "text": "Cannot connect to Ollama. Run 'ollama serve' in a terminal first.",
            }
        return {"success": False, "text": f"Ollama connection error: {str(e)}"}
    except Exception as e:
        return {"success": False, "text": f"AI error: {str(e)}"}
