"""
speech.py — Speech I/O Manager for ARIA
STT: faster-whisper (offline, no API) with Google fallback
TTS: pyttsx3 (Windows SAPI, offline)
"""

import threading
import tempfile
import os

# ── TTS ───────────────────────────────────────────────────────────────────────
import pyttsx3

# ── STT ───────────────────────────────────────────────────────────────────────
try:
    import speech_recognition as sr
    _SR_AVAILABLE = True
except ImportError:
    _SR_AVAILABLE = False

# Try faster-whisper first (offline, much better accuracy)
try:
    from faster_whisper import WhisperModel
    _WHISPER_AVAILABLE = True
except ImportError:
    _WHISPER_AVAILABLE = False


class SpeechManager:
    def __init__(self):
        self.tts_enabled   = True
        self.voice_speed   = 160
        self.jarvis_mode   = False
        self._tts_lock     = threading.Lock()
        self.is_listening  = False
        self._whisper_model = None
        self._whisper_loading = False

        if _SR_AVAILABLE:
            self.recognizer = sr.Recognizer()
        else:
            self.recognizer = None

        self._select_preferred_voice()
        # Load Whisper in background so startup is not blocked
        threading.Thread(target=self._load_whisper, daemon=True).start()

    # ── TTS voice selection ───────────────────────────────────────────────────
    def _select_preferred_voice(self):
        try:
            self._preferred_voice_id = None
            engine = pyttsx3.init()
            voices = engine.getProperty("voices")
            if voices:
                if self.jarvis_mode:
                    # 1. Try to find a British voice (Hazel, George, GB, UK)
                    for v in voices:
                        v_name = v.name.lower()
                        if "gb" in v_name or "great britain" in v_name or "united kingdom" in v_name or "hazel" in v_name or "george" in v_name:
                            self._preferred_voice_id = v.id
                            break
                    # 2. Try to find any male voice
                    if not self._preferred_voice_id:
                        for v in voices:
                            v_name = v.name.lower()
                            if "david" in v_name or "male" in v_name:
                                self._preferred_voice_id = v.id
                                break
                else:
                    # Female voice (Zira)
                    for v in voices:
                        v_name = v.name.lower()
                        if "zira" in v_name or "female" in v_name:
                            self._preferred_voice_id = v.id
                            break

                if not self._preferred_voice_id:
                    self._preferred_voice_id = voices[0].id
            engine.stop()
        except Exception as e:
            print(f"[TTS] init/voice selection warning: {e}")
            self._preferred_voice_id = None

    # ── Whisper model loader ───────────────────────────────────────────────────
    def _load_whisper(self):
        if not _WHISPER_AVAILABLE:
            return
        try:
            self._whisper_loading = True
            print("[Whisper] Loading model (base)...")
            # "base" model: ~150MB, runs on CPU fine
            self._whisper_model = WhisperModel(
                "base",
                device="cpu",
                compute_type="int8",   # fastest on CPU
            )
            print("[Whisper] Model ready ✓")
        except Exception as e:
            print(f"[Whisper] Load failed, will use Google STT: {e}")
            self._whisper_model = None
        finally:
            self._whisper_loading = False

    # ── Settings ───────────────────────────────────────────────────────────────
    def update_settings(self, settings: dict):
        self.tts_enabled = settings.get("tts_enabled", True)
        self.voice_speed = settings.get("voice_speed", 160)
        self.jarvis_mode = settings.get("jarvis_mode", False)
        self._select_preferred_voice()

    # ── TTS speak ─────────────────────────────────────────────────────────────
    def speak(self, text: str):
        if not self.tts_enabled:
            return

        def _speak():
            with self._tts_lock:
                try:
                    import pythoncom
                    pythoncom.CoInitialize()
                except ImportError:
                    pass
                try:
                    engine = pyttsx3.init()
                    if self._preferred_voice_id:
                        engine.setProperty("voice", self._preferred_voice_id)
                    engine.setProperty("rate", self.voice_speed)
                    engine.say(text)
                    engine.runAndWait()
                except Exception as e:
                    print(f"[TTS] error: {e}")

        threading.Thread(target=_speak, daemon=True).start()

    # ── STT listen ─────────────────────────────────────────────────────────────
    def listen(self):
        """
        Record mic → transcribe with Whisper (offline) or Google (fallback).
        Returns (text, error_msg).  Blocking — call via asyncio.to_thread.
        """
        if not _SR_AVAILABLE:
            return None, "speech_recognition not installed."

        try:
            with sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.4)
                print("[Listen] Waiting for speech...")
                self.is_listening = True
                audio = self.recognizer.listen(source, timeout=8, phrase_time_limit=12)
                self.is_listening = False
                print("[Listen] Got audio, transcribing...")
        except sr.WaitTimeoutError:
            self.is_listening = False
            return None, "Timed out. Is your microphone muted? 🎤"
        except Exception as e:
            self.is_listening = False
            return None, f"Mic error: {e}"

        # ── Try Whisper first ─────────────────────────────────────────────────
        if self._whisper_model is not None:
            try:
                return self._transcribe_whisper(audio)
            except Exception as e:
                print(f"[Whisper] transcribe error, falling back: {e}")

        # ── Google fallback ───────────────────────────────────────────────────
        return self._transcribe_google(audio)

    def _transcribe_whisper(self, audio) -> tuple[str | None, str | None]:
        """Transcribe audio using local faster-whisper model."""
        # Write audio to a temp WAV file (faster-whisper needs a file path)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            wav_data = audio.get_wav_data()
            with open(tmp_path, "wb") as f:
                f.write(wav_data)

            segments, info = self._whisper_model.transcribe(
                tmp_path,
                language="en",
                beam_size=3,
                vad_filter=True,       # removes silence
                vad_parameters={"min_silence_duration_ms": 300},
            )
            text = " ".join(s.text for s in segments).strip().lower()
            if not text:
                return None, "Whisper: No speech detected."
            print(f"[Whisper] '{text}' (lang={info.language}, prob={info.language_probability:.2f})")
            return text, None
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    def _transcribe_google(self, audio) -> tuple[str | None, str | None]:
        """Fallback: Google Web Speech API (requires internet)."""
        try:
            text = self.recognizer.recognize_google(audio)
            print(f"[Google STT] '{text}'")
            return text.lower(), None
        except sr.UnknownValueError:
            return None, "Couldn't understand speech. Try speaking closer to the mic."
        except sr.RequestError as e:
            return None, f"Google STT unavailable: {e}"
        except Exception as e:
            return None, f"STT error: {e}"

    @property
    def whisper_ready(self) -> bool:
        return self._whisper_model is not None

    @property
    def stt_engine(self) -> str:
        if self._whisper_loading:
            return "Loading Whisper..."
        return "Whisper (offline)" if self.whisper_ready else "Google STT (online)"
