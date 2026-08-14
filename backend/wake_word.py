"""
wake_word.py — Always-listening Wake Word Detection
Listens in background for "hey aria" / "hey assistant" / "hey jarvis"
Uses speech_recognition (already installed) — no extra dependencies.
When triggered, fires a callback so main.py pushes a WS event to the frontend.
"""

import threading
import speech_recognition as sr

# Wake phrases to listen for (all lowercase)
WAKE_PHRASES = {
    "hey aria",
    "hey assistant",
    "hey jarvis",
    "aria",
    "ok aria",
    "wake up",
}

_thread: threading.Thread | None = None
_stop_event = threading.Event()
_callback = None          # Called when wake word detected: callback()
_enabled = False


def _wake_loop():
    """Background loop that listens in short bursts for the wake word."""
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.6

    print("[wake_word] Listening for wake word...")

    while not _stop_event.is_set():
        try:
            with sr.Microphone() as source:
                recognizer.adjust_for_ambient_noise(source, duration=0.3)
                try:
                    # Short listen window — just enough to catch a wake phrase
                    audio = recognizer.listen(source, timeout=3, phrase_time_limit=3)
                except sr.WaitTimeoutError:
                    continue

            # Recognize — use Google STT (free, no key)
            try:
                text = recognizer.recognize_google(audio).lower().strip()
                print(f"[wake_word] Heard: '{text}'")
            except (sr.UnknownValueError, sr.RequestError):
                continue

            # Check if any wake phrase matches
            for phrase in WAKE_PHRASES:
                if phrase in text:
                    print(f"[wake_word] Wake word detected: '{text}'")
                    if _callback and not _stop_event.is_set():
                        try:
                            _callback()
                        except Exception as e:
                            print(f"[wake_word] callback error: {e}")
                    # Small pause after triggering so we don't double-fire
                    _stop_event.wait(2)
                    break

        except Exception as e:
            print(f"[wake_word] loop error: {e}")
            _stop_event.wait(1)


def start(callback):
    """Start the background wake word listener."""
    global _thread, _stop_event, _callback, _enabled
    if _thread and _thread.is_alive():
        return  # Already running

    _callback = callback
    _enabled = True
    _stop_event.clear()
    _thread = threading.Thread(target=_wake_loop, daemon=True, name="WakeWordThread")
    _thread.start()
    print("[wake_word] Started.")


def stop():
    """Stop the background wake word listener."""
    global _enabled
    _enabled = False
    _stop_event.set()
    print("[wake_word] Stopped.")


def is_running() -> bool:
    return _thread is not None and _thread.is_alive() and not _stop_event.is_set()
