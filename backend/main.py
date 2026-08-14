import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from speech import SpeechManager
from intent_engine import IntentEngine
import history_store
import settings_store
import wake_word
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

speech_mgr = SpeechManager()
intent_engine = IntentEngine()

# Active WebSocket connections (for timer / reminder push notifications)
_active_connections: list[WebSocket] = []


# ---------------------------------------------------------------------------
# Timer callback
# ---------------------------------------------------------------------------
def _make_timer_callback(loop: asyncio.AbstractEventLoop):
    """Creates a thread-safe timer callback that pushes to all active WS clients."""
    def callback(label: str, seconds: int):
        mins, secs = divmod(seconds, 60)
        if mins > 0:
            time_str = f"{mins}m" + (f" {secs}s" if secs else "")
        else:
            time_str = f"{secs}s"

        msg = {
            "type": "timer_done",
            "text": f"⏰ Timer done! ({time_str}: {label})",
            "success": True,
        }
        for ws in list(_active_connections):
            try:
                asyncio.run_coroutine_threadsafe(ws.send_json(msg), loop)
            except Exception:
                pass
    return callback


# ---------------------------------------------------------------------------
# Wake Word callback
# ---------------------------------------------------------------------------
def _make_wake_word_callback(loop: asyncio.AbstractEventLoop):
    """Fires when wake word detected — sends WS event to all clients."""
    def callback():
        msg = {"type": "wake_word_triggered", "text": "Wake word detected! Listening... 🎤"}
        for ws in list(_active_connections):
            try:
                asyncio.run_coroutine_threadsafe(ws.send_json(msg), loop)
            except Exception:
                pass
    return callback


# ---------------------------------------------------------------------------
# Reminder callback
# ---------------------------------------------------------------------------
def _make_reminder_callback(loop: asyncio.AbstractEventLoop):
    """Creates a thread-safe reminder callback that pushes to all active WS clients."""
    def callback(label: str, text: str):
        msg = {
            "type": "reminder_done",
            "text": text,
            "label": label,
            "success": True,
        }
        for ws in list(_active_connections):
            try:
                asyncio.run_coroutine_threadsafe(ws.send_json(msg), loop)
            except Exception:
                pass
    return callback


# ---------------------------------------------------------------------------
# Core command processor
# ---------------------------------------------------------------------------
async def _process_command(text: str, websocket: WebSocket, settings: dict):
    """Shared logic for both voice and text commands."""
    history_store.add_message("user", text)
    await websocket.send_json({"type": "transcript", "role": "user", "text": text})

    result = intent_engine.parse_and_execute(text)

    if not result:
        return

    rtype = result.get("type")

    # ── Special type handlers ────────────────────────────────────────────

    if rtype == "clear":
        history_store.clear_history()
        await websocket.send_json({"type": "clear"})
        return

    if rtype == "theme":
        settings_store.update_setting("theme", result.get("theme", "dark"))
        await websocket.send_json({
            "type": "theme",
            "theme": result.get("theme"),
            "text": result["text"],
            "success": True,
        })
        return

    if rtype == "export_chat":
        history = history_store.load_history()
        await websocket.send_json({
            "type": "export_chat",
            "data": history,
            "text": result["text"],
            "success": True,
        })
        return

    # ── Analytics request — send full history data ───────────────────────
    if rtype == "analytics_request":
        import system_ops
        history = history_store.load_history()
        analytics = system_ops.get_analytics(history)
        history_store.add_message("assistant", analytics["text"])
        await websocket.send_json({
            "type": "transcript",
            "role": "assistant",
            "text": analytics["text"],
            "data": analytics.get("data"),
            "success": analytics.get("success"),
            "intent_type": "analytics",
        })
        return

    # ── Macro run — replay each command sequentially ─────────────────────
    if rtype == "macro_run":
        commands = result.get("data", {}).get("commands", [])
        macro_name = result.get("data", {}).get("name", "macro")

        # Announce playback start
        history_store.add_message("assistant", result["text"])
        await websocket.send_json({
            "type": "transcript",
            "role": "assistant",
            "text": result["text"],
            "success": True,
            "intent_type": "macro",
        })

        # Execute each command in the macro
        for cmd in commands:
            await asyncio.sleep(0.3)   # brief pause between commands
            await _process_command(cmd, websocket, settings)

        done_text = f"✅ Macro '{macro_name}' finished!"
        history_store.add_message("assistant", done_text)
        await websocket.send_json({
            "type": "transcript",
            "role": "assistant",
            "text": done_text,
            "success": True,
            "intent_type": "macro",
        })
        return

    # ── Standard message ─────────────────────────────────────────────────
    history_store.add_message("assistant", result["text"])

    # Track last response text in intent engine (for "copy last response")
    intent_engine._last_assistant_text = result["text"]

    await websocket.send_json({
        "type": "transcript",
        "role": "assistant",
        "text": result["text"],
        "data": result.get("data"),
        "extra": result.get("extra"),
        "success": result.get("success"),
        "intent_type": rtype,
    })

    # TTS
    tts_enabled = settings.get("tts_enabled", True)
    if tts_enabled and (result.get("success") or rtype in ("unknown", "help")):
        tts_text = result["text"]
        if len(tts_text) > 200:
            tts_text = tts_text[:200] + "..."
        speech_mgr.speak(tts_text)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    _active_connections.append(websocket)

    loop = asyncio.get_event_loop()
    intent_engine.set_timer_callback(_make_timer_callback(loop))
    intent_engine.set_reminder_callback(_make_reminder_callback(loop))

    # Load and send state on connect
    history = history_store.load_history()
    settings = settings_store.load_settings()
    speech_mgr.update_settings(settings)
    intent_engine.update_ai_settings(settings)

    # Start wake word if enabled
    if settings.get("wake_word_enabled"):
        wake_word.start(_make_wake_word_callback(loop))

    await websocket.send_json({"type": "history", "data": history})
    await websocket.send_json({"type": "settings", "data": settings})

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action = message.get("action")

            # ── Start voice listening ──────────────────────────────
            if action == "start_listening":
                await websocket.send_json({"type": "status", "text": "Listening... 🎤"})
                text, error_msg = await asyncio.to_thread(speech_mgr.listen)

                if text:
                    await _process_command(text, websocket, settings)
                else:
                    await websocket.send_json({
                        "type": "status",
                        "text": error_msg or "Could not understand audio. Try again."
                    })

            # ── Text command ──────────────────────────────────────
            elif action == "text_command":
                text = message.get("text", "").strip()
                if text:
                    await _process_command(text, websocket, settings)

            # ── Clear chat ────────────────────────────────────────
            elif action == "clear_chat":
                history_store.clear_history()
                await websocket.send_json({"type": "clear"})

            # ── Settings update ─────────────────────────────────────
            elif action == "update_settings":
                key = message.get("key")
                value = message.get("value")
                if key:
                    settings = settings_store.update_setting(key, value)
                    speech_mgr.update_settings(settings)
                    intent_engine.update_ai_settings(settings)
                    # Toggle wake word on/off
                    if key == "wake_word_enabled":
                        if value:
                            wake_word.start(_make_wake_word_callback(loop))
                        else:
                            wake_word.stop()
                    await websocket.send_json({"type": "settings", "data": settings})

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        _active_connections.remove(websocket)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
