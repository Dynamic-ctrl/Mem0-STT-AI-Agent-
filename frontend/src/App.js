import React, { useState, useRef } from 'react';

function App() {
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [execution, setExecution] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // --- Logic Handlers ---
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = []; 
        await processAudio(audioBlob, "Microphone Capture");
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      resetState();
      setTranscription('System is listening... Click again to stop.');
    } catch (err) {
      setTranscription("Microphone access denied. Please check system permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Requirement: Upload existing audio files [cite: 7, 9]
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      resetState();
      await processAudio(file, file.name);
      // Reset the file input so you can upload the same file again if needed
      event.target.value = null; 
    }
  };

  const resetState = () => {
    setTranscription('');
    setAnalysis(null);
    setExecution(null);
  };

  const processAudio = async (audioData, sourceName) => {
    setIsLoading(true);
    // Immediate feedback so the screen doesn't show "Awaiting" while the AI works
    setTranscription(`Processing audio from ${sourceName}...`); 
    
    const formData = new FormData();
    formData.append('audio', audioData, 'audio_input.webm');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setTranscription(data.text); // Displays transcribed text [cite: 32]
        setAnalysis(data.analysis); // Displays detected intent [cite: 33]
      } else {
        setTranscription("Error: " + data.error);
      }
    } catch (error) {
      setTranscription("Backend connection failed. Ensure the Flask server is running.");
    }
    setIsLoading(false);
  };

  // Bonus: Human-in-the-Loop approval [cite: 58]
  const approveExecution = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription, analysis: analysis }),
      });
      const data = await response.json();
      setExecution(data.execution); // Displays action and result [cite: 34, 35]
    } catch (error) {
      console.error("Execution error.");
    }
    setIsLoading(false);
  };

  // --- Visual Styles ---
  const styles = {
    container: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      color: '#1e293b',
      padding: '40px 20px',
    },
    wrapper: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '48px',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '900',
      color: '#0f172a',
      letterSpacing: '-0.04em',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1rem',
    },
    controlPanel: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '48px',
    },
    btnBase: {
      padding: '14px 32px',
      fontSize: '15px',
      fontWeight: '600',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      marginBottom: '24px',
    },
    label: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#94a3b8',
      fontWeight: '700',
      marginBottom: '16px',
      display: 'block'
    },
    content: {
      fontSize: '1.1rem',
      lineHeight: '1.6',
      color: '#334155',
      margin: 0,
    },
    approveSection: {
      backgroundColor: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '24px',
    },
    resultSection: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '16px',
      padding: '28px',
    },
    codeBlock: {
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      padding: '20px',
      borderRadius: '8px',
      fontSize: '0.95rem',
      fontFamily: '"Fira Code", monospace',
      overflowX: 'auto',
      marginTop: '16px',
      lineHeight: '1.5',
    },
    textBlock: {
      marginTop: '16px', 
      padding: '16px', 
      backgroundColor: '#ffffff', 
      borderRadius: '8px', 
      border: '1px solid #bbf7d0',
      lineHeight: '1.7',
      color: '#334155',
      whiteSpace: 'pre-wrap'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <h1 style={styles.title}>Mem0 AI Command Center</h1>
          <p style={styles.subtitle}>Speech-to-text intent analysis and local tool execution</p>
        </header>

        <section style={styles.controlPanel}>
          <button 
            onClick={toggleRecording}
            disabled={isLoading}
            style={{ 
              ...styles.btnBase, 
              backgroundColor: isRecording ? '#ef4444' : (isLoading ? '#94a3b8' : '#2563eb'),
              color: 'white',
              transform: isRecording ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {isRecording ? "Stop Listening" : "Start Voice Command"}
          </button>

          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isLoading || isRecording}
            style={{ ...styles.btnBase, backgroundColor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            Upload Audio File
          </button>
          <input 
            type="file" 
            accept="audio/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </section>

        {/* 1. Transcription Output [cite: 32] */}
        <div style={styles.card}>
          <span style={styles.label}>1. Transcription</span>
          <p style={styles.content}>{transcription || "System ready. Awaiting audio signal..."}</p>
        </div>

        {/* 2. Detected Intent [cite: 33] */}
        {analysis && !execution && (
          <div style={styles.approveSection}>
            <span style={{ ...styles.label, color: '#c2410c' }}>2. Intent Classification</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ ...styles.content, fontWeight: '700' }}>Detected Intent: {analysis.intent}</p>
                {analysis.filename && (
                  <p style={{ fontSize: '0.9rem', color: '#ea580c', marginTop: '4px' }}>Target Filename: {analysis.filename}</p>
                )}
              </div>
              <button onClick={approveExecution} disabled={isLoading} style={{ ...styles.btnBase, backgroundColor: '#ea580c', color: 'white', padding: '10px 24px' }}>
                Approve Execution
              </button>
            </div>
          </div>
        )}

        {/* 3. Result [cite: 34, 35] */}
        {execution && (
          <div style={styles.resultSection}>
            <span style={{ ...styles.label, color: '#166534' }}>3. Execution Outcome</span>
            <p style={{ ...styles.content, fontWeight: '700' }}>{execution.action}</p>
            {analysis?.intent === 'write_code' ? (
              <pre style={styles.codeBlock}>{execution.result}</pre>
            ) : (
              <div style={styles.textBlock}>{execution.result}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;