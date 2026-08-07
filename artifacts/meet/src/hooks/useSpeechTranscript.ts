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
  localStream: MediaStream | null;
}

export function useSpeechTranscript({
  roomId,
  displayName,
  socket,
  isMuted,
  isTranscriptionPaused = false,
  localStream,
}: UseSpeechTranscriptOptions) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState<TranscriptLine | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<TranscriptLine[]>([]);

  // Refs to prevent stale closures in callbacks
  const isMutedRef = useRef(isMuted);
  const isTranscriptionPausedRef = useRef(isTranscriptionPaused);
  const displayNameRef = useRef(displayName);
  const socketRef = useRef(socket);
  const isListeningRef = useRef(false);

  const hasLocalAudio = !!(localStream && localStream.getAudioTracks().length > 0 && localStream.getAudioTracks()[0].enabled);
  const hasLocalAudioRef = useRef(hasLocalAudio);

  // Sync refs with props
  useEffect(() => {
    isMutedRef.current = isMuted;
    isTranscriptionPausedRef.current = isTranscriptionPaused;
    hasLocalAudioRef.current = hasLocalAudio;

    const shouldListen = hasLocalAudio && !isMuted && !isTranscriptionPaused;

    if (recognitionRef.current) {
      if (shouldListen && !isListeningRef.current) {
        try {
          console.log("[useSpeechTranscript] Starting speech recognition (microphone active)");
          recognitionRef.current.start();
          isListeningRef.current = true;
        } catch (e) {
          console.error("[useSpeechTranscript] Error starting speech recognition:", e);
        }
      } else if (!shouldListen && isListeningRef.current) {
        try {
          console.log("[useSpeechTranscript] Stopping speech recognition (microphone inactive/muted)");
          recognitionRef.current.stop();
          isListeningRef.current = false;
        } catch (e) {
          console.error("[useSpeechTranscript] Error stopping speech recognition:", e);
        }
      }
    }
  }, [hasLocalAudio, isMuted, isTranscriptionPaused]);

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

    const isMobileOrTablet = typeof navigator !== "undefined" && (
      /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
      (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches)
    );

    if (isMobileOrTablet) {
      console.log("[useSpeechTranscript] SpeechRecognition is disabled on mobile/tablet devices to prevent microphone access conflicts.");
      return;
    }

    if (!SpeechRecognition) {
      console.warn("[useSpeechTranscript] Web Speech API (SpeechRecognition) is not supported in this browser.");
      return;
    }

    console.log("[useSpeechTranscript] Initializing SpeechRecognition instance");
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      console.log("[useSpeechTranscript] SpeechRecognition started listening");
      isListeningRef.current = true;
    };

    rec.onresult = (event: any) => {
      if (isTranscriptionPausedRef.current) {
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const textChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += textChunk;
        } else {
          interimTranscript += textChunk;
        }
      }

      if (interimTranscript.trim()) {
        const currentSocket = socketRef.current;
        if (currentSocket && currentSocket.connected) {
          currentSocket.emit("transcription-chunk", { text: interimTranscript.trim(), isInterim: true });
        }

        setCurrentSpeech({
          speaker: displayNameRef.current,
          text: interimTranscript.trim(),
          timestamp: Date.now(),
        });
      }

      if (finalTranscript.trim()) {
        const currentSocket = socketRef.current;
        if (currentSocket && currentSocket.connected) {
          currentSocket.emit("transcription-chunk", { text: finalTranscript.trim(), isFinal: true });
        }

        const newLine: TranscriptLine = {
          speaker: displayNameRef.current,
          text: finalTranscript.trim(),
          timestamp: Date.now(),
        };

        setTranscript((prev) => [...prev, newLine]);
        setCurrentSpeech(null);
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
      
      // Automatically restart with a 300ms delay to prevent OS locking loops
      setTimeout(() => {
        const shouldListen = hasLocalAudioRef.current && !isMutedRef.current && !isTranscriptionPausedRef.current;
        if (recognitionRef.current && shouldListen && !isListeningRef.current) {
          try {
            console.log("[useSpeechTranscript] Automatically restarting SpeechRecognition");
            recognitionRef.current.start();
            isListeningRef.current = true;
          } catch (e) {
            // ignore already started errors
          }
        }
      }, 300);
    };

    recognitionRef.current = rec;

    // Start initially if microphone is active and not muted/paused
    const shouldListenInitially = hasLocalAudioRef.current && !isMutedRef.current && !isTranscriptionPausedRef.current;
    if (shouldListenInitially) {
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
      isInterim?: boolean;
    }) => {
      if (data.isInterim) {
        setCurrentSpeech({
          speaker: data.displayName,
          text: data.text,
          timestamp: data.timestamp || Date.now(),
        });
      } else {
        const newLine: TranscriptLine = {
          speaker: data.displayName,
          text: data.text,
          timestamp: data.timestamp || Date.now(),
        };
        setTranscript((prev) => [...prev, newLine]);
        setCurrentSpeech(null);
      }
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
    currentSpeech,
    transcriptRef,
    recognitionRef,
  };
}
