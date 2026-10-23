import datetime
import pyttsx3
import speech_recognition as sr
from google import genai

# Initialize Gemini Client (Ensure GEMINI_API_KEY is set in your environment variables)
# Alternatively, pass it directly: client = genai.Client(api_key="YOUR_API_KEY")
client = genai.Client()

# Initialize Text-to-Speech Engine
engine = pyttsx3.init()
voices = engine.getProperty('voices')
# Set a smooth voice if available (index 0 or 1 usually represents different system voices)
engine.setProperty('voice', voices[0].id)
engine.setProperty('rate', 185)  # Speed of speech


def speak(text):
  """Converts text to speech for JARVIS responses."""
  print(f"JARVIS: {text}")
  engine.say(text)
  engine.runAndWait()


def listen_command():
  """Listens to microphone input and converts it to text."""
  r = sr.Recognizer()
  with sr.Microphone() as source:
    print("\nListening for command...")
    r.adjust_for_ambient_noise(source, duration=0.8)
    try:
      audio = r.listen(source, timeout=5, phrase_time_limit=8)
      command = r.recognize_google(audio)
      print(f"User: {command}")
      return command.lower()
    except sr.WaitTimeoutError:
      return ""
    except sr.UnknownValueError:
      speak("I couldn't quite catch that, Sir.")
      return ""
    except Exception as e:
      print(f"Audio Error: {e}")
      return ""


def ask_gemini(prompt):
  """Sends complex or open-ended prompts to the Google Gemini model."""
  preferred_models = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
  ]

  last_error = None
  for model_name in preferred_models:
    try:
      response = client.models.generate_content(
          model=model_name,
          contents=(
              "You are J.A.R.V.I.S., Tony Stark's highly intelligent, witty, and"
              " formal AI assistant. Address the user respectfully as 'Sir' or"
              f" 'Commander'. Keep answers concise. Prompt: {prompt}"
          ),
      )
      if response and getattr(response, "text", None):
        return response.text
    except Exception as e:
      last_error = e
      print(f"Gemini model {model_name} failed: {e}")
      continue

  return "I am experiencing temporary connection issues with my core systems, Sir."


def run_jarvis():
  speak(
      "J.A.R.V.I.S. online and operational. All systems nominal. How may I"
      " assist you today, Sir?"
  )

  while True:
    command = listen_command()

    if not command:
      continue

    # Local commands mapping
    if "exit" in command or "shutdown" in command:
      speak("Powering down systems. Have a pleasant day, Sir.")
      break

    elif "time" in command:
      current_time = datetime.datetime.now().strftime("%I:%M %p")
      speak(f"The current time is {current_time}, Sir.")

    elif "date" in command:
      current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")
      speak(f"Today's date is {current_date}.")

    else:
      # Fallback to Gemini AI for general knowledge, chat, or coding help
      ai_response = ask_gemini(command)
      speak(ai_response)


if __name__ == "__main__":
  run_jarvis()