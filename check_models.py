import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load env specifically from the correct location
env_path = Path("/Users/yuqiaowu/Desktop/第一个链上项目/鲸鱼监控/.env")
load_dotenv(env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

print(f"Using API Key: {GEMINI_API_KEY[:5]}...")
print("Available Models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
