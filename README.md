# Mem0 AI: Voice-Controlled Local AI Agent
### AI/ML & Generative AI Developer Intern Assignment

This project is a sophisticated, local-first AI agent designed to bridge the gap between voice commands and system-level execution. It leverages state-of-the-art open-source models to provide a seamless, secure, and context-aware user experience.

---

## Architecture & System Design 

The system follows a modular pipeline architecture to ensure low latency and high reliability:

1.  **Frontend (React.js)**: A custom-built command center that handles audio capture (MediaRecorder API) and manages the Human-in-the-Loop approval state.
2.  [cite_start]**STT Engine (Faster-Whisper)**: Audio is processed locally using a quantized HuggingFace model (`faster-whisper`) to convert speech into high-accuracy text[cite: 10, 13].
3.  [cite_start]**Inference Engine (Ollama/Llama 3)**: Transcribed text is analyzed by Llama 3. The agent utilizes a strictly engineered prompt and Ollama's JSON mode to extract intent, parameters, and content[cite: 17].
4.  [cite_start]**Tool Executor (Python/Flask)**: A secure backend translates the LLM's JSON intent into physical system actions (file creation, code writing, or text processing)[cite: 23, 24].

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
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
pip install flask flask-cors faster-whisper ollama
python3 app.py
2. Frontend Configuration

Bash
cd frontend
npm install
npm start
⚡ Features & Assignment Compliance
Core Requirements

Dual Input: Fully supports both Direct Microphone Input and Audio File Uploads (.wav, .mp3, .webm, etc.) .

Intent Understanding: Accurately classifies and executes: create_file, write_code, summarize_text, and general_chat .

UI Clarity: The dashboard explicitly visualizes the Transcription, Intent classification, System Action, and Final Result .

Safety Lock: Mandatory Constraint Met. All file and code operations are strictly restricted to the /output folder within the repository to prevent system overwrites.

Implemented Bonuses  

Human-in-the-Loop: Integrated a UI confirmation step requiring manual approval before any local file operation.

Memory: Implemented persistent session history, allowing the agent to handle context-aware follow-up commands.

Graceful Degradation: Built-in error handling for silent audio or unmapped intent edge cases.

Compound Commands: Optimized the extraction logic to handle multi-part instructions (e.g., "Write code for X and save to Y").

 Hardware Notes & Workarounds 

STT Selection: I chose faster-whisper (base) over standard whisper to allow for real-time CPU-bound transcription without requiring a dedicated GPU.

Inference: Llama 3 is served locally via Ollama. For systems with less than 8GB of RAM, I recommend using the phi3 or mistral model as a lightweight alternative to ensure smooth execution.
