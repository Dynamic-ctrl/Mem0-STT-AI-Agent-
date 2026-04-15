# Mem0 AI: Voice-Controlled Local AI Agent
### Project Description

This project is a fully local, voice-controlled command center designed to translate spoken audio into direct system actions. 

Instead of interacting with a terminal, users can speak into their microphone (or upload an audio file). The AI agent transcribes the audio, classifies the intent, extracts the necessary parameters, and executes the requested action—such as writing a Python script, summarizing text, or answering general queries—directly on the local machine.

**The Local-First Advantage:** The defining constraint of this project is privacy and edge execution. By utilizing quantized open-source models (Faster-Whisper and Llama 3 via Ollama), **zero data is sent to external cloud APIs**. The entire pipeline—from Speech-to-Text to Large Language Model inference to file execution—runs 100% locally on standard hardware.

**Video Demo:** https://www.youtube.com/watch?v=W3OWmA0l2Ck
**/nTechnical Article:** https://medium.com/@aditimehta307/building-a-voice-controlled-local-ai-agent-architecture-and-implementation-5005dcc24a21

---

## Architecture & System Design

The system follows a modular pipeline architecture to ensure low latency and high reliability:

1. **Frontend (React.js)**: A custom-built command center that handles audio capture (MediaRecorder API) and manages the Human-in-the-Loop approval state.
2. **STT Engine (Faster-Whisper)**: Audio is processed locally using a quantized HuggingFace model (`faster-whisper`) to convert speech into high-accuracy text.
3. **Inference Engine (Ollama/Llama 3)**: Transcribed text is analyzed by Llama 3. The agent utilizes a strictly engineered prompt and Ollama's JSON mode to extract intent, parameters, and content.
4. **Tool Executor (Python/Flask)**: A secure backend translates the LLM's JSON intent into physical system actions (file creation, code writing, or text processing).

---

## Setup & Installation

### Prerequisites
* **Ollama**: Install [Ollama](https://ollama.com/) and download the model:
  ```bash
  ollama pull llama3
  ```
* **Python**: v3.10+
* **Node.js**: v18+

### 1. Backend Configuration
Open a terminal in the `/backend` folder:
```bash
python3 -m venv venv
source venv/bin/activate  # For Windows use: venv\Scripts\activate
pip install flask flask-cors faster-whisper ollama
python3 app.py
```

### 2. Frontend Configuration
Open a new terminal in the `/frontend` folder:
```bash
npm install
npm start
```

---

## Features & Assignment Compliance

### Core Requirements
* **Dual Input**: Fully supports both **Direct Microphone Input** and **Audio File Uploads** (.wav, .mp3, .webm).
* **Intent Understanding**: Accurately classifies and executes: `create_file`, `write_code`, `summarize_text`, and `general_chat`.
* **UI Clarity**: Dashboard visualizes the Transcription, Intent classification, System Action, and Final Result.
* **Safety Lock**: All file and code operations are strictly restricted to the `/output` folder to prevent system overwrites.

### Implemented Bonuses
* **Human-in-the-Loop**: Integrated a UI confirmation step requiring manual approval before any local file operation.
* **Memory**: Implemented persistent session history for context-aware follow-up commands.
* **Graceful Degradation**: Built-in error handling for silent audio or unmapped intent edge cases.
* **Compound Commands**: Optimized extraction logic to handle multi-part instructions (e.g., "Write code for X and save to Y").

---

## Hardware Notes & Workarounds

* **STT Selection**: I chose `faster-whisper` (base) over standard `whisper` to allow for real-time CPU-bound transcription without requiring a dedicated GPU.
* **Inference**: Llama 3 is served locally via Ollama. For systems with less than 8GB of RAM, I recommend using the `phi3` or `mistral` model as a lightweight alternative to ensure smooth execution.
