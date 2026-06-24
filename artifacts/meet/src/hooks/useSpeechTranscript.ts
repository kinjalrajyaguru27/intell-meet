import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface TranscriptLine {
  speaker: string;
  text: string;
  timestamp: number;
}

interface UseSpeechTranscriptOptions {
  roomId: string;
  displayName: string;
  socket: Socket | null;
  isMuted: boolean;
  isTranscriptionPaused?: boolean;
}

export function useSpeechTranscript({
  roomId,
  displayName,
  socket,
  isMuted,
  isTranscriptionPaused = false,
}: UseSpeechTranscriptOptions) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<TranscriptLine[]>([]);

  // Refs to prevent stale closures in callbacks
  const isMutedRef = useRef(isMuted);
  const isTranscriptionPausedRef = useRef(isTranscriptionPaused);
  const displayNameRef = useRef(displayName);
  const socketRef = useRef(socket);
  const isListeningRef = useRef(false);

  // Sync refs with props
  useEffect(() => {
    isMutedRef.current = isMuted;
    console.log("[useSpeechTranscript] isMuted updated to:", isMuted);
    
    if (isMuted && recognitionRef.current && isListeningRef.current) {
      try {
        console.log("[useSpeechTranscript] Stopping speech recognition due to mute");
        recognitionRef.current.stop();
      } catch (e) {
        console.error("[useSpeechTranscript] Error stopping speech recognition on mute:", e);
      }
    } else if (!isMuted && !isTranscriptionPausedRef.current && recognitionRef.current && !isListeningRef.current) {
      try {
        console.log("[useSpeechTranscript] Starting speech recognition due to unmute");
        recognitionRef.current.start();
        isListeningRef.current = true;
      } catch (e) {
        console.error("[useSpeechTranscript] Error starting speech recognition on unmute:", e);
      }
    }
  }, [isMuted]);

  useEffect(() => {
    isTranscriptionPausedRef.current = isTranscriptionPaused;
    console.log("[useSpeechTranscript] isTranscriptionPaused updated to:", isTranscriptionPaused);

    if (isTranscriptionPaused && recognitionRef.current && isListeningRef.current) {
      try {
        console.log("[useSpeechTranscript] Stopping speech recognition due to pause");
        recognitionRef.current.stop();
      } catch (e) {
        console.error("[useSpeechTranscript] Error stopping speech recognition on pause:", e);
      }
    } else if (!isTranscriptionPaused && !isMutedRef.current && recognitionRef.current && !isListeningRef.current) {
      try {
        console.log("[useSpeechTranscript] Starting speech recognition due to resume");
        recognitionRef.current.start();
        isListeningRef.current = true;
      } catch (e) {
        console.error("[useSpeechTranscript] Error starting speech recognition on resume:", e);
      }
    }
  }, [isTranscriptionPaused]);

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    // Check browser compatibility for SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[useSpeechTranscript] Web Speech API (SpeechRecognition) is not supported in this browser.");
      return;
    }

    console.log("[useSpeechTranscript] Initializing SpeechRecognition instance");
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      console.log("[useSpeechTranscript] SpeechRecognition started listening");
      isListeningRef.current = true;
    };

    rec.onresult = (event: any) => {
      if (isTranscriptionPausedRef.current) {
        console.log("[useSpeechTranscript] Speech Recognition result ignored because transcription is paused");
        return;
      }
      const resultIndex = event.resultIndex;
      const text = event.results[resultIndex][0].transcript.trim();
      console.log("[useSpeechTranscript] Captured raw transcript chunk:", text);

      if (text) {
        // Emit through socket to broadcast to other participants
        const currentSocket = socketRef.current;
        if (currentSocket && currentSocket.connected) {
          console.log("[useSpeechTranscript] Emitting transcription-chunk to socket:", text);
          currentSocket.emit("transcription-chunk", { text });
        } else {
          console.warn("[useSpeechTranscript] Socket disconnected, skipped broadcasting transcript chunk");
        }

        const newLine: TranscriptLine = {
          speaker: displayNameRef.current,
          text,
          timestamp: Date.now(),
        };

        setTranscript((prev) => [...prev, newLine]);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      console.error("[useSpeechTranscript] Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        console.warn("[useSpeechTranscript] Microphone permission blocked by browser");
        isListeningRef.current = false;
      }
    };

    rec.onend = () => {
      console.log("[useSpeechTranscript] SpeechRecognition ended");
      isListeningRef.current = false;
      
      // Automatically restart with a 400ms delay to prevent OS locking loops on mobile
      setTimeout(() => {
        if (recognitionRef.current && !isMutedRef.current && !isTranscriptionPausedRef.current && !isListeningRef.current) {
          try {
            console.log("[useSpeechTranscript] Automatically restarting SpeechRecognition");
            recognitionRef.current.start();
            isListeningRef.current = true;
          } catch (e) {
            // ignore already started errors
          }
        }
      }, 400);
    };

    recognitionRef.current = rec;

    // Start initially if not muted and not paused
    if (!isMutedRef.current && !isTranscriptionPausedRef.current) {
      try {
        console.log("[useSpeechTranscript] Initial SpeechRecognition start");
        rec.start();
        isListeningRef.current = true;
      } catch (e) {
        console.error("[useSpeechTranscript] Failed initial SpeechRecognition start:", e);
      }
    }

    return () => {
      console.log("[useSpeechTranscript] Cleaning up SpeechRecognition");
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      recognitionRef.current = null;
      isListeningRef.current = false;
    };
  }, []); // Run once on mount

  // Handle socket listening for other participants' transcription chunks
  useEffect(() => {
    if (!socket) return;

    const handleRemoteChunk = (data: {
      userId: string;
      displayName: string;
      text: string;
      timestamp: number;
    }) => {
      console.log("[useSpeechTranscript] Received remote transcript chunk:", data);
      const newLine: TranscriptLine = {
        speaker: data.displayName,
        text: data.text,
        timestamp: data.timestamp,
      };
      setTranscript((prev) => [...prev, newLine]);
    };

    socket.on("transcription-chunk", handleRemoteChunk);

    return () => {
      socket.off("transcription-chunk", handleRemoteChunk);
    };
  }, [socket]);

  // Handle mock transcription chunks for simulation
  useEffect(() => {
    const handleMockTranscript = (e: Event) => {
      const { speaker, text } = (e as CustomEvent).detail;
      console.log("[useSpeechTranscript] Simulation mock speech received:", speaker, "-", text);
      const newLine: TranscriptLine = {
        speaker,
        text,
        timestamp: Date.now(),
      };
      setTranscript((prev) => [...prev, newLine]);
    };
    window.addEventListener("mock-transcription", handleMockTranscript);
    return () => window.removeEventListener("mock-transcription", handleMockTranscript);
  }, []);

  return {
    transcript,
    setTranscript,
    transcriptRef,
  };
}
