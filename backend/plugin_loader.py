"""
plugin_loader.py — ARIA Dynamic Plugin System
Plugins live in ./plugins/<name>/ with plugin.json + handler.py
"""

import os
import re
import json
import importlib.util
import sys
from pathlib import Path
from typing import Optional

PLUGINS_DIR = Path(__file__).parent / "plugins"


class Plugin:
    def __init__(self, name: str, meta: dict, handler_module):
        self.name        = name
        self.description = meta.get("description", "")
        self.version     = meta.get("version", "1.0")
        self.author      = meta.get("author", "unknown")
        self.triggers    = [re.compile(t, re.IGNORECASE) for t in meta.get("triggers", [])]
        self._handler    = handler_module

    def matches(self, command: str) -> bool:
        return any(t.search(command) for t in self.triggers)

    def handle(self, command: str) -> dict:
        try:
            return self._handler.handle(command)
        except Exception as e:
            return {"success": False, "text": f"Plugin '{self.name}' error: {e}"}


class PluginLoader:
    def __init__(self):
        self._plugins: list[Plugin] = []
        self._load_all()

    def _load_all(self):
        PLUGINS_DIR.mkdir(exist_ok=True)
        loaded = 0
        for plugin_dir in sorted(PLUGINS_DIR.iterdir()):
            if not plugin_dir.is_dir():
                continue
            try:
                plugin = self._load_plugin(plugin_dir)
                if plugin:
                    self._plugins.append(plugin)
                    loaded += 1
                    print(f"[Plugin] Loaded '{plugin.name}' v{plugin.version}")
            except Exception as e:
                print(f"[Plugin] Failed to load '{plugin_dir.name}': {e}")
        print(f"[Plugin] {loaded} plugin(s) loaded")

    def _load_plugin(self, plugin_dir: Path) -> Optional[Plugin]:
        meta_path    = plugin_dir / "plugin.json"
        handler_path = plugin_dir / "handler.py"
        if not meta_path.exists() or not handler_path.exists():
            return None

        with open(meta_path, "r") as f:
            meta = json.load(f)

        # Dynamically import handler.py
        spec   = importlib.util.spec_from_file_location(
            f"plugin_{plugin_dir.name}", str(handler_path)
        )
        module = importlib.util.module_from_spec(spec)
        sys.modules[f"plugin_{plugin_dir.name}"] = module
        spec.loader.exec_module(module)

        return Plugin(plugin_dir.name, meta, module)

    def dispatch(self, command: str) -> Optional[dict]:
        """Check all plugins for a match. Return first match result."""
        for plugin in self._plugins:
            if plugin.matches(command):
                return plugin.handle(command)
        return None

    def list_plugins(self) -> dict:
        if not self._plugins:
            return {
                "success": True,
                "text": "No plugins installed. Add folders to the plugins/ directory.",
                "data": [],
            }
        items = [
            {"name": p.name, "description": p.description, "version": p.version}
            for p in self._plugins
        ]
        names = ", ".join(p.name for p in self._plugins)
        return {
            "success": True,
            "text": f"🗂️ {len(self._plugins)} plugin(s) loaded: {names}",
            "data": items,
        }

    def reload(self):
        self._plugins.clear()
        self._load_all()
        return {"success": True, "text": f"Plugins reloaded. {len(self._plugins)} loaded."}

    @property
    def count(self) -> int:
        return len(self._plugins)


# Singleton
_loader: Optional[PluginLoader] = None

def get_plugin_loader() -> PluginLoader:
    global _loader
    if _loader is None:
        _loader = PluginLoader()
    return _loader
