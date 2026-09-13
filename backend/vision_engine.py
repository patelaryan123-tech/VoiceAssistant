"""
vision_engine.py — ARIA Computer Vision via YOLOv8
Streams webcam frames annotated with bounding boxes via WebSocket callback
"""

import base64
import threading
import time
from typing import Callable, Optional

try:
    import cv2
    _CV2_OK = True
except ImportError:
    _CV2_OK = False

try:
    from ultralytics import YOLO
    _YOLO_OK = True
except ImportError:
    _YOLO_OK = False


class VisionEngine:
    """YOLOv8n real-time webcam object detection."""

    FPS_TARGET = 5          # frames per second (keep CPU light)
    CONF_THRESH = 0.55      # min confidence to show label (increased from 0.40 to reduce false positives)

    def __init__(self):
        self._model      : Optional[object] = None
        self._running    : bool = False
        self._thread     : Optional[threading.Thread] = None
        self._callback   : Optional[Callable] = None
        self._loading    : bool = False
        self._session_detections: dict = {}
        self._last_summary: Optional[dict] = None

    # ── Model loader ──────────────────────────────────────────────────────────
    def _load_model(self):
        if not _YOLO_OK:
            print("[Vision] ultralytics not installed")
            return
        try:
            self._loading = True
            print("[Vision] Loading YOLOv8n model...")
            self._model = YOLO("yolov8n.pt")   # downloads ~6 MB on first run
            print("[Vision] YOLOv8n ready ✓")
        except Exception as e:
            print(f"[Vision] Model load failed: {e}")
            self._model = None
        finally:
            self._loading = False

    def initialize(self):
        threading.Thread(target=self._load_model, daemon=True).start()

    # ── Start / Stop ──────────────────────────────────────────────────────────
    def start(self, frame_callback: Callable) -> dict:
        if not _CV2_OK:
            return {"success": False, "text": "opencv-python not installed."}
        if not _YOLO_OK:
            return {"success": False, "text": "ultralytics not installed."}
        if self._model is None:
            return {"success": False, "text": "YOLO model not loaded yet. Try again in a moment."}
        if self._running:
            return {"success": True, "text": "Vision is already running."}

        self._session_detections = {}
        self._last_summary = None
        self._callback = frame_callback
        self._running  = True
        self._thread   = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()
        return {"success": True, "text": "👁️ Vision mode activated. I can see through your camera now."}

    def stop(self) -> dict:
        if not self._running and self._last_summary:
            return self._last_summary

        self._running = False
        if self._session_detections:
            items_str = ", ".join([f"{label} ({conf:.0%})" for label, conf in self._session_detections.items()])
            summary = f"👁️ Vision mode deactivated. Objects detected during camera session: {items_str}."
        else:
            summary = "👁️ Vision mode deactivated. No specific objects were detected during this camera session."

        res = {
            "success": True,
            "text": summary,
            "summary": summary,
            "detections": list(self._session_detections.keys())
        }
        self._last_summary = res
        return res

    # ── Capture loop ──────────────────────────────────────────────────────────
    def _capture_loop(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            if self._callback:
                self._callback({
                    "type": "vision_error",
                    "text": "Cannot open webcam. Is it connected and not in use?",
                })
            self._running = False
            return

        interval = 1.0 / self.FPS_TARGET
        while self._running:
            t_start = time.time()
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            try:
                annotated, detections = self._detect(frame)
                jpg_b64 = self._frame_to_b64(annotated)
                if self._callback:
                    self._callback({
                        "type": "vision_frame",
                        "frame": jpg_b64,
                        "detections": detections,
                    })
            except Exception as e:
                print(f"[Vision] Frame error: {e}")

            elapsed = time.time() - t_start
            sleep_t = max(0, interval - elapsed)
            time.sleep(sleep_t)

        cap.release()

    def _detect(self, frame) -> tuple:
        results = self._model(frame, conf=self.CONF_THRESH, verbose=False)
        detections = []
        annotated = frame.copy()

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])
                label  = self._model.names.get(cls_id, str(cls_id))
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]

                detections.append({"label": label, "confidence": round(conf, 2), "box": [x1, y1, x2, y2]})
                self._session_detections[label] = max(self._session_detections.get(label, 0.0), conf)

                # Draw JARVIS-style box
                color = (0, 212, 255)   # cyan BGR ≈ #00D4FF
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                text = f"{label} {conf:.0%}"
                (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
                cv2.putText(annotated, text, (x1 + 3, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

        return annotated, detections

    def _frame_to_b64(self, frame) -> str:
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        return base64.b64encode(buf.tobytes()).decode("utf-8")

    # ── Snapshot ──────────────────────────────────────────────────────────────
    def snapshot(self) -> dict:
        """Capture a single frame and return detections without streaming."""
        if not _CV2_OK or not _YOLO_OK:
            return {"success": False, "text": "Vision deps not available."}
        if self._model is None:
            return {"success": False, "text": "YOLO model not ready yet."}
        try:
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            cap.release()
            if not ret:
                return {"success": False, "text": "Cannot capture from webcam."}
            _, detections = self._detect(frame)
            if not detections:
                return {"success": True, "text": "👁️ I see nothing unusual in front of the camera.", "data": []}
            labels = [f"{d['label']} ({d['confidence']:.0%})" for d in detections]
            return {
                "success": True,
                "text": f"👁️ I can see: {', '.join(labels)}",
                "data": detections,
            }
        except Exception as e:
            return {"success": False, "text": f"Vision snapshot error: {e}"}

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def status(self) -> str:
        if not _CV2_OK or not _YOLO_OK:
            return "disabled (missing deps)"
        if self._loading:
            return "loading model..."
        if self._model is None:
            return "model not loaded"
        return "running" if self._running else "ready"


_vision = VisionEngine()

def get_vision() -> VisionEngine:
    return _vision

def init_vision():
    threading.Thread(target=_vision._load_model, daemon=True).start()
