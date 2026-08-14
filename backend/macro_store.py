"""
macro_store.py — Voice Macro Recorder for the Voice Assistant
Allows recording, storing, listing, and replaying command sequences.
"""

import json
import os
from pathlib import Path

MACRO_FILE = Path(__file__).parent / "macros.json"

_recording: bool = False
_current_recording: list[str] = []
_current_name: str = ""


# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

def _load_macros() -> dict:
    if MACRO_FILE.exists():
        try:
            return json.loads(MACRO_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_macros(data: dict):
    MACRO_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def is_recording() -> bool:
    return _recording


def start_recording(name: str = "macro") -> dict:
    global _recording, _current_recording, _current_name
    _recording = True
    _current_recording = []
    _current_name = name.strip() or "macro"
    return {
        "success": True,
        "text": f"🔴 Recording macro '{_current_name}'... Say your commands. Say 'stop recording' when done.",
    }


def record_command(command: str):
    """Called by intent_engine while recording is active."""
    global _current_recording
    if _recording:
        _current_recording.append(command)


def stop_recording() -> dict:
    global _recording, _current_recording, _current_name
    if not _recording:
        return {"success": False, "text": "No recording in progress."}

    _recording = False
    commands = list(_current_recording)
    name = _current_name

    if not commands:
        return {"success": False, "text": "Macro was empty — nothing saved."}

    macros = _load_macros()
    macros[name] = commands
    _save_macros(macros)

    _current_recording = []
    _current_name = ""

    return {
        "success": True,
        "text": f"✅ Macro '{name}' saved with {len(commands)} command(s)!",
        "data": {"name": name, "commands": commands},
    }


def list_macros() -> dict:
    macros = _load_macros()
    if not macros:
        return {"success": False, "text": "No macros saved yet. Say 'start macro recording' to create one."}

    items = []
    for name, cmds in macros.items():
        items.append({"name": name, "commands": cmds, "count": len(cmds)})

    text = f"📼 You have {len(macros)} macro(s):\n"
    for item in items:
        text += f"  • {item['name']} ({item['count']} commands)\n"

    return {"success": True, "text": text.strip(), "data": items}


def get_macro(name: str) -> list[str] | None:
    macros = _load_macros()
    # Try exact match first, then partial
    if name in macros:
        return macros[name]
    for key in macros:
        if name.lower() in key.lower():
            return macros[key]
    return None


def delete_macro(name: str) -> dict:
    macros = _load_macros()
    if name in macros:
        del macros[name]
        _save_macros(macros)
        return {"success": True, "text": f"🗑️ Macro '{name}' deleted."}
    return {"success": False, "text": f"No macro named '{name}' found."}
