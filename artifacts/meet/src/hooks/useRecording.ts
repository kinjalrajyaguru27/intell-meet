import { useRef, useState, useCallback, useEffect } from "react";
import type { ParticipantState } from "./useWebRTC";

interface UseRecordingOptions {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  displayName: string;
  participants: Record<string, ParticipantState>;
  roomName?: string;
}

const CANVAS_W = 1280;
const CANVAS_H = 720;
const TILE_PADDING = 8;
const LABEL_HEIGHT = 28;
const FPS = 25;

function getGridLayout(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: Math.ceil(count / 4) };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useRecording({
  localStream,
  remoteStreams,
  displayName,
  participants,
  roomName,
}: UseRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioSourcesRef = useRef<AudioNode[]>([]);

  // Keep latest streams accessible inside rAF without stale closure
  const localStreamRef = useRef(localStream);
  const remoteStreamsRef = useRef(remoteStreams);
  const participantsRef = useRef(participants);
  const displayNameRef = useRef(displayName);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { remoteStreamsRef.current = remoteStreams; }, [remoteStreams]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { displayNameRef.current = displayName; }, [displayName]);

  // Draw a single video tile onto the canvas
  function drawTile(
    ctx: CanvasRenderingContext2D,
    videoEl: HTMLVideoElement | null,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    isLocal: boolean
  ) {
    const p = TILE_PADDING;

    // Tile background
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.roundRect(x + p, y + p, w - p * 2, h - p * 2, 8);
    ctx.fill();

    // Video content
    if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + p, y + p, w - p * 2, h - p * 2, 8);
      ctx.clip();

      if (isLocal) {
        // Mirror local video
        ctx.translate(x + w - p, y + p);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, w - p * 2, h - p * 2);
      } else {
        ctx.drawImage(videoEl, x + p, y + p, w - p * 2, h - p * 2);
      }

      ctx.restore();
    } else {
      // Avatar fallback — initials
      const initials = label
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";
      const cx = x + w / 2;
      const cy = y + h / 2 - LABEL_HEIGHT / 2;
      const r = Math.min(w, h) * 0.18;
      ctx.fillStyle = "#2a2a3e";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a0a0c0";
      ctx.font = `bold ${r * 0.9}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, cx, cy);
    }

    // Name label at bottom
    const labelY = y + h - p - LABEL_HEIGHT;
    const labelPadX = 10;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.beginPath();
    ctx.roundRect(x + p + 8, labelY, Math.min(w - 32, label.length * 8 + 24), LABEL_HEIGHT, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      isLocal ? `${label} (You)` : label,
      x + p + 8 + labelPadX,
      labelY + LABEL_HEIGHT / 2
    );
  }

  // Get or create a hidden video element for a stream
  const videoEls = useRef<Map<string, HTMLVideoElement>>(new Map());

  function getVideoEl(id: string, stream: MediaStream): HTMLVideoElement {
    let el = videoEls.current.get(id);
    if (!el) {
      el = document.createElement("video");
      el.autoplay = true;
      el.playsInline = true;
      el.muted = true; // Muted since audio is handled by Web Audio
      el.style.display = "none";
      document.body.appendChild(el);
      videoEls.current.set(id, el);
    }
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
    return el;
  }

  function cleanupVideoEls() {
    videoEls.current.forEach((el) => {
      el.srcObject = null;
      el.parentNode?.removeChild(el);
    });
    videoEls.current.clear();
  }

  // Main draw loop
  function drawFrame(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const local = localStreamRef.current;
    const remotes = remoteStreamsRef.current;
    const parts = participantsRef.current;
    const localName = displayNameRef.current;

    // Build tile list: local first, then remote participants
    const tiles: Array<{ id: string; stream: MediaStream | null; label: string; isLocal: boolean }> = [];

    if (local) tiles.push({ id: "__local__", stream: local, label: localName, isLocal: true });
    Object.entries(remotes).forEach(([uid, stream]) => {
      const name = parts[uid]?.displayName ?? "Participant";
      tiles.push({ id: uid, stream, label: name, isLocal: false });
    });

    if (tiles.length === 0) return;

    const { cols, rows } = getGridLayout(tiles.length);
    const tileW = CANVAS_W / cols;
    const tileH = CANVAS_H / rows;

    tiles.forEach(({ id, stream, label, isLocal }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * tileW;
      const y = row * tileH;
      const videoEl = stream ? getVideoEl(id, stream) : null;
      drawTile(ctx, videoEl, x, y, tileW, tileH, label, isLocal);
    });

    // Recording indicator — top-right
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
    ctx.beginPath();
    ctx.arc(CANVAS_W - 80, 20, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 130, 8, 125, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`REC  ${timeStr}`, CANVAS_W - 12, 20);
  }

  function startRaf(ctx: CanvasRenderingContext2D) {
    let lastTime = 0;
    const interval = 1000 / FPS;

    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      if (ts - lastTime < interval) return;
      lastTime = ts;
      drawFrame(ctx);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  function setupAudio(): MediaStream {
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    audioCtxRef.current = audioCtx;
    audioDestRef.current = dest;
    audioSourcesRef.current = [];

    const addStream = (stream: MediaStream) => {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      try {
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(dest);
        audioSourcesRef.current.push(source);
      } catch {
        // Stream may not be compatible — skip
      }
    };

    if (localStreamRef.current) addStream(localStreamRef.current);
    Object.values(remoteStreamsRef.current).forEach(addStream);

    return dest.stream;
  }

  function cleanupAudio() {
    audioSourcesRef.current.forEach((node) => {
      try { node.disconnect(); } catch { /* ignore */ }
    });
    audioSourcesRef.current = [];
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    audioDestRef.current = null;
  }

  const startRecording = useCallback(() => {
    if (isRecording) return;

    // Canvas setup
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Start draw loop
    startRaf(ctx);

    // Audio mixing
    const audioStream = setupAudio();

    // Combine canvas video + mixed audio into one stream
    const canvasStream = canvas.captureStream(FPS);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    // Pick the best supported MIME type
    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 2_500_000,
    });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const safeName = (roomName ?? "meeting").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.href = url;
      a.download = `intell-meet_${safeName}_${stamp}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      // Cleanup
      cancelAnimationFrame(rafRef.current);
      cleanupAudio();
      cleanupVideoEls();
      canvasRef.current = null;
    };

    recorder.start(1000); // collect chunks every second

    // Duration counter
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    setIsRecording(true);
  }, [isRecording, roomName]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !recorderRef.current) return;

    recorderRef.current.stop();
    recorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setDuration(0);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAudio();
      cleanupVideoEls();
    };
  }, []);

  return {
    isRecording,
    duration,
    durationLabel: formatDuration(duration),
    startRecording,
    stopRecording,
  };
}
