// This file is a React component that implements a chat interface with voice input and audio message playback
"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Mic,
  GraduationCap,
  ThumbsDown,
  ThumbsUp,
  Plus,
  Download,
} from "lucide-react";
import MicRecorder from "mic-recorder-to-mp3";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [recorder] = useState(new MicRecorder({ bitRate: 128 }));
  const [isBlocked, setIsBlocked] = useState(false);
  const [error, setError] = useState("");
  const [showTranscript, setShowTranscript] = useState({});

  const toggleTranscript = (id) => {
    setShowTranscript((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => setIsBlocked(false))
        .catch(() => {
          setIsBlocked(true);
          setError(
            "Microphone access denied. Please allow microphone access to use voice features."
          );
        });
    } else {
      setIsBlocked(true);
      setError("Browser does not support audio recording.");
    }
  }, []);

  const startRecording = () => {
    if (isBlocked) return;
    recorder
      .start()
      .then(() => setIsRecording(true))
      .catch(() => setError("An error occurred while starting the recording."));
  };

  const stopRecording = () => {
    recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const audioBlob = new Blob(buffer, { type: "audio/mp3" });
        sendToApi(audioBlob);
        setIsRecording(false);
      })
      .catch(() => {
        setError("An error occurred while stopping the recording.");
        setIsRecording(false);
      });
  };

  const sendToApi = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.mp3");

    try {
      setIsTyping(true);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError("Transcription error");
        setIsTyping(false);
        return;
      }
      const data = await response.json();
      const audioUrl = URL.createObjectURL(blob);

      const userMessage = {
        id: Date.now(),
        audioUrl,
        text: data.transcription?.text || "",
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, userMessage]);

      const modelRes = await fetch("/api/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: data.transcription.text }),
      });

      const result = await modelRes.json();
      const botAudioRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.output }),
      });
      const botBlob = await botAudioRes.blob();
      const botAudioUrl = URL.createObjectURL(botBlob);

      const botMessage = {
        id: Date.now() + 1,
        audioUrl: botAudioUrl,
        text: result.output,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setIsTyping(false);
    }
  };


  const downloadTranscript = () => {
    const headers = ["Sender", "Timestamp", "Text"];
    const rows = messages.map((msg) => [msg.sender, msg.timestamp, msg.text?.replace(/\n/g, " ") || ""]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transcript.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFeedback = (messageId, type) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback: type } : msg
      )
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="hidden md:flex w-64 bg-white shadow-lg flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <GraduationCap size={32} className="text-purple-300" />
            <h1 className="text-xl font-bold text-gray-800">AiVoice</h1>
          </div>
           <div className="flex-1 p-4">
          <button
            onClick={downloadTranscript}
            className="w-full flex items-center space-x-2 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-600 font-medium"
          ><Download className="text-purple-300" size={40}/>
            Download Transcript
          </button>
        </div>
        </div>
        
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Voice Assistant
              </h2>
              <p className="text-sm text-gray-500">Online • Ready to help</p>
            </div>
            <div className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronDown size={20} className="text-gray-300" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 rounded-3xl shadow-lg">
                <GraduationCap
                  size={64}
                  className="text-purple-300 mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                  How can I assist you today?
                </h2>
                <p className="text-gray-300 text-center mb-6 max-w-md">
                  I'm here to help with your questions, provide explanations,
                  and assist with various tasks.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`md:w-[50%] w-[100%] ${
                      message.sender === "user" ? "order-2" : "order-1"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-md ${
                        message.sender === "user"
                          ? "bg-purple-300 text-gray-800 ml-12"
                          : "bg-yellow-200 text-gray-800 mr-12"
                      }`}
                    >
                      {/* Audio Playback */}
                      {message.audioUrl && (
                        <audio
                          controls
                          src={message.audioUrl}
                          className="mb-2 w-full rounded-lg"
                        />
                      )}

                      {/* Toggle Transcript */}
                      {message.text && (
                        <>
                          <button
                            onClick={() => toggleTranscript(message.id)}
                            className="text-xs text-gray-800 underline"
                          >
                            {showTranscript[message.id] ? "Hide" : "Show"}{" "}
                            transcription
                          </button>
                          {showTranscript[message.id] && (
                            <p className="leading-relaxed mt-2 text-sm">
                              {message.text}
                            </p>
                          )}
                        </>
                      )}

                      <p
                        className={`text-xs mt-2 ${
                          message.sender === "user"
                            ? "text-gray-800"
                            : "text-gray-800"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-md mr-12">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border-t px-6 py-6">
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-6 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
                isRecording ? "bg-red-500 animate-pulse" : "bg-purple-500"
              }`}
            >
              {isRecording ? (
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              ) : (
                <Mic color="white" size={24} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
