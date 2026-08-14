"""
reminder_store.py — Smart Reminders for the Voice Assistant
Supports one-time and recurring reminders with natural language time parsing.
Background thread checks every 30 seconds and fires the WebSocket callback.
"""

import json
import re
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path

REMINDER_FILE = Path(__file__).parent / "reminders.json"

_callback = None          # Fired when a reminder is due: callback(label, text)
_checker_thread = None
_stop_event = threading.Event()


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def _load_reminders() -> list[dict]:
    if REMINDER_FILE.exists():
        try:
            return json.loads(REMINDER_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def _save_reminders(data: list[dict]):
    REMINDER_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------------------
# Time Parsing
# ---------------------------------------------------------------------------

def _parse_reminder_time(text: str) -> datetime | None:
    """Parse natural language time like '6 PM', '9:30 AM', 'in 30 minutes', 'in 2 hours'."""
    now = datetime.now()
    text = text.lower().strip()

    # "in X minutes" / "in X hours"
    m = re.search(r"in\s+(\d+)\s*(minute|min|hour|hr)s?", text)
    if m:
        val = int(m.group(1))
        unit = m.group(2)
        delta = timedelta(minutes=val) if "min" in unit else timedelta(hours=val)
        return now + delta

    # "at 6 PM" / "at 9:30 AM" / "at 14:00"
    m = re.search(r"at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", text)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2)) if m.group(2) else 0
        meridiem = m.group(3)
        if meridiem == "pm" and hour < 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0
        target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if target <= now:
            target += timedelta(days=1)   # next occurrence
        return target

    # "tomorrow at ..."
    if "tomorrow" in text:
        m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", text)
        if m:
            hour = int(m.group(1))
            minute = int(m.group(2)) if m.group(2) else 0
            meridiem = m.group(3)
            if meridiem == "pm" and hour < 12:
                hour += 12
            return (now + timedelta(days=1)).replace(hour=hour, minute=minute, second=0, microsecond=0)

    return None


def _is_recurring(text: str) -> bool:
    return bool(re.search(r"\bevery\s+(day|morning|evening|night|hour)\b", text.lower()))


# ---------------------------------------------------------------------------
# Background Checker
# ---------------------------------------------------------------------------

def _check_loop():
    while not _stop_event.is_set():
        try:
            reminders = _load_reminders()
            now = datetime.now()
            updated = []
            for r in reminders:
                due = datetime.fromisoformat(r["due"])
                if now >= due:
                    # Fire the callback
                    if _callback:
                        try:
                            _callback(r["label"], f"⏰ Reminder: {r['label']}")
                        except Exception as e:
                            print(f"[reminder] callback error: {e}")
                    # If recurring, advance to next day
                    if r.get("recurring"):
                        r["due"] = (due + timedelta(days=1)).isoformat()
                        updated.append(r)
                    # Otherwise discard (one-shot)
                else:
                    updated.append(r)
            _save_reminders(updated)
        except Exception as e:
            print(f"[reminder] checker error: {e}")
        _stop_event.wait(30)   # check every 30 seconds


def start_checker(callback):
    global _callback, _checker_thread, _stop_event
    _callback = callback
    _stop_event.clear()
    if _checker_thread is None or not _checker_thread.is_alive():
        _checker_thread = threading.Thread(target=_check_loop, daemon=True)
        _checker_thread.start()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def add_reminder(label: str, time_text: str, recurring: bool = False) -> dict:
    due = _parse_reminder_time(time_text)
    if not due:
        return {"success": False, "text": "⚠️ Could not parse the time. Try: 'remind me to call mom at 6 PM' or 'in 30 minutes'."}

    reminders = _load_reminders()
    entry = {
        "label": label,
        "due": due.isoformat(),
        "recurring": recurring,
        "created": datetime.now().isoformat(),
    }
    reminders.append(entry)
    _save_reminders(reminders)

    due_str = due.strftime("%I:%M %p")
    recur_str = " (daily)" if recurring else ""
    return {
        "success": True,
        "text": f"🔔 Reminder set: '{label}' at {due_str}{recur_str}",
        "data": entry,
    }


def list_reminders() -> dict:
    reminders = _load_reminders()
    if not reminders:
        return {"success": False, "text": "No active reminders. Say 'remind me to...' to add one."}

    items = []
    for r in reminders:
        due = datetime.fromisoformat(r["due"])
        items.append({
            "label": r["label"],
            "due": due.strftime("%I:%M %p, %b %d"),
            "recurring": r.get("recurring", False),
        })

    text = f"🔔 Active reminders ({len(items)}):\n"
    for item in items:
        recur = " 🔁" if item["recurring"] else ""
        text += f"  • {item['label']} — {item['due']}{recur}\n"

    return {"success": True, "text": text.strip(), "data": items}


def cancel_reminder(name: str) -> dict:
    reminders = _load_reminders()
    original_len = len(reminders)
    reminders = [r for r in reminders if name.lower() not in r["label"].lower()]
    if len(reminders) < original_len:
        _save_reminders(reminders)
        return {"success": True, "text": f"✅ Reminder '{name}' cancelled."}
    return {"success": False, "text": f"No reminder found matching '{name}'."}
