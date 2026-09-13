import sys
import asyncio
import json
import re
import time
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
print("[+] Starting A.R.I.A. / J.A.R.V.I.S. (Initializing heavy ML modules, please wait...)")
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from speech import SpeechManager
from intent_engine import IntentEngine
import history_store
import settings_store
import wake_word
import uvicorn

app = FastAPI()

# ---------------------------------------------------------------------------
# Process Guard watchdog background task
# ---------------------------------------------------------------------------
async def process_guard_watchdog():
    import psutil
    from system_ops import _guarded_processes
    while True:
        await asyncio.sleep(5)
        if not _active_connections:
            continue
            
        running_names = set()
        try:
            for proc in psutil.process_iter(['name']):
                pname = proc.info.get('name')
                if pname:
                    running_names.add(pname.lower())
        except Exception:
            continue
            
        for gname, info in list(_guarded_processes.items()):
            is_running = False
            for rname in running_names:
                if gname in rname:
                    is_running = True
                    break
                    
            current_status = "running" if is_running else "stopped"
            if current_status != info["last_status"]:
                info["last_status"] = current_status
                msg = {
                    "type": "process_guard_alert",
                    "text": f"⚠️ Process Guard Alert: '{info['name']}' has {current_status}!",
                    "data": {"name": info['name'], "status": current_status},
                    "success": True
                }
                for ws in list(_active_connections):
                    try:
                        await ws.send_json(msg)
                    except Exception:
                        pass

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_guard_watchdog())

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


import security_guard

# ---------------------------------------------------------------------------
# Core command processor
# ---------------------------------------------------------------------------
async def _process_command(text: str, websocket: WebSocket, settings: dict):
    """Shared logic for both voice and text commands."""
    text = security_guard.sanitize_input(text)
    if not text:
        return

    history_store.add_message("user", text)
    await websocket.send_json({"type": "transcript", "role": "user", "text": text})

    result = intent_engine.parse_and_execute(text)

    if not result:
        return

    rtype = result.get("type")

    # ── Vision start/stop intercept ──────────────────────────────────────
    if re.search(r"start\s+vision|enable\s+vision|activate\s+vision|start\s+camera", text.lower()):
        try:
            import vision_engine
            vision = vision_engine.get_vision()
            loop = asyncio.get_event_loop()

            # Callback to send frames to the connected websocket
            def send_frame_cb(frame_data):
                try:
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_json(frame_data),
                        loop
                    )
                except Exception as e:
                    print(f"[WS Vision] Broadcast error: {e}")

            # Start YOLO loop with callback
            start_res = vision.start(send_frame_cb)
            announce_text = start_res.get("text", "👁️ Vision mode activated.")

            # Send transcript so chat shows it
            history_store.add_message("assistant", announce_text)
            await websocket.send_json({
                "type": "transcript",
                "role": "assistant",
                "text": announce_text,
                "intent_type": "vision_start",
                "success": start_res.get("success", True),
            })

            # Speak exactly once on activation
            if settings.get("tts_enabled", True) and start_res.get("success", True):
                speech_mgr.speak(announce_text[:200])

            return  # ← return here: prevents generic handler from speaking again
        except Exception as e:
            print(f"[WS Vision] Start failed: {e}")
            await websocket.send_json({
                "type": "transcript",
                "role": "assistant",
                "text": f"❌ Vision failed to start: {e}",
                "intent_type": "vision_start",
                "success": False,
            })
            return
            
    elif re.search(r"stop\s+vision|disable\s+vision|stop\s+camera", text.lower()):
        try:
            import vision_engine
            vision = vision_engine.get_vision()
            stop_res = vision.stop()
            summary_text = stop_res.get("text", "👁️ Vision mode deactivated.")

            # Send transcript message so it displays in chat feed
            await websocket.send_json({
                "type": "transcript",
                "role": "assistant",
                "text": summary_text,
                "intent_type": "vision_stop",
                "success": True
            })

            # Send vision_stopped event
            await websocket.send_json({
                "type": "vision_stopped",
                "summary": summary_text
            })

            # Speak summary via TTS
            speech_mgr.speak(summary_text)

            # Record in history store
            history_store.add_entry("assistant", summary_text, intent_type="vision_stop", success=True)
            return
        except Exception as e:
            print(f"[WS Vision] Stop failed: {e}")

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
# Security PIN & Lockout State
# ---------------------------------------------------------------------------
_failed_attempts = 0
_lockout_until = 0.0

def get_clean_settings(settings: dict) -> dict:
    """Prepares settings to be sent to the frontend by stripping app_pin and adding is_pin_set."""
    clean = {k: v for k, v in settings.items() if k != "app_pin"}
    clean["is_pin_set"] = bool(settings.get("app_pin"))
    return clean


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
    await websocket.send_json({"type": "settings", "data": get_clean_settings(settings)})

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

            # ── Verify PIN ────────────────────────────────────────
            elif action == "verify_pin":
                global _failed_attempts, _lockout_until
                pin = message.get("pin", "")
                
                # Check lockout first
                current_time = time.time()
                if current_time < _lockout_until:
                    remaining = int(_lockout_until - current_time)
                    await websocket.send_json({
                        "type": "verify_pin_result",
                        "success": False,
                        "lockout_time": remaining,
                        "text": f"Too many failed attempts. Try again in {remaining} seconds."
                    })
                    continue
                
                stored_settings = settings_store.load_settings()
                stored_hash = stored_settings.get("app_pin")
                
                # Default PIN "3012" hash if not set
                if not stored_hash:
                    stored_hash = settings_store.hash_pin("3012")
                
                input_hash = settings_store.hash_pin(pin)
                if input_hash == stored_hash:
                    _failed_attempts = 0
                    _lockout_until = 0.0
                    await websocket.send_json({
                        "type": "verify_pin_result",
                        "success": True,
                        "text": "Access Granted ✓"
                    })
                else:
                    _failed_attempts += 1
                    if _failed_attempts >= 5:
                        _lockout_until = time.time() + 30
                        await websocket.send_json({
                            "type": "verify_pin_result",
                            "success": False,
                            "lockout_time": 30,
                            "text": "Too many failed attempts. Lockout for 30s."
                        })
                    else:
                        attempts_left = 5 - _failed_attempts
                        await websocket.send_json({
                            "type": "verify_pin_result",
                            "success": False,
                            "attempts_left": attempts_left,
                            "text": f"Invalid PIN. {attempts_left} attempts left."
                        })

            # ── Change PIN ────────────────────────────────────────
            elif action == "change_pin":
                current_pin = message.get("current_pin", "")
                new_pin = message.get("new_pin", "")
                
                stored_settings = settings_store.load_settings()
                stored_hash = stored_settings.get("app_pin")
                if not stored_hash:
                    stored_hash = settings_store.hash_pin("3012")
                
                # Check current PIN
                if settings_store.hash_pin(current_pin) != stored_hash:
                    await websocket.send_json({
                        "type": "change_pin_result",
                        "success": False,
                        "text": "Current PIN is incorrect."
                    })
                else:
                    new_hash = settings_store.hash_pin(new_pin)
                    settings = settings_store.update_setting("app_pin", new_hash)
                    
                    # Update other components
                    speech_mgr.update_settings(settings)
                    intent_engine.update_ai_settings(settings)
                    
                    await websocket.send_json({
                        "type": "change_pin_result",
                        "success": True,
                        "text": "PIN updated successfully!"
                    })
                    
                    # Broadcast updated clean settings
                    await websocket.send_json({
                        "type": "settings",
                        "data": get_clean_settings(settings)
                    })

            # ── Settings update ─────────────────────────────────────
            elif action == "update_settings":
                key = message.get("key")
                value = message.get("value")
                if key:
                    # Guard app_pin direct updates
                    if key == "app_pin":
                        value = settings_store.hash_pin(value)
                    
                    settings = settings_store.update_setting(key, value)
                    speech_mgr.update_settings(settings)
                    intent_engine.update_ai_settings(settings)
                    # Toggle wake word on/off
                    if key == "wake_word_enabled":
                        if value:
                            wake_word.start(_make_wake_word_callback(loop))
                        else:
                            wake_word.stop()
                    await websocket.send_json({"type": "settings", "data": get_clean_settings(settings)})

            # ── Telemetry request ─────────────────────────────────────
            elif action == "get_telemetry":
                import system_ops
                stats = system_ops.get_system_stats()
                await websocket.send_json({"type": "telemetry", "data": stats.get("data", {})})

            # ── Security Audit request ─────────────────────────────────
            elif action == "get_security_audit":
                audit_report = security_guard.get_security_audit_report()
                await websocket.send_json({"type": "security_audit", "data": audit_report})

    except WebSocketDisconnect:
        print("Client disconnected")
    finally:
        _active_connections.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_excludes=["venv", "*.pyc", "__pycache__", "rag_db", "plugins"],
    )
