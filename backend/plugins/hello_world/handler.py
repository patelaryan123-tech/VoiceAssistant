"""
hello_world plugin handler — Example ARIA Plugin
Trigger phrases: "plugin demo", "test plugin", "demo plugin"
"""

import datetime


def handle(command: str) -> dict:
    now = datetime.datetime.now().strftime("%H:%M:%S")
    return {
        "success": True,
        "text": (
            f"🗂️ Hello from the Plugin System! "
            f"I'm the 'hello_world' demo plugin, running at {now}. "
            f"You can add your own plugins by creating a folder in the plugins/ directory "
            f"with a plugin.json and handler.py file."
        ),
        "intent_type": "plugin_result",
        "data": {
            "plugin": "hello_world",
            "command": command,
            "time": now,
        }
    }
