"""
file_search.py — Enhanced File System operations
Handles: Search by name, Search by extension, Open file, List files in folder, Move file
"""

import os
from pathlib import Path
import shutil
import subprocess

# Paths to search
SEARCH_PATHS = [
    Path.home() / "Desktop",
    Path.home() / "Documents",
    Path.home() / "Downloads",
    Path.home() / "Videos",
    Path.home() / "Videos" / "Screen Recordings",
    Path.home() / "Videos" / "Captures",
    Path.home() / "Pictures",
    Path.home() / "Music",
    Path.home() / "OneDrive" / "Desktop",
    Path.home() / "OneDrive" / "Documents",
    Path.home() / "OneDrive" / "Videos",
    Path.home() / "OneDrive" / "Pictures",
]

FOLDER_MAP = {
    "desktop":   Path.home() / "Desktop",
    "documents": Path.home() / "Documents",
    "downloads": Path.home() / "Downloads",
    "pictures":  Path.home() / "Pictures",
    "videos":    Path.home() / "Videos",
    "music":     Path.home() / "Music",
}

VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'}

# ---------------------------------------------------------------------------
# Search files by name query
# ---------------------------------------------------------------------------

def search_files(query: str, is_video: bool = False, extension: str = None) -> list:
    """
    Brute-force search over specific folders.
    Supports: name query, video-only filter, extension filter (e.g. '.pdf').
    """
    results = []
    query = query.lower()

    if extension and not extension.startswith('.'):
        extension = '.' + extension

    for base_path in SEARCH_PATHS:
        if not base_path.exists():
            continue
        for root, dirs, files in os.walk(base_path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                ext = Path(file).suffix.lower()

                # Extension filter mode: ignore query, match extension only
                if extension:
                    if ext != extension.lower():
                        continue
                    # Optional name filter
                    if query and query not in file.lower():
                        continue
                else:
                    if query not in file.lower():
                        continue
                    if is_video and ext not in VIDEO_EXTENSIONS:
                        continue

                full_path = os.path.join(root, file)
                results.append({"name": file, "path": full_path})

                if len(results) >= 10:
                    return results

    return results


# ---------------------------------------------------------------------------
# Open a file directly
# ---------------------------------------------------------------------------

def open_file(filename: str, folder_name: str = None) -> dict:
    """
    Opens a file with the default application.
    If folder_name is given, looks there first. Otherwise searches common folders.
    """
    # Try specific folder first
    if folder_name:
        folder = FOLDER_MAP.get(folder_name.lower().strip())
        if folder and folder.exists():
            filepath = folder / filename
            if filepath.exists():
                try:
                    os.startfile(str(filepath))
                    return {"success": True, "text": f"Opening {filename} 📂"}
                except Exception as e:
                    return {"success": False, "text": f"Could not open file: {str(e)}"}

    # Search in all common folders
    results = search_files(filename)
    if results:
        try:
            os.startfile(results[0]["path"])
            return {"success": True, "text": f"Opening {results[0]['name']} from {results[0]['path']}"}
        except Exception as e:
            return {"success": False, "text": f"Found but could not open: {str(e)}"}

    return {"success": False, "text": f"File not found: {filename}"}


# ---------------------------------------------------------------------------
# List files in a folder
# ---------------------------------------------------------------------------

def list_files(folder_name: str, extension: str = None) -> dict:
    """Lists files in a known folder, optionally filtered by extension."""
    folder = FOLDER_MAP.get(folder_name.lower().strip())
    if not folder or not folder.exists():
        return {"success": False, "text": f"Could not find folder: {folder_name}"}

    try:
        all_files = []
        for f in sorted(folder.iterdir()):
            if f.is_file():
                if extension:
                    if not extension.startswith('.'):
                        extension = '.' + extension
                    if f.suffix.lower() != extension.lower():
                        continue
                all_files.append(f.name)

        if not all_files:
            return {"success": False, "text": f"No files found in {folder_name}."}

        # Limit to 10 items
        shown = all_files[:10]
        extra = len(all_files) - 10 if len(all_files) > 10 else 0
        text = f"Files in {folder_name.title()} ({len(all_files)} total):\n"
        text += "\n".join(f"• {name}" for name in shown)
        if extra > 0:
            text += f"\n... and {extra} more"

        return {"success": True, "text": text, "data": shown}
    except Exception as e:
        return {"success": False, "text": f"Error listing files: {str(e)}"}


# ---------------------------------------------------------------------------
# Move file between known folders
# ---------------------------------------------------------------------------

def move_file(filename: str, to_folder: str) -> dict:
    """
    Searches for filename in all common folders and moves it to to_folder.
    """
    to_path = FOLDER_MAP.get(to_folder.lower().strip())
    if not to_path or not to_path.exists():
        return {"success": False, "text": f"Destination folder not found: {to_folder}"}

    # Find the file
    results = search_files(filename)
    if not results:
        return {"success": False, "text": f"File not found: {filename}"}

    src = Path(results[0]["path"])
    dest = to_path / src.name

    if dest == src:
        return {"success": False, "text": f"{filename} is already in {to_folder}."}

    try:
        shutil.move(str(src), str(dest))
        return {"success": True, "text": f"Moved {src.name} to {to_folder.title()} ✅"}
    except Exception as e:
        return {"success": False, "text": f"Move failed: {str(e)}"}
