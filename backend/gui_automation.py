"""
gui_automation.py — ARIA GUI & Desktop Automation
Uses pyautogui + pynput for mouse/keyboard/screen control
"""

import time
import threading

try:
    import pyautogui
    pyautogui.FAILSAFE = True      # move mouse to top-left corner to abort
    pyautogui.PAUSE    = 0.05      # small pause between actions
    _PYAUTOGUI_OK = True
except ImportError:
    _PYAUTOGUI_OK = False

try:
    from pynput.keyboard import Key, Controller as KbController
    _PYNPUT_OK = True
except ImportError:
    _PYNPUT_OK = False


def _not_available():
    return {"success": False, "text": "pyautogui not installed. Run: pip install pyautogui pynput"}


# ── Mouse ─────────────────────────────────────────────────────────────────────

def click(x: int = None, y: int = None, button: str = "left") -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        if x is not None and y is not None:
            pyautogui.click(x, y, button=button)
            return {"success": True, "text": f"Clicked at ({x}, {y}) — {button} button"}
        else:
            # Click at current mouse position
            cx, cy = pyautogui.position()
            pyautogui.click(button=button)
            return {"success": True, "text": f"Clicked at current position ({cx}, {cy})"}
    except Exception as e:
        return {"success": False, "text": f"Click error: {e}"}


def double_click(x: int = None, y: int = None) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        if x and y:
            pyautogui.doubleClick(x, y)
        else:
            pyautogui.doubleClick()
        return {"success": True, "text": "Double-clicked ✓"}
    except Exception as e:
        return {"success": False, "text": f"Double-click error: {e}"}


def right_click(x: int = None, y: int = None) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        if x and y:
            pyautogui.rightClick(x, y)
        else:
            pyautogui.rightClick()
        return {"success": True, "text": "Right-clicked ✓"}
    except Exception as e:
        return {"success": False, "text": f"Right-click error: {e}"}


def move_mouse(x: int, y: int, duration: float = 0.3) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        sw, sh = pyautogui.size()
        # Clamp to screen bounds
        x = max(0, min(x, sw - 1))
        y = max(0, min(y, sh - 1))
        pyautogui.moveTo(x, y, duration=duration)
        return {"success": True, "text": f"Mouse moved to ({x}, {y})"}
    except Exception as e:
        return {"success": False, "text": f"Move error: {e}"}


def scroll(direction: str = "down", clicks: int = 3) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        amount = -clicks if direction == "down" else clicks
        pyautogui.scroll(amount)
        return {"success": True, "text": f"Scrolled {direction} {clicks} clicks"}
    except Exception as e:
        return {"success": False, "text": f"Scroll error: {e}"}


def get_mouse_position() -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        x, y = pyautogui.position()
        sw, sh = pyautogui.size()
        return {"success": True, "text": f"Mouse is at ({x}, {y}) — Screen: {sw}×{sh}", "data": {"x": x, "y": y}}
    except Exception as e:
        return {"success": False, "text": f"Position error: {e}"}


# ── Keyboard ──────────────────────────────────────────────────────────────────

def type_text(text: str, interval: float = 0.03) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        pyautogui.write(text, interval=interval)
        return {"success": True, "text": f"Typed: \"{text}\""}
    except Exception as e:
        return {"success": False, "text": f"Type error: {e}"}


def press_key(key: str) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    key_map = {
        "enter": "enter", "return": "enter",
        "escape": "escape", "esc": "escape",
        "tab": "tab",
        "space": "space",
        "backspace": "backspace",
        "delete": "delete",
        "up": "up", "down": "down", "left": "left", "right": "right",
        "home": "home", "end": "end",
        "page up": "pageup", "page down": "pagedown",
        "f1": "f1", "f2": "f2", "f3": "f3", "f4": "f4",
        "f5": "f5", "f6": "f6", "f11": "f11", "f12": "f12",
        "ctrl+c": ["ctrl", "c"], "ctrl+v": ["ctrl", "v"],
        "ctrl+z": ["ctrl", "z"], "ctrl+a": ["ctrl", "a"],
        "ctrl+s": ["ctrl", "s"], "ctrl+w": ["ctrl", "w"],
        "alt+f4": ["alt", "f4"],
        "win": "win", "windows": "win",
        "print screen": "printscreen",
    }
    k = key.lower()
    mapped = key_map.get(k, k)
    try:
        if isinstance(mapped, list):
            pyautogui.hotkey(*mapped)
        else:
            pyautogui.press(mapped)
        return {"success": True, "text": f"Pressed {key} ✓"}
    except Exception as e:
        return {"success": False, "text": f"Key press error: {e}"}


def hotkey(*keys) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        pyautogui.hotkey(*keys)
        return {"success": True, "text": f"Hotkey: {'+'.join(keys)} ✓"}
    except Exception as e:
        return {"success": False, "text": f"Hotkey error: {e}"}


# ── Screen info ───────────────────────────────────────────────────────────────

def get_screen_size() -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        w, h = pyautogui.size()
        return {"success": True, "text": f"Screen resolution: {w}×{h}", "data": {"width": w, "height": h}}
    except Exception as e:
        return {"success": False, "text": f"Screen size error: {e}"}


def move_to_corner(corner: str = "center") -> dict:
    """Move mouse to a named screen position."""
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        w, h = pyautogui.size()
        positions = {
            "center":       (w // 2, h // 2),
            "top":          (w // 2, 50),
            "bottom":       (w // 2, h - 50),
            "left":         (50, h // 2),
            "right":        (w - 50, h // 2),
            "top left":     (50, 50),
            "top right":    (w - 50, 50),
            "bottom left":  (50, h - 50),
            "bottom right": (w - 50, h - 50),
        }
        x, y = positions.get(corner.lower(), (w // 2, h // 2))
        pyautogui.moveTo(x, y, duration=0.4)
        return {"success": True, "text": f"Mouse moved to {corner} ({x}, {y})"}
    except Exception as e:
        return {"success": False, "text": f"Move error: {e}"}


# ── Clipboard ─────────────────────────────────────────────────────────────────

def copy_to_clipboard(text: str) -> dict:
    if not _PYAUTOGUI_OK:
        return _not_available()
    try:
        import pyperclip
        pyperclip.copy(text)
        return {"success": True, "text": f"Copied to clipboard: \"{text[:60]}...\""}
    except Exception as e:
        return {"success": False, "text": f"Clipboard error: {e}"}
