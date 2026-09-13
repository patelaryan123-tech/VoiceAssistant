"""
intent_engine.py — Command parser and intent dispatcher
Covers: Help, Time/Date, VS Code, Folders, Files, Websites,
        Volume, Screenshot, Battery, Shutdown/Restart/Lock,
        Open/Kill Apps, Delete/Rename/Move Files,
        Weather, Wiki, Calculator, Currency, Timer, News, Web Search,
        Dark/Light Mode, Export Chat, Clear Chat, Exit,
        ── UNIQUE FEATURES ──
        Command Chaining, Clipboard, System Dashboard, Macro Recorder,
        Network Info, Ping, Session Analytics, Smart Reminders,
        ── JARVIS FEATURES ──
        Wake Word, AI Free-Form, Morning Briefing,
        Stock/Crypto Tracker, Real-Time Translation
        ── NEW ARIA FEATURES ──
        RAG (Chat with Docs), GUI Automation, YOLO Vision,
        Plugin System, Conversation Memory
"""

import re
import system_ops
import file_search
import web_info
import macro_store
import reminder_store
import llm

# New feature modules (imported lazily to keep startup fast)
try:
    import rag_engine as _rag_mod
    _rag_mod.init_rag()
except Exception as _e:
    print(f"[IntentEngine] RAG module not available: {_e}")
    _rag_mod = None

try:
    import gui_automation as _gui
except Exception as _e:
    print(f"[IntentEngine] GUI automation not available: {_e}")
    _gui = None

try:
    import vision_engine as _vis_mod
    _vis_mod.init_vision()
except Exception as _e:
    print(f"[IntentEngine] Vision module not available: {_e}")
    _vis_mod = None

try:
    import plugin_loader as _pl
    _plugin_loader = _pl.get_plugin_loader()
except Exception as _e:
    print(f"[IntentEngine] Plugin loader not available: {_e}")
    _plugin_loader = None


class IntentEngine:
    def __init__(self):
        self._timer_callback = None
        self._reminder_callback = None
        self._last_assistant_text = ""
        self._ollama_model = "llama3"     # Set from settings
        self._briefing_city = "New Delhi" # Set from settings
        self._jarvis_mode = False         # Set from settings

    def update_ai_settings(self, settings: dict):
        """Called whenever settings change."""
        self._ollama_model  = settings.get("ollama_model", "llama3")
        self._briefing_city = settings.get("briefing_city", "New Delhi")
        self._jarvis_mode   = settings.get("jarvis_mode", False)

    def set_timer_callback(self, callback):
        """Register async callback for timer notifications."""
        self._timer_callback = callback

    def set_reminder_callback(self, callback):
        """Register async callback for reminder notifications."""
        reminder_store.start_checker(callback)

    # ------------------------------------------------------------------
    # Command Chaining — "take a screenshot then open chrome"
    # ------------------------------------------------------------------
    def _split_chain(self, cmd: str) -> list[str]:
        """Split compound commands on 'then', 'and then', 'after that'."""
        parts = re.split(r"\s+(?:and\s+)?then\s+|\s+after\s+that\s+", cmd, flags=re.IGNORECASE)
        return [p.strip() for p in parts if p.strip()]

    # ------------------------------------------------------------------
    def parse_and_execute(self, command: str):
        cmd_raw = command.strip()
        cmd = cmd_raw.lower()

        # ── Macro recording intercept ─────────────────────────────────
        if macro_store.is_recording():
            # Allow "stop recording" to escape
            if not re.search(r"stop\s+(?:macro\s+)?recording|save\s+macro", cmd):
                macro_store.record_command(cmd_raw)
                # Still execute the command normally
                result = self._dispatch(cmd_raw, cmd)
                if result:
                    result["_macro_recorded"] = True
                return result

        # ── Command chaining ─────────────────────────────────────────
        parts = self._split_chain(cmd_raw)
        if len(parts) > 1:
            results = []
            for part in parts:
                r = self._dispatch(part, part.lower())
                if r:
                    results.append(r)
            if results:
                combined_text = " → ".join(r.get("text", "") for r in results)
                success = all(r.get("success", False) for r in results)
                return {
                    "type": "chained",
                    "text": combined_text,
                    "data": results,
                    "success": success,
                }

        return self._dispatch(cmd_raw, cmd)

    # ------------------------------------------------------------------
    def _dispatch(self, cmd_raw: str, cmd: str):
        """Single-command dispatcher — all 40 intents."""

        # ── 1. HELP ──────────────────────────────────────────────────
        if cmd in ("help", "what can you do", "commands"):
            return {
                "type": "help",
                "text": "Here are some things you can say:",
                "data": [
                    "── Voice & Input ──",
                    "dark mode / light mode",
                    "export chat",
                    "── 🆕 Unique Features ──",
                    "take a screenshot then open chrome  (chain commands!)",
                    "read my clipboard / copy last response",
                    "system dashboard / show system stats",
                    "start macro recording [name] / stop recording / run macro [name]",
                    "what's my IP / ping google / show network info",
                    "show analytics / command stats",
                    "remind me to [task] at [time] / show reminders",
                    "── Web & Info ──",
                    "weather in Mumbai",
                    "search for Python tutorials",
                    "who is Elon Musk",
                    "calculate 25 times 48",
                    "convert 100 USD to INR",
                    "set timer for 5 minutes",
                    "show news / news about cricket",
                    "── System Control ──",
                    "volume up / volume down / mute",
                    "take a screenshot",
                    "battery level",
                    "shutdown / restart / cancel shutdown",
                    "lock screen",
                    "open notepad / open chrome",
                    "close chrome / kill notepad",
                    "── File System ──",
                    "open file resume.pdf",
                    "list files in downloads",
                    "find all pdf files",
                    "where is my report file",
                    "find video lecture",
                    "create file notes.txt in desktop",
                    "delete file old.txt from desktop",
                    "rename file old.txt to new.txt in documents",
                    "move file photo.jpg to pictures",
                    "── General ──",
                    "what's the time / today's date",
                    "open vscode / open downloads folder",
                    "open youtube / open github",
                    "clear chat / exit",
                ],
                "success": True,
            }

        # ── 2. TIME / DATE ────────────────────────────────────────────
        if re.search(r"\btime\b", cmd) and not re.search(r"(timer|timer for)", cmd):
            if len(cmd.split()) < 6:
                t = system_ops.get_time()
                return {"type": "time", "text": f"The time is {t} 🕐", "success": True}

        if re.search(r"\bdate\b", cmd) or "today" in cmd:
            if "delete" not in cmd and "update" not in cmd:
                d = system_ops.get_date()
                return {"type": "date", "text": f"Today's date is {d} 📅", "success": True}

        # ── 3. DARK / LIGHT MODE ─────────────────────────────────────
        if "dark mode" in cmd:
            return {"type": "theme", "theme": "dark", "text": "Switched to dark mode 🌙", "success": True}
        if "light mode" in cmd:
            return {"type": "theme", "theme": "light", "text": "Switched to light mode ☀️", "success": True}

        # ── 4. EXPORT CHAT ───────────────────────────────────────────
        if "export chat" in cmd or "download chat" in cmd:
            return {"type": "export_chat", "text": "Exporting chat history... 📥", "success": True}

        # ── 5. WEATHER ───────────────────────────────────────────────
        m = re.search(r"weather\s+(?:in|for|at)?\s*(.+)", cmd)
        if m and not cmd.startswith("remind"):
            city = m.group(1).strip()
            result = web_info.get_weather(city)
            return {**result, "type": "weather"}
        if cmd in ("weather", "what's the weather", "what is the weather"):
            result = web_info.get_weather()
            return {**result, "type": "weather"}

        # ── 6. WIKIPEDIA ─────────────────────────────────────────────
        m = re.search(r"(?:who is|what is|tell me about|wikipedia|wiki)\s+(.+)", cmd)
        if m and not cmd.startswith("remind"):
            query = m.group(1).strip()
            result = web_info.wikipedia_lookup(query)
            return {**result, "type": "wiki"}

        # ── 7. CALCULATOR ────────────────────────────────────────────
        m = re.search(r"(?:calculate|what is|compute|eval|solve)\s+(.+)", cmd)
        if m and not cmd.startswith("remind"):
            expr = m.group(1).strip()
            if any(op in expr for op in ['+', '-', '*', '/', 'plus', 'minus', 'times', 'divided', '^', '%']):
                result = web_info.calculate(expr)
                return {**result, "type": "calculator"}

        # ── 8. CURRENCY ──────────────────────────────────────────────
        m = re.search(r"convert\s+([\d.]+)\s+([a-z]+)\s+to\s+([a-z]+)", cmd)
        if m and not cmd.startswith("remind"):
            amount = float(m.group(1))
            from_cur = m.group(2)
            to_cur = m.group(3)
            result = web_info.convert_currency(amount, from_cur, to_cur)
            return {**result, "type": "currency"}

        # ── 9. TIMER ─────────────────────────────────────────────────
        m = re.search(r"(?:set\s+)?(?:a\s+)?timer\s+(?:for\s+)?(.+)", cmd)
        if m:
            duration_str = m.group(1).strip()
            seconds = web_info.parse_timer_duration(duration_str)
            if seconds:
                result = web_info.set_timer(seconds, duration_str, self._timer_callback or (lambda l, s: None))
                return {**result, "type": "timer"}
            return {"type": "error", "text": "Could not parse timer duration. Try: 'set timer for 5 minutes'", "success": False}

        # ── 10. NEWS ─────────────────────────────────────────────────
        m = re.search(r"(?:news|headlines)\s+(?:about|on|for)?\s*(.+)", cmd)
        if m:
            topic = m.group(1).strip()
            result = web_info.get_news(topic)
            return {**result, "type": "news"}
        if cmd in ("news", "show news", "latest news", "top headlines"):
            result = web_info.get_news()
            return {**result, "type": "news"}

        # ── 11. WEB SEARCH ───────────────────────────────────────────
        m = re.search(r"(?:search for|search|google)\s+(.+)", cmd)
        if m and not cmd.startswith("remind"):
            query = m.group(1).strip()
            result = web_info.web_search(query)
            return {**result, "type": "search_web"}

        # ── 12. VOLUME ───────────────────────────────────────────────
        if re.search(r"volume up|increase volume|louder", cmd):
            step = 10
            sm = re.search(r"(\d+)\s*%", cmd)
            if sm:
                step = int(sm.group(1))
            return {**system_ops.change_volume("up", step), "type": "system"}

        if re.search(r"volume down|decrease volume|quieter|lower volume", cmd):
            step = 10
            sm = re.search(r"(\d+)\s*%", cmd)
            if sm:
                step = int(sm.group(1))
            return {**system_ops.change_volume("down", step), "type": "system"}

        if re.search(r"\bmute\b|\bunmute\b", cmd):
            return {**system_ops.change_volume("mute"), "type": "system"}

        m = re.search(r"set volume\s+(?:to\s+)?(\d+)", cmd)
        if m:
            level = int(m.group(1))
            ok = system_ops.set_volume(level)
            if ok:
                return {"type": "system", "text": f"Volume set to {level}% 🔊", "success": True}
            return {"type": "error", "text": "Could not set volume.", "success": False}

        # ── 13. SCREENSHOT ───────────────────────────────────────────
        if re.search(r"(?:take|capture)\s+(?:a\s+)?screenshot|screenshot", cmd):
            return {**system_ops.take_screenshot(), "type": "system"}

        # ── 14. BATTERY ──────────────────────────────────────────────
        if re.search(r"battery|charge level|power level", cmd):
            return {**system_ops.get_battery(), "type": "system"}

        # ── 15. SHUTDOWN / RESTART / LOCK ────────────────────────────
        if re.search(r"cancel shutdown|abort shutdown", cmd):
            return {**system_ops.cancel_shutdown(), "type": "system"}
        if re.search(r"\bshutdown\b|\bshut down\b|\bshut off\b|\bturn off\b", cmd):
            return {**system_ops.shutdown_computer(), "type": "system"}
        if re.search(r"\brestart\b|\breboot\b", cmd):
            return {**system_ops.restart_computer(), "type": "system"}
        if re.search(r"lock\s+(?:the\s+)?(?:screen|computer|pc|laptop)|lock screen", cmd):
            return {**system_ops.lock_screen(), "type": "system"}

        # ── 16. KILL PROCESS ─────────────────────────────────────────
        m = re.search(r"(?:close|kill|stop|end)\s+(.+?)(?:\s+app|\s+process|\s+program)?$", cmd)
        if m:
            app_name = m.group(1).strip()
            if len(app_name) > 1 and app_name not in ("it", "this", "that", "all", "chat", "recording"):
                result = system_ops.kill_process(app_name)
                if result["success"]:
                    return {**result, "type": "system"}

        # ── 17. VS CODE ──────────────────────────────────────────────
        if "open vscode" in cmd or "open visual studio code" in cmd:
            system_ops.open_vscode()
            return {"type": "system", "text": "Opening Visual Studio Code... 💻", "success": True}

        # ── 18. OPEN FOLDER IN VSCODE ────────────────────────────────
        m = re.search(r"open (.*) folder in vscode", cmd)
        if m:
            folder = m.group(1).strip()
            path = system_ops.COMMON_FOLDERS.get(folder)
            import os
            if not path and os.path.exists(folder):
                path = folder
            if path:
                system_ops.open_vscode(path)
                return {"type": "system", "text": f"Opening {folder} folder in VS Code... 💻", "success": True}
            return {"type": "error", "text": f"Folder not found: {folder}", "success": False}

        # ── 19. OPEN FOLDER ──────────────────────────────────────────
        m = re.search(r"open (.*) folder", cmd)
        if m:
            folder = m.group(1).strip()
            path = system_ops.open_folder(folder)
            if path:
                return {"type": "system", "text": f"Opening folder: {path} 📁", "success": True}
            return {"type": "error", "text": f"Folder not found: {folder}", "success": False}

        # ── 20. CREATE FILE ──────────────────────────────────────────
        m = re.search(r"create\s+(?:a\s+)?file\s+(.+?)\s+in\s+(.+?)(?:\s+folder)?$", cmd)
        if m:
            filename = m.group(1).replace(" ", "").strip()
            folder = m.group(2).strip()
            path = system_ops.create_file(filename, folder)
            if path:
                return {"type": "system", "text": f"File created: {path} ✅", "success": True}
            return {"type": "error", "text": f"Failed to create file in {folder}.", "success": False}

        # ── 21. DELETE FILE ──────────────────────────────────────────
        m = re.search(r"delete\s+(?:file\s+)?(.+?)\s+(?:from|in)\s+(.+?)(?:\s+folder)?$", cmd)
        if m:
            filename = m.group(1).strip()
            folder = m.group(2).strip()
            path = system_ops.delete_file(filename, folder)
            if path:
                return {"type": "system", "text": f"Deleted: {filename} from {folder} 🗑️", "success": True}
            return {"type": "error", "text": f"File not found: {filename} in {folder}", "success": False}

        # ── 22. RENAME FILE ──────────────────────────────────────────
        m = re.search(r"rename\s+(?:file\s+)?(.+?)\s+to\s+(.+?)\s+(?:in|from)\s+(.+?)(?:\s+folder)?$", cmd)
        if m:
            old_name = m.group(1).strip()
            new_name = m.group(2).strip()
            folder = m.group(3).strip()
            path = system_ops.rename_file(old_name, new_name, folder)
            if path:
                return {"type": "system", "text": f"Renamed to: {new_name} ✅", "success": True}
            return {"type": "error", "text": f"Could not rename {old_name}.", "success": False}

        # ── 23. MOVE FILE ────────────────────────────────────────────
        m = re.search(r"move\s+(?:file\s+)?(.+?)\s+to\s+(.+?)(?:\s+folder)?$", cmd)
        if m:
            filename = m.group(1).strip()
            to_folder = m.group(2).strip()
            result = file_search.move_file(filename, to_folder)
            return {**result, "type": "system"}

        # ── 24. LIST FILES ───────────────────────────────────────────
        m = re.search(r"(?:list|show)\s+(?:files|all files)\s+in\s+(.+?)(?:\s+folder)?$", cmd)
        if m:
            folder = m.group(1).strip()
            result = file_search.list_files(folder)
            return {**result, "type": "file_list"}

        # ── 25. FIND FILES BY EXTENSION ──────────────────────────────
        m = re.search(r"find\s+all\s+(\w+)\s+files?", cmd)
        if m:
            ext = m.group(1).strip()
            results = file_search.search_files("", extension=ext)
            if results:
                text = f"Found {len(results)} .{ext} files:\n"
                for i, r in enumerate(results, 1):
                    text += f"{i}. {r['name']} — {r['path']}\n"
                return {"type": "search", "text": text, "data": results, "success": True}
            return {"type": "error", "text": f"No .{ext} files found.", "success": False}

        # ── 26. OPEN FILE ────────────────────────────────────────────
        m = re.search(r"open\s+file\s+(.+?)(?:\s+(?:in|from)\s+(.+?))?(?:\s+folder)?$", cmd)
        if m:
            filename = m.group(1).strip()
            folder = m.group(2).strip() if m.group(2) else None
            result = file_search.open_file(filename, folder)
            return {**result, "type": "system"}

        # ── 27. FILE SEARCH ──────────────────────────────────────────
        m = re.search(r"(where is my|find)\s+(.*?)\s*file", cmd)
        if m:
            filename = m.group(2).strip()
            results = file_search.search_files(filename, is_video=False)
            if results:
                text = f"Found {len(results)} file(s):\n"
                for i, r in enumerate(results, 1):
                    text += f"{i}. {r['name']} — {r['path']}\n"
                return {"type": "search", "text": text, "data": results, "success": True}
            return {"type": "error", "text": f"No files found matching: {filename}", "success": False}

        # ── 28. VIDEO SEARCH ─────────────────────────────────────────
        m = re.search(r"find\s+video\s+(.+)", cmd)
        if m:
            filename = m.group(1).strip()
            results = file_search.search_files(filename, is_video=True)
            if results:
                text = f"Found {len(results)} video(s):\n"
                for i, r in enumerate(results, 1):
                    text += f"{i}. {r['name']} — {r['path']}\n"
                return {"type": "search", "text": text, "data": results, "success": True}
            return {"type": "error", "text": f"No videos found matching: {filename}", "success": False}

        # ────────────────────────────────────────────────────────────
        # ── NEW UNIQUE FEATURES (29-40) ──────────────────────────────
        # ────────────────────────────────────────────────────────────

        # ── 29. SYSTEM DASHBOARD ─────────────────────────────────────
        if re.search(r"system\s+(?:dashboard|stats|status|info)|show\s+(?:system|cpu|ram|disk)", cmd):
            result = system_ops.get_system_stats()
            return {**result, "type": "system_stats"}

        # ── 30. CLIPBOARD READ ───────────────────────────────────────
        if re.search(r"read\s+(?:my\s+)?clipboard|what(?:'s| is)\s+(?:in\s+)?(?:my\s+)?clipboard|clipboard\s+content", cmd):
            result = system_ops.clipboard_read()
            return {**result, "type": "clipboard"}

        # ── 31. COPY LAST RESPONSE ───────────────────────────────────
        if re.search(r"copy\s+(?:last|that|the)\s+(?:response|answer|result)\s+to\s+clipboard|copy\s+to\s+clipboard", cmd):
            result = system_ops.clipboard_write(self._last_assistant_text or "Nothing to copy.")
            return {**result, "type": "clipboard"}

        # ── 32. NETWORK INFO ─────────────────────────────────────────
        if re.search(r"(?:what(?:'s| is)\s+my\s+)?(?:public\s+)?ip|(?:show\s+)?network\s+(?:info|details)|my\s+ip\s+address", cmd):
            result = system_ops.get_network_info()
            return {**result, "type": "network"}

        # ── 33. PING ─────────────────────────────────────────────────
        m = re.search(r"ping\s+(.+)", cmd)
        if m:
            host = m.group(1).strip()
            result = system_ops.ping_host(host)
            return {**result, "type": "network"}

        # ── 33b. PORT SCAN ───────────────────────────────────────────
        m = re.search(r"(?:scan\s+ports\s+on|port\s*scan)\s+(.+)", cmd)
        if m:
            host = m.group(1).strip()
            # Remove protocol prefix if exists
            host = re.sub(r"^https?://", "", host)
            # Remove paths or ports if exist
            host = host.split("/")[0].split(":")[0]
            result = system_ops.scan_ports(host)
            return {**result, "type": "port_scan"}

        # ── 33c. PROCESS GUARD ───────────────────────────────────────
        m = re.search(r"(?:guard|monitor)\s+process\s+(.+)", cmd)
        if m:
            proc_name = m.group(1).strip()
            result = system_ops.guard_process(proc_name)
            return {**result, "type": "process_guard"}

        # ── 34. ANALYTICS ────────────────────────────────────────────
        if re.search(r"show\s+analytics|command\s+(?:stats|analytics|history)|usage\s+stats|analytics", cmd):
            return {"type": "analytics_request", "text": "Loading analytics... 📊", "success": True}

        # ── 35. MACRO — START RECORDING ──────────────────────────────
        m = re.search(r"start\s+(?:macro\s+)?recording\s*(.*)", cmd)
        if m:
            name = m.group(1).strip() or "macro"
            result = macro_store.start_recording(name)
            return {**result, "type": "macro"}

        # ── 36. MACRO — STOP RECORDING ───────────────────────────────
        if re.search(r"stop\s+(?:macro\s+)?recording|save\s+macro|done\s+recording", cmd):
            result = macro_store.stop_recording()
            return {**result, "type": "macro"}

        # ── 37. MACRO — LIST ─────────────────────────────────────────
        if re.search(r"list\s+macros?|show\s+macros?|my\s+macros?", cmd):
            result = macro_store.list_macros()
            return {**result, "type": "macro_list"}

        # ── 38. MACRO — DELETE ───────────────────────────────────────
        m = re.search(r"delete\s+macro\s+(.+)", cmd)
        if m:
            name = m.group(1).strip()
            result = macro_store.delete_macro(name)
            return {**result, "type": "macro"}

        # ── 39. MACRO — RUN ──────────────────────────────────────────
        m = re.search(r"(?:run|play|execute|replay)\s+macro\s*(.*)", cmd)
        if m:
            name = m.group(1).strip() or "macro"
            commands = macro_store.get_macro(name)
            if not commands:
                return {"type": "error", "text": f"No macro named '{name}' found. Say 'list macros' to see saved macros.", "success": False}
            # Return for main.py to handle playback
            return {
                "type": "macro_run",
                "text": f"▶️ Running macro '{name}' ({len(commands)} command(s))...",
                "data": {"name": name, "commands": commands},
                "success": True,
            }

        # ── 40. REMINDERS ────────────────────────────────────────────
        # Pattern A: "remind me to [task] at/in [time]"
        m = re.search(r"remind\s+me\s+to\s+(.+?)\s+(?:at|in|every\s+day\s+at|every\s+morning\s+at)\s+(.+)", cmd)
        if m:
            label = m.group(1).strip()
            time_text = m.group(2).strip()
            recurring = _is_recurring(cmd)
            result = reminder_store.add_reminder(label, time_text, recurring)
            return {**result, "type": "reminder"}

        # Pattern B: "remind me in [time] to [task]"
        m = re.search(r"remind\s+me\s+(in\s+[\d\w\s]+)\s+to\s+(.+)", cmd)
        if m:
            time_text = m.group(1).strip()
            label = m.group(2).strip()
            result = reminder_store.add_reminder(label, time_text, False)
            return {**result, "type": "reminder"}

        # Pattern C: "remind me [anything] at [time]" — time at the end
        # Handles: "remind me weather in Mumbai at 22:55"
        #          "remind me check email at 9 AM"
        m = re.search(r"remind\s+me\s+(.+?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)", cmd)
        if m:
            label = m.group(1).strip()
            time_text = "at " + m.group(2).strip()
            recurring = _is_recurring(cmd)
            result = reminder_store.add_reminder(label, time_text, recurring)
            return {**result, "type": "reminder"}

        # Pattern D: "remind me [anything] in [N minutes/hours]"
        m = re.search(r"remind\s+me\s+(.+?)\s+(in\s+\d+\s*(?:minute|min|hour|hr)s?)", cmd)
        if m:
            label = m.group(1).strip()
            time_text = m.group(2).strip()
            result = reminder_store.add_reminder(label, time_text, False)
            return {**result, "type": "reminder"}

        # List / show reminders
        if re.search(r"(?:show|list|my)\s+reminders?|active\s+reminders?", cmd):
            result = reminder_store.list_reminders()
            return {**result, "type": "reminder_list"}

        # Cancel reminder
        m = re.search(r"cancel\s+reminder\s+(.+)", cmd)
        if m:
            name = m.group(1).strip()
            result = reminder_store.cancel_reminder(name)
            return {**result, "type": "reminder"}

        # ════════════════════════════════════════════════════════════
        # ── JARVIS FEATURES (41-48) ──────────────────────────────────
        # ════════════════════════════════════════════════════════════

        # ── 41. MORNING BRIEFING ──────────────────────────────────────
        if re.search(r"good\s+morning|good\s+afternoon|good\s+evening|morning\s+briefing|daily\s+briefing|brief\s+me|what(?:'s| is)\s+(?:my\s+)?(?:today|the\s+update)", cmd):
            result = web_info.get_morning_briefing(self._briefing_city)
            return {**result, "type": "briefing"}

        # ── 42. STOCK & CRYPTO TRACKER ───────────────────────────────
        m = re.search(
            r"(?:(?:what(?:'s| is)\s+(?:the\s+)?)?(?:price\s+of|stock\s+(?:price\s+of|for)?|crypto\s+(?:price\s+of)?)\s+(.+)|(.+?)\s+(?:stock|price|crypto)\b)",
            cmd
        )
        if m and not cmd.startswith("remind"):
            query = (m.group(1) or m.group(2) or "").strip()
            # Only trigger for known assets or explicit "stock/price/crypto" mention
            _stock_kws = {"stock", "price", "crypto", "bitcoin", "btc", "ethereum", "eth",
                          "dogecoin", "doge", "solana", "sol", "xrp", "ripple",
                          "tesla", "tsla", "apple", "aapl", "nvidia", "nvda",
                          "google", "microsoft", "msft", "amazon", "amzn", "meta",
                          "nifty", "sensex", "infosys", "reliance", "tcs",
                          "gold", "silver", "oil", "nflx"}
            if any(kw in cmd for kw in _stock_kws) and query:
                result = web_info.get_stock(query)
                return {**result, "type": "stock"}

        # Direct ticker/name lookup: "bitcoin price", "apple stock", "TSLA"
        m2 = re.search(r"^(.+?)\s+(?:price|stock|crypto|rate)$", cmd)
        if m2 and not cmd.startswith("remind"):
            query = m2.group(1).strip()
            _names = set(web_info._TICKER_MAP.keys())
            if query in _names or query.upper() in {v.split(".")[0] for v in web_info._TICKER_MAP.values()}:
                result = web_info.get_stock(query)
                return {**result, "type": "stock"}

        # ── 43. REAL-TIME TRANSLATION ─────────────────────────────────
        # "translate [text] to [language]"
        m = re.search(r"translate\s+(.+?)\s+to\s+(\w+)$", cmd)
        if m:
            text_to_translate = m.group(1).strip()
            target_lang = m.group(2).strip()
            result = web_info.translate_text(text_to_translate, target_lang)
            return {**result, "type": "translation"}

        # "translate my clipboard to [language]"
        m = re.search(r"translate\s+(?:my\s+)?clipboard\s+to\s+(\w+)", cmd)
        if m:
            target_lang = m.group(1).strip()
            clip = system_ops.clipboard_read()
            text_to_translate = clip.get("data", "") if clip.get("success") else ""
            if not text_to_translate:
                return {"type": "error", "text": "Clipboard is empty — nothing to translate.", "success": False}
            result = web_info.translate_text(text_to_translate, target_lang)
            return {**result, "type": "translation"}

        # "translate to [language]" — translate last assistant response
        m = re.search(r"^translate\s+to\s+(\w+)$", cmd)
        if m:
            target_lang = m.group(1).strip()
            text_to_translate = self._last_assistant_text or "Nothing to translate."
            result = web_info.translate_text(text_to_translate, target_lang)
            return {**result, "type": "translation"}

        # ── 44. RAG — CHAT WITH DOCUMENTS ─────────────────────────────
        if re.search(r"load\s+(my\s+)?(documents?|docs?|files?|notes?|pdfs?)", cmd):
            if _rag_mod:
                return _rag_mod.get_rag().scan_documents()
            return {"type": "error", "text": "RAG engine not available.", "success": False}

        rag_q = re.search(r"(?:ask\s+(?:my\s+)?(?:files?|docs?|notes?|documents?)(?:\s*:)?\s*)(.+)", cmd)
        if rag_q:
            question = rag_q.group(1).strip()
            if _rag_mod:
                result = _rag_mod.get_rag().query(question, self._ollama_model)
                return {**result, "type": "ai_answer"}
            return {"type": "error", "text": "RAG not available.", "success": False}

        # ── 45. GUI AUTOMATION ────────────────────────────────────────
        if re.search(r"^(click|left.?click|right.?click|double.?click)\s*(at|on)?\s*(center|screen)?", cmd):
            if _gui:
                if "right" in cmd:
                    return {**_gui.right_click(), "type": "system"}
                if "double" in cmd:
                    return {**_gui.double_click(), "type": "system"}
                return {**_gui.click(), "type": "system"}
            return {"type": "error", "text": "GUI automation not available.", "success": False}

        m = re.search(r"^type\s+(.+)$", cmd)
        if m and _gui:
            return {**_gui.type_text(m.group(1).strip()), "type": "system"}

        m = re.search(r"^press\s+(.+)$", cmd)
        if m and _gui:
            return {**_gui.press_key(m.group(1).strip()), "type": "system"}

        m = re.search(r"^scroll\s+(up|down)(?:\s+(\d+))?$", cmd)
        if m and _gui:
            direction = m.group(1)
            clicks    = int(m.group(2) or 3)
            return {**_gui.scroll(direction, clicks), "type": "system"}

        if re.search(r"^move\s+mouse\s+to\s+(.+)$", cmd) and _gui:
            corner = re.search(r"^move\s+mouse\s+to\s+(.+)$", cmd).group(1).strip()
            return {**_gui.move_to_corner(corner), "type": "system"}

        if re.search(r"^(where is|mouse position|where.?s the mouse)", cmd) and _gui:
            return {**_gui.get_mouse_position(), "type": "system"}

        if re.search(r"^screen (resolution|size)", cmd) and _gui:
            return {**_gui.get_screen_size(), "type": "system"}

        # ── 45b. VISION — YOLO WEBCAM ─────────────────────────────────
        if re.search(r"start\s+vision|enable\s+vision|activate\s+vision|start\s+camera", cmd):
            if _vis_mod:
                vision = _vis_mod.get_vision()
                def _on_frame(frame_data):
                    pass  # handled by main.py WebSocket broadcast
                # Note: actual streaming is set up in main.py via vision_engine singleton
                result = {"success": True, "text": "👁️ Starting vision mode... Say 'stop vision' to deactivate.", "type": "system"}
                return result
            return {"type": "error", "text": "Vision engine not available.", "success": False}

        if re.search(r"stop\s+vision|disable\s+vision|stop\s+camera", cmd):
            if _vis_mod:
                return {**_vis_mod.get_vision().stop(), "type": "system"}
            return {"type": "system", "text": "Vision stopped.", "success": True}

        if re.search(r"what do you see|what.?s in front|take a look|snapshot", cmd):
            if _vis_mod:
                return {**_vis_mod.get_vision().snapshot(), "type": "system"}
            return {"type": "error", "text": "Vision engine not available.", "success": False}

        # ── 46. PLUGIN SYSTEM ─────────────────────────────────────────
        if re.search(r"^list\s+plugins?$|^show\s+plugins?$", cmd):
            if _plugin_loader:
                return {**_plugin_loader.list_plugins(), "type": "system"}
            return {"type": "system", "text": "Plugin system not available.", "success": False}

        if re.search(r"^reload\s+plugins?$", cmd):
            if _plugin_loader:
                return {**_plugin_loader.reload(), "type": "system"}
            return {"type": "system", "text": "No plugins to reload.", "success": False}

        if _plugin_loader:
            plugin_result = _plugin_loader.dispatch(cmd)
            if plugin_result:
                return {**plugin_result, "type": "system"}

        # ── 47. AI FREE-FORM (OLLAMA) ─────────────────────────────────
        # Explicit AI triggers
        if re.search(r"^(?:ask\s+ai|ask\s+aria|ask\s+jarvis|hey\s+ai|hey\s+jarvis|ai\s+answer|aria\s+answer|jarvis\s+answer|ollama)\s+(.+)", cmd):
            m = re.search(r"^(?:ask\s+ai|ask\s+aria|ask\s+jarvis|hey\s+ai|hey\s+jarvis|ai\s+answer|aria\s+answer|jarvis\s+answer|ollama)\s+(.+)", cmd)
            prompt = m.group(1).strip() if m else cmd
            result = llm.ask_ollama(prompt, self._ollama_model, jarvis_mode=self._jarvis_mode)
            return {**result, "type": "ai_answer"}

        # ── 45. OPEN APP (fallback) ───────────────────────────────────
        m = re.search(r"^open\s+(.+)$", cmd)
        if m:
            target = m.group(1).strip()
            target = re.sub(r'\s+(website|site|app|application)$', '', target)
            result = system_ops.open_app(target)
            if not result["success"]:
                system_ops.open_website(target)
                return {"type": "system", "text": f"Opening {target}... 🌐", "success": True}
            return {**result, "type": "system"}

        # ── 46. CLEAR CHAT (also clears memory) ─────────────────────────
        if cmd in ("clear chat", "clear", "clear history"):
            llm.get_memory().clear()   # reset conversation memory
            return {"type": "clear", "text": "Chat cleared and memory reset.", "success": True}

        # ── 47. EXIT ─────────────────────────────────────────────────────
        if cmd in ("stop", "exit", "quit", "goodbye", "bye"):
            return {"type": "exit", "text": "Goodbye! 👋", "success": True}

        # ── 48. FALLBACK TO AI if nothing matched ─────────────────────
        # Acts as JARVIS catch-all when Ollama is available
        if len(cmd.split()) >= 3:
            result = llm.ask_ollama(cmd_raw, self._ollama_model, jarvis_mode=self._jarvis_mode)
            if result.get("success"):
                return {**result, "type": "ai_answer"}

        # ── UNKNOWN ──────────────────────────────────────────────────
        return {
            "type": "unknown",
            "text": "Sorry, I didn't understand that. Try saying 'help' to see all commands.",
            "success": False,
        }


def _is_recurring(cmd: str) -> bool:
    import re as _re
    return bool(_re.search(r"\bevery\s+(day|morning|evening|night|hour)\b", cmd.lower()))
