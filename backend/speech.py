import pyttsx3
import speech_recognition as sr
import threading


class SpeechManager:
    def __init__(self):
        self.tts_enabled = True
        self.voice_speed = 160
        self._tts_lock = threading.Lock()
        self.recognizer = sr.Recognizer()
        self.is_listening = False
        self._init_tts()

    def _init_tts(self):
        """Initialize TTS engine (safely)."""
        try:
            self._preferred_voice_id = None
            engine = pyttsx3.init()
            voices = engine.getProperty('voices')
            if voices:
                for voice in voices:
                    if "Zira" in voice.name or "female" in voice.name.lower():
                        self._preferred_voice_id = voice.id
                        break
                if not self._preferred_voice_id:
                    self._preferred_voice_id = voices[0].id
            engine.stop()
        except Exception as e:
            print(f"TTS init warning: {e}")
            self._preferred_voice_id = None

    def update_settings(self, settings: dict):
        """Update TTS settings from settings dict."""
        self.tts_enabled = settings.get("tts_enabled", True)
        self.voice_speed = settings.get("voice_speed", 160)

    def speak(self, text: str):
        """Runs TTS in a separate thread (non-blocking). Skips if TTS is disabled."""
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
                        engine.setProperty('voice', self._preferred_voice_id)
                    engine.setProperty('rate', self.voice_speed)
                    engine.say(text)
                    engine.runAndWait()
                except Exception as e:
                    print(f"TTS error: {e}")

        t = threading.Thread(target=_speak, daemon=True)
        t.start()

    def listen(self):
        """
        Listens to microphone and returns (text, error_msg).
        Blocking — call via asyncio.to_thread from async context.
        """
        with sr.Microphone() as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            print("Listening...")
            self.is_listening = True
            try:
                audio = self.recognizer.listen(source, timeout=8, phrase_time_limit=10)
                self.is_listening = False
                print("Processing speech...")
                text = self.recognizer.recognize_google(audio)
                return text.lower(), None
            except sr.WaitTimeoutError:
                self.is_listening = False
                return None, "Timed out. Is your microphone muted? 🎤"
            except sr.UnknownValueError:
                self.is_listening = False
                return None, "Couldn't understand speech. Try speaking closer to the mic."
            except Exception as e:
                self.is_listening = False
                return None, f"Speech error: {str(e)}"
