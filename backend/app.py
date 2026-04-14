import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from faster_whisper import WhisperModel
import ollama

app = Flask(__name__)
CORS(app)

# --- 1. System Setup ---
print("Loading Whisper model...")
# Requirement: Using a local model for Speech-to-Text [cite: 13]
model = WhisperModel("base", device="cpu", compute_type="int8")
print("Whisper model loaded!")

UPLOAD_FOLDER = 'temp_audio'
# Safety Constraint: All file operations are restricted to the output/ folder [cite: 26]
OUTPUT_FOLDER = '../output' 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# BONUS: Memory - Maintaining session context [cite: 59]
chat_history = []

# --- 2. Intent Understanding ---
def get_intent_from_llm(user_text):
    """
    Analyzes the transcribed text to classify intent and extract target details.
    Uses Ollama's JSON mode to prevent parsing errors.
    """
    # Memory: Providing context for complex or follow-up commands [cite: 59]
    history_context = "\n".join([f"User: {h['user']}\nAgent: {h['agent']}" for h in chat_history[-3:]])
    
    prompt = f"""
    You are an AI assistant orchestrating a local system.
    History: {history_context}

    Analyze this request and classify it:
    - "create_file": Create a blank file.
    - "write_code": Generate code and save to a file.
    - "summarize_text": Summarize provided content.
    - "general_chat": General question/convo.

    User Request: "{user_text}"

    IMPORTANT: Respond ONLY with a valid JSON object. Escape all newlines in the "content" field as \\n.
    {{
        "intent": "intent_name",
        "filename": "filename_or_null",
        "content": "the_generated_content"
    }}
    """
    try:
        # Using format='json' forces Llama 3 to provide a valid JSON structure 
        response = ollama.chat(
            model='llama3', 
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        raw_content = response['message']['content'].strip()
        
        return json.loads(raw_content)
            
    except Exception as e:
        print(f"LLM Parsing Error: {e}")
        # BONUS: Graceful Degradation - Provides a safe fallback [cite: 58]
        return {"intent": "general_chat", "filename": None, "content": "The agent had trouble formatting the response."}

# --- 3. API Routes ---

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    filename = secure_filename(audio_file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(filepath)

    try:
        # Convert audio input to text [cite: 11]
        segments, _ = model.transcribe(filepath, beam_size=5)
        transcription = " ".join([segment.text for segment in segments])
        
        if not transcription.strip():
            # Graceful Degradation for unintelligible audio [cite: 58]
            return jsonify({"error": "Audio was unintelligible.", "text": ""}), 422

        clean_text = transcription.strip()
        print(f"Transcription: {clean_text}")
        
        # Classify intent for the UI [cite: 33]
        llm_analysis = get_intent_from_llm(clean_text)

        return jsonify({
            "text": clean_text,
            "analysis": llm_analysis
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/execute', methods=['POST'])
def execute_action():
    """
    Executes local tools (File/Code operations) after human-in-the-loop approval[cite: 24, 58].
    """
    data = request.json
    analysis = data.get('analysis', {})
    user_text = data.get('text', '')
    
    intent = analysis.get("intent", "error")
    filename = analysis.get("filename")
    content = analysis.get("content", "")

    result_data = {}

    if intent in ["create_file", "write_code"]:
        if not filename or filename == "null":
            result_data = {"action": "Failed", "result": "No filename was provided."}
        else:
            safe_name = secure_filename(filename)
            filepath = os.path.join(OUTPUT_FOLDER, safe_name)
            try:
                # Execution of file/code generation tasks [cite: 25, 27]
                with open(filepath, 'w') as f:
                    f.write(content if content else "")
                action_type = "Created File" if intent == "create_file" else "Wrote Code"
                result_data = {"action": f"{action_type}: {safe_name}", "result": f"Successfully saved to output/{safe_name}"}
            except Exception as e:
                result_data = {"action": "File Operation Failed", "result": str(e)}

    elif intent == "summarize_text":
        result_data = {"action": "Summarized Text", "result": content}
    elif intent == "general_chat":
        result_data = {"action": "Chat Response", "result": content}
    else:
        result_data = {"action": "Unknown", "result": "Action could not be executed."}

    # Storing to memory [cite: 59]
    chat_history.append({"user": user_text, "agent": result_data.get('result', '')})
    
    return jsonify({"execution": result_data}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)