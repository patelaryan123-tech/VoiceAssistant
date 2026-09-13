import json
import hashlib
from pathlib import Path

SETTINGS_FILE = Path("settings.json")

# Default pin is "3012" -> SHA-256 hash
DEFAULT_SETTINGS = {
    "tts_enabled": True,
    "theme": "dark",
    "voice_speed": 160,
    "voice_gender": "female",
    "wake_word_enabled": False,
    "ollama_model": "llama3",
    "briefing_city": "New Delhi",
    "app_pin": "b33ed571eded536f0f0bc2be4e4384055acd592fe6652a555320fdca4dbeb175",
    "jarvis_mode": False,
}

def hash_pin(pin: str) -> str:
    """Hashes a PIN using SHA-256."""
    if not pin:
        return ""
    return hashlib.sha256(pin.encode('utf-8')).hexdigest()

def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Merge with defaults to handle missing keys
                merged = {**DEFAULT_SETTINGS, **data}
                
                # Auto-migrate legacy plaintext PIN to SHA-256 hash
                pin = merged.get("app_pin")
                if pin and len(pin) != 64:
                    merged["app_pin"] = hash_pin(pin)
                    save_settings(merged)
                
                return merged
        except Exception:
            return dict(DEFAULT_SETTINGS)
    
    defaults = dict(DEFAULT_SETTINGS)
    save_settings(defaults)
    return defaults

def save_settings(settings: dict):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=4)

def update_setting(key: str, value):
    settings = load_settings()
    settings[key] = value
    save_settings(settings)
    return settings
