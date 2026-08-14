import speech_recognition as sr

def test_microphone():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Adjusting for ambient noise... Please stay quiet for 2 seconds.")
        r.adjust_for_ambient_noise(source, duration=2)
        print("Listening for 3 seconds. Please say something now!")
        try:
            audio = r.listen(source, timeout=5, phrase_time_limit=3)
            print("Finished recording. Saving to test_mic_output.wav...")
            with open("test_mic_output.wav", "wb") as f:
                f.write(audio.get_wav_data())
            print("Saved! Please open the backend folder and play 'test_mic_output.wav' to hear exactly what Python recorded.")
        except sr.WaitTimeoutError:
            print("Timed out. No speech detected at all.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_microphone()
