"""
system_ops.py — System operations for the Voice Assistant
Handles: Time/Date, Folders, VS Code, Websites, File Creation,
         Volume Control, Screenshots, Battery, Shutdown/Restart,
         Open/Kill Apps, Delete/Rename/Move Files,
         System Stats, Clipboard, Network Info, Ping, Analytics
"""

import os
import subprocess
import webbrowser
import shutil
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Common paths
# ---------------------------------------------------------------------------

HOME = Path.home()
ONEDRIVE = HOME / "OneDrive"

def _resolve_folder(name: str) -> Path:
    # Try OneDrive first as it's the modern default for Desktop/Documents/Pictures
    if (ONEDRIVE / name).exists():
        return ONEDRIVE / name
    return HOME / name

COMMON_FOLDERS = {
    "desktop":   _resolve_folder("Desktop"),
    "documents": _resolve_folder("Documents"),
    "downloads": HOME / "Downloads", # Downloads is rarely inside OneDrive
    "pictures":  _resolve_folder("Pictures"),
    "videos":    _resolve_folder("Videos"),
    "music":     _resolve_folder("Music"),
    "projects":  _resolve_folder("Documents") / "Projects",
}

# ---------------------------------------------------------------------------
# Time & Date
# ---------------------------------------------------------------------------

def get_time():
    return datetime.now().strftime("%I:%M %p")

def get_date():
    return datetime.now().strftime("%B %d, %Y")

# ---------------------------------------------------------------------------
# Folders & VS Code
# ---------------------------------------------------------------------------

def open_folder(folder_name):
    folder_name = folder_name.lower().strip()
    path = COMMON_FOLDERS.get(folder_name)
    if not path and os.path.exists(folder_name):
        path = Path(folder_name)
    if path and path.exists():
        if os.name == 'nt':
            os.startfile(path)
        else:
            subprocess.Popen(['xdg-open', str(path)])
        return str(path)
    return None

def open_vscode(path=None):
    try:
        if path:
            subprocess.Popen(['code', str(path)], shell=True)
        else:
            subprocess.Popen(['code'], shell=True)
        return True
    except Exception as e:
        print(f"Error opening VS Code: {e}")
        return False

# ---------------------------------------------------------------------------
# Websites
# ---------------------------------------------------------------------------

def open_website(site):
    site = site.lower().strip()
    if site.startswith("http://") or site.startswith("https://"):
        webbrowser.open(site)
        return site
    if site.startswith("www."):
        url = "https://" + site
        webbrowser.open(url)
        return url
    urls = {
        "youtube": "https://www.youtube.com",
        "google":  "https://www.google.com",
        "github":  "https://github.com",
        "twitter": "https://twitter.com",
        "x":       "https://twitter.com",
        "reddit":  "https://www.reddit.com",
        "netflix": "https://www.netflix.com",
        "gmail":   "https://mail.google.com",
        "maps":    "https://maps.google.com",
        "whatsapp":"https://web.whatsapp.com",
        "spotify": "https://open.spotify.com",
        "amazon":  "https://www.amazon.in",
        "flipkart":"https://www.flipkart.com",
    }
    url = urls.get(site)
    if url:
        webbrowser.open(url)
        return url
    url = f"https://www.{site}.com"
    webbrowser.open(url)
    return url

# ---------------------------------------------------------------------------
# File Creation
# ---------------------------------------------------------------------------

def create_file(filename, folder_name):
    folder_name = folder_name.lower().strip()
    path = COMMON_FOLDERS.get(folder_name)
    if not path and os.path.exists(folder_name):
        path = Path(folder_name)
    if path and path.exists():
        filepath = path / filename
        try:
            filepath.touch()
            return str(filepath)
        except Exception as e:
            print(f"Error creating file: {e}")
    return None

# ---------------------------------------------------------------------------
# Delete File
# ---------------------------------------------------------------------------

def delete_file(filename, folder_name):
    folder_name = folder_name.lower().strip()
    path = COMMON_FOLDERS.get(folder_name)
    if not path and os.path.exists(folder_name):
        path = Path(folder_name)
    if path and path.exists():
        filepath = path / filename
        if filepath.exists():
            try:
                filepath.unlink()
                return str(filepath)
            except Exception as e:
                print(f"Error deleting file: {e}")
    return None

# ---------------------------------------------------------------------------
# Rename File
# ---------------------------------------------------------------------------

def rename_file(old_name, new_name, folder_name):
    folder_name = folder_name.lower().strip()
    path = COMMON_FOLDERS.get(folder_name)
    if not path and os.path.exists(folder_name):
        path = Path(folder_name)
    if path and path.exists():
        old_path = path / old_name
        new_path = path / new_name
        if old_path.exists():
            try:
                old_path.rename(new_path)
                return str(new_path)
            except Exception as e:
                print(f"Error renaming file: {e}")
    return None

# ---------------------------------------------------------------------------
# Move File
# ---------------------------------------------------------------------------

def move_file(filename, from_folder, to_folder):
    from_path = COMMON_FOLDERS.get(from_folder.lower().strip())
    to_path   = COMMON_FOLDERS.get(to_folder.lower().strip())
    if not from_path:
        from_path = Path(from_folder) if os.path.exists(from_folder) else None
    if not to_path:
        to_path = Path(to_folder) if os.path.exists(to_folder) else None
    if from_path and to_path and from_path.exists() and to_path.exists():
        src = from_path / filename
        if src.exists():
            try:
                dest = shutil.move(str(src), str(to_path / filename))
                return dest
            except Exception as e:
                print(f"Error moving file: {e}")
    return None

# ---------------------------------------------------------------------------
# Volume Control (Windows — pycaw)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# pycaw version-compatible volume helper
# pycaw ≤ 2024  : GetSpeakers() returns raw COM → .Activate(iid, ctx, None)
# pycaw 20251023+: GetSpeakers() returns AudioDevice → .activate(Interface)
# ---------------------------------------------------------------------------

def _get_volume_obj():
    """Return a ready-to-use IAudioEndpointVolume pointer, regardless of pycaw version."""
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

    speakers = AudioUtilities.GetSpeakers()

    # pycaw 20251023+ — AudioDevice has lowercase .activate()
    if hasattr(speakers, 'activate'):
        return speakers.activate(IAudioEndpointVolume)

    # Older pycaw — AudioDevice wraps raw IMMDevice in ._dev
    if hasattr(speakers, '_dev'):
        ptr = speakers._dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        return cast(ptr, POINTER(IAudioEndpointVolume))

    # Very old pycaw — GetSpeakers() returned the raw COM object directly
    if hasattr(speakers, 'Activate'):
        ptr = speakers.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        return cast(ptr, POINTER(IAudioEndpointVolume))

    raise RuntimeError("Unsupported pycaw version — cannot get volume interface")


def set_volume(level: int):
    """Set master volume 0-100."""
    try:
        vol = _get_volume_obj()
        scalar = max(0.0, min(1.0, level / 100.0))
        vol.SetMasterVolumeLevelScalar(scalar, None)
        return True
    except Exception as e:
        print(f"Volume error: {e}")
        return False


def get_volume() -> int:
    """Get current master volume as 0-100."""
    try:
        vol = _get_volume_obj()
        return int(vol.GetMasterVolumeLevelScalar() * 100)
    except Exception:
        return -1


def change_volume(direction: str, step: int = 10) -> dict:
    """direction: 'up', 'down', or 'mute'. Falls back to PowerShell on error."""
    try:
        vol = _get_volume_obj()

        if direction == "mute":
            muted = vol.GetMute()
            vol.SetMute(not muted, None)
            return {"success": True, "text": "Unmuted 🔊" if muted else "Muted 🔇"}

        current = vol.GetMasterVolumeLevelScalar()
        new_vol = min(1.0, current + step / 100.0) if direction == "up" else max(0.0, current - step / 100.0)
        vol.SetMasterVolumeLevelScalar(new_vol, None)
        pct = int(new_vol * 100)
        label = "increased" if direction == "up" else "decreased"
        return {"success": True, "text": f"Volume {label} to {pct}% 🔊"}

    except Exception as pycaw_err:
        # ── PowerShell fallback (SendKeys volume keys) ────────────────
        try:
            if direction == "mute":
                key = "[char]173"
                presses = 1
            elif direction == "up":
                key = "[char]175"
                presses = max(1, step // 2)
            else:
                key = "[char]174"
                presses = max(1, step // 2)

            ps_cmd = (
                f'$sh = New-Object -ComObject WScript.Shell; '
                f'1..{presses} | ForEach-Object {{ $sh.SendKeys({key}) }}'
            )
            subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps_cmd],
                capture_output=True, timeout=5
            )
            label = "toggled" if direction == "mute" else ("increased" if direction == "up" else "decreased")
            emoji = "🔇" if direction == "mute" else "🔊"
            return {"success": True, "text": f"Volume {label} {emoji}"}
        except Exception as ps_err:
            return {"success": False, "text": f"Volume error: {pycaw_err} | Fallback: {ps_err}"}

# ---------------------------------------------------------------------------
# Screenshot
# ---------------------------------------------------------------------------

def take_screenshot() -> dict:
    """Takes a screenshot and saves it to Desktop."""
    try:
        import pyautogui
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = COMMON_FOLDERS["desktop"] / f"screenshot_{ts}.png"
        screenshot = pyautogui.screenshot()
        screenshot.save(str(save_path))
        return {"success": True, "text": f"Screenshot saved to Desktop: screenshot_{ts}.png 📸"}
    except Exception as e:
        return {"success": False, "text": f"Screenshot failed: {str(e)}"}

# ---------------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------------

def get_battery() -> dict:
    """Returns battery percentage and charging status."""
    try:
        import psutil
        battery = psutil.sensors_battery()
        if battery is None:
            return {"success": False, "text": "No battery detected (desktop PC)."}
        percent = int(battery.percent)
        plugged = battery.power_plugged
        status = "charging 🔌" if plugged else "on battery 🔋"
        emoji = "🔋" if percent > 50 else ("⚡" if percent > 20 else "🪫")
        return {"success": True, "text": f"Battery: {percent}% — {status} {emoji}"}
    except Exception as e:
        return {"success": False, "text": f"Battery check failed: {str(e)}"}

# ---------------------------------------------------------------------------
# Shutdown / Restart / Lock
# ---------------------------------------------------------------------------

def shutdown_computer(delay: int = 10) -> dict:
    try:
        if os.name == 'nt':
            os.system(f"shutdown /s /t {delay}")
        else:
            os.system(f"shutdown -h +{delay // 60}")
        return {"success": True, "text": f"Shutting down in {delay} seconds... Save your work! ⚠️"}
    except Exception as e:
        return {"success": False, "text": f"Shutdown failed: {str(e)}"}

def restart_computer(delay: int = 10) -> dict:
    try:
        if os.name == 'nt':
            os.system(f"shutdown /r /t {delay}")
        else:
            os.system(f"shutdown -r +{delay // 60}")
        return {"success": True, "text": f"Restarting in {delay} seconds... Save your work! ⚠️"}
    except Exception as e:
        return {"success": False, "text": f"Restart failed: {str(e)}"}

def cancel_shutdown() -> dict:
    try:
        if os.name == 'nt':
            os.system("shutdown /a")
        return {"success": True, "text": "Shutdown cancelled ✅"}
    except Exception as e:
        return {"success": False, "text": f"Cancel shutdown failed: {str(e)}"}

def lock_screen() -> dict:
    try:
        if os.name == 'nt':
            import ctypes
            ctypes.windll.user32.LockWorkStation()
        return {"success": True, "text": "Screen locked 🔒"}
    except Exception as e:
        return {"success": False, "text": f"Lock failed: {str(e)}"}

# ---------------------------------------------------------------------------
# Open App by Name
# ---------------------------------------------------------------------------

APP_MAP = {
    "notepad":    "notepad.exe",
    "calculator": "calc.exe",
    "paint":      "mspaint.exe",
    "wordpad":    "wordpad.exe",
    "cmd":        "cmd.exe",
    "powershell": "powershell.exe",
    "explorer":   "explorer.exe",
    "task manager": "taskmgr.exe",
    "chrome":     "chrome.exe",
    "firefox":    "firefox.exe",
    "edge":       "msedge.exe",
    "vlc":        "vlc.exe",
    "spotify":    "spotify.exe",
    "discord":    "discord.exe",
    "zoom":       "zoom.exe",
    "slack":      "slack.exe",
    "word":       "winword.exe",
    "excel":      "excel.exe",
    "powerpoint": "powerpnt.exe",
    "outlook":    "outlook.exe",
    "teams":      "teams.exe",
    "obs":        "obs64.exe",
    "postman":    "postman.exe",
}

def open_app(app_name: str) -> dict:
    app_name = app_name.lower().strip()
    exe = APP_MAP.get(app_name)
    try:
        if exe:
            subprocess.Popen(exe, shell=True)
        else:
            # Try to run directly
            subprocess.Popen(app_name, shell=True)
        return {"success": True, "text": f"Opening {app_name}... 🚀"}
    except Exception as e:
        return {"success": False, "text": f"Could not open {app_name}: {str(e)}"}

# ---------------------------------------------------------------------------
# Kill Process
# ---------------------------------------------------------------------------

def kill_process(name: str) -> dict:
    try:
        import psutil
        name_lower = name.lower()
        killed = []
        for proc in psutil.process_iter(['name', 'pid']):
            try:
                if name_lower in proc.info['name'].lower():
                    proc.kill()
                    killed.append(proc.info['name'])
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        if killed:
            return {"success": True, "text": f"Closed: {', '.join(set(killed))} ✅"}
        return {"success": False, "text": f"No running process found for: {name}"}
    except Exception as e:
        return {"success": False, "text": f"Could not close {name}: {str(e)}"}


# ---------------------------------------------------------------------------
# System Stats (CPU / RAM / Disk / Network / Uptime)
# ---------------------------------------------------------------------------

def get_system_stats() -> dict:
    """Returns CPU, RAM, disk usage, network I/O, and system uptime."""
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net = psutil.net_io_counters()
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime_delta = datetime.now() - boot_time
        hours, remainder = divmod(int(uptime_delta.total_seconds()), 3600)
        minutes = remainder // 60
        uptime_str = f"{hours}h {minutes}m"

        def _fmt_bytes(b):
            if b >= 1_073_741_824:
                return f"{b/1_073_741_824:.1f} GB"
            return f"{b/1_048_576:.0f} MB"

        data = {
            "cpu": cpu,
            "ram_used": round(mem.used / 1_073_741_824, 1),
            "ram_total": round(mem.total / 1_073_741_824, 1),
            "ram_pct": mem.percent,
            "disk_used": round(disk.used / 1_073_741_824, 1),
            "disk_total": round(disk.total / 1_073_741_824, 1),
            "disk_pct": disk.percent,
            "net_sent": _fmt_bytes(net.bytes_sent),
            "net_recv": _fmt_bytes(net.bytes_recv),
            "uptime": uptime_str,
        }
        text = (
            f"System: CPU {cpu}% | RAM {data['ram_used']}/{data['ram_total']} GB ({mem.percent}%) | "
            f"Disk {data['disk_used']}/{data['disk_total']} GB ({disk.percent}%) | Uptime {uptime_str}"
        )
        return {"success": True, "text": text, "data": data}
    except Exception as e:
        return {"success": False, "text": f"System stats error: {str(e)}"}


# ---------------------------------------------------------------------------
# Clipboard
# ---------------------------------------------------------------------------

def clipboard_read() -> dict:
    """Reads the current clipboard text content."""
    try:
        import pyperclip
        content = pyperclip.paste()
        if not content or not content.strip():
            return {"success": False, "text": "Clipboard is empty."}
        preview = content[:300] + ("..." if len(content) > 300 else "")
        return {"success": True, "text": f"📋 Clipboard: {preview}", "data": content}
    except ImportError:
        return {"success": False, "text": "pyperclip not installed. Run: pip install pyperclip"}
    except Exception as e:
        return {"success": False, "text": f"Clipboard read error: {str(e)}"}


def clipboard_write(text: str) -> dict:
    """Writes text to the clipboard."""
    try:
        import pyperclip
        pyperclip.copy(text)
        return {"success": True, "text": f"📋 Copied to clipboard: {text[:80]}{'...' if len(text) > 80 else ''}"}
    except ImportError:
        return {"success": False, "text": "pyperclip not installed. Run: pip install pyperclip"}
    except Exception as e:
        return {"success": False, "text": f"Clipboard write error: {str(e)}"}


# ---------------------------------------------------------------------------
# Network Info & Ping
# ---------------------------------------------------------------------------

def get_network_info() -> dict:
    """Gets public IP, approximate location via ipify + ip-api."""
    import urllib.request, json as _json
    try:
        # Get public IP
        ip_data = urllib.request.urlopen("https://api.ipify.org?format=json", timeout=5).read()
        public_ip = _json.loads(ip_data)["ip"]

        # Get ISP + location
        geo_data = _json.loads(
            urllib.request.urlopen(f"http://ip-api.com/json/{public_ip}?fields=country,city,isp,org", timeout=5).read()
        )
        city = geo_data.get("city", "Unknown")
        country = geo_data.get("country", "Unknown")
        isp = geo_data.get("isp", geo_data.get("org", "Unknown"))

        data = {
            "ip": public_ip,
            "city": city,
            "country": country,
            "isp": isp,
        }
        text = f"🌐 Public IP: {public_ip} | Location: {city}, {country} | ISP: {isp}"
        return {"success": True, "text": text, "data": data}
    except Exception as e:
        return {"success": False, "text": f"Network info error: {str(e)}"}


def ping_host(host: str = "google.com") -> dict:
    """Pings a host and returns latency in ms."""
    import subprocess, re as _re
    try:
        host = host.strip().lower()
        # Clean up common phrases
        host = host.replace("http://", "").replace("https://", "").split("/")[0]
        if os.name == 'nt':
            result = subprocess.run(
                ["ping", "-n", "3", host],
                capture_output=True, text=True, timeout=10
            )
            output = result.stdout
            m = _re.search(r"Average\s*=\s*(\d+)ms", output)
            latency = m.group(1) if m else "?"
        else:
            result = subprocess.run(
                ["ping", "-c", "3", host],
                capture_output=True, text=True, timeout=10
            )
            output = result.stdout
            m = _re.search(r"avg.*?([\d.]+)/", output)
            latency = str(int(float(m.group(1)))) if m else "?"

        if latency == "?":
            return {"success": False, "text": f"Could not reach {host}."}
        return {
            "success": True,
            "text": f"📡 Ping {host}: {latency} ms average latency",
            "data": {"host": host, "latency_ms": latency},
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "text": f"Ping timed out for {host}."}
    except Exception as e:
        return {"success": False, "text": f"Ping error: {str(e)}"}


# ---------------------------------------------------------------------------
# Command Analytics
# ---------------------------------------------------------------------------

def get_analytics(history: list[dict]) -> dict:
    """Computes analytics from the chat history list."""
    try:
        from collections import Counter
        total = len(history)
        user_msgs = [m for m in history if m.get("role") == "user"]
        assistant_msgs = [m for m in history if m.get("role") == "assistant"]

        # Count intent types from history (rough word-frequency on user messages)
        INTENT_KEYWORDS = {
            "Weather": ["weather"],
            "Wikipedia": ["who is", "what is", "wiki"],
            "Timer": ["timer"],
            "News": ["news", "headline"],
            "Volume": ["volume", "mute"],
            "Screenshot": ["screenshot"],
            "File Ops": ["file", "folder", "create", "delete", "rename", "move"],
            "Apps": ["open", "close", "kill"],
            "Search": ["search", "google"],
            "System": ["battery", "shutdown", "restart", "lock"],
            "Macros": ["macro"],
            "Reminders": ["remind"],
            "Network": ["ip", "ping", "network"],
            "Clipboard": ["clipboard"],
            "Stats": ["system stats", "dashboard"],
            "Calculator": ["calculate", "compute"],
        }

        intent_counts = Counter()
        for msg in user_msgs:
            content = msg.get("content", "").lower()
            for intent, keywords in INTENT_KEYWORDS.items():
                if any(kw in content for kw in keywords):
                    intent_counts[intent] += 1
                    break

        top_intents = intent_counts.most_common(8)
        top_list = [{"name": name, "count": count} for name, count in top_intents]
        max_count = top_list[0]["count"] if top_list else 1
        for item in top_list:
            item["pct"] = round((item["count"] / max_count) * 100)

        data = {
            "total_messages": total,
            "user_commands": len(user_msgs),
            "assistant_responses": len(assistant_msgs),
            "top_intents": top_list,
        }
        text = f"📊 Analytics: {len(user_msgs)} commands total. Most used: {top_list[0]['name'] if top_list else 'N/A'}"
        return {"success": True, "text": text, "data": data}
    except Exception as e:
        return {"success": False, "text": f"Analytics error: {str(e)}"}
