import requests
import os
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

def test_groq_health():
    print("\n--- Testing Groq API Models ---")
    url = "https://api.groq.com/openai/v1/models"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        models = response.json().get('data', [])
        print(f"Successfully connected to Groq. Found {len(models)} models.")
        # Check for the best versatile model
        has_versatile = any(m['id'] == 'llama-3.3-70b-versatile' for m in models)
        print(f"Llama 3.3 70B Versatile available: {has_versatile}")
    else:
        print(f"Groq API Error: {response.status_code} - {response.text}")

def test_mistral_health():
    print("\n--- Testing Mistral OCR v1/models ---")
    # Mistral v1/models endpoint
    url = "https://api.mistral.ai/v1/models"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print("Successfully connected to Mistral.")
        models = response.json().get('data', [])
        has_ocr = any('ocr' in m['id'].lower() for m in models)
        print(f"Mistral OCR models found: {has_ocr}")
    else:
        print(f"Mistral API Error: {response.status_code} - {response.text}")

def test_question_generation():
    print("\n--- Testing Real-time Question Generation (Groq) ---")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "Generate 1 academic question in JSON format."},
            {"role": "user", "content": "Topic: Photosynthesis. Generate 1 MCQ."}
        ],
        "response_format": {"type": "json_object"}
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        print("Groq Question Generation successful!")
        print(json.dumps(response.json()['choices'][0]['message']['content'], indent=2))
    else:
        print(f"Generation Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    if not GROQ_API_KEY or not MISTRAL_API_KEY:
        print("Error: GROQ_API_KEY or MISTRAL_API_KEY not found in .env")
    else:
        test_groq_health()
        test_mistral_health()
        test_question_generation()
