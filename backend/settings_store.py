import json
from pathlib import Path

SETTINGS_FILE = Path("settings.json")

DEFAULT_SETTINGS = {
    "tts_enabled": True,
    "theme": "dark",
    "voice_speed": 160,
    "voice_gender": "female",
    "wake_word_enabled": False,
    "ollama_model": "llama3",
    "briefing_city": "New Delhi",
}

def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Merge with defaults to handle missing keys
                merged = {**DEFAULT_SETTINGS, **data}
                return merged
        except Exception:
            return dict(DEFAULT_SETTINGS)
    return dict(DEFAULT_SETTINGS)

def save_settings(settings: dict):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=4)

def update_setting(key: str, value):
    settings = load_settings()
    settings[key] = value
    save_settings(settings)
    return settings
