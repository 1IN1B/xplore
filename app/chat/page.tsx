"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Mic, MicOff, Camera, CameraOff, SkipForward, MessageSquare, X, Send } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const RTC_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function ChatPage() {
  const [status, setStatus] = useState<"idle" | "waiting" | "connected">("idle");
  const [messages, setMessages] = useState<{ sender: "me" | "stranger"; text: string }[]>([]);
  const [input, setInput] = useState("");

  // Media States
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // UI States
  const [isChatOpen, setIsChatOpen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Socket
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    // Get User Media
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "Camera access requires a secure context (HTTPS or localhost). Please access this app via http://localhost:3000 or over HTTPS."
      );
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Start finding a partner
        startChat();
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        alert("Could not access camera/microphone");
      });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  const startChat = () => {
    if (!socketRef.current) return;
    setStatus("waiting");
    setMessages([]);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socketRef.current.emit("join-room");

    socketRef.current.on("waiting", () => {
      setStatus("waiting");
    });

    socketRef.current.on("chat-start", async ({ roomId, initiator }) => {
      setStatus("connected");
      roomIdRef.current = roomId;
      createPeerConnection(initiator, roomId);
    });

    socketRef.current.on("signal", async (signal) => {
      if (!peerRef.current) return;

      if (signal.type === "offer") {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current?.emit("signal", { roomId: roomIdRef.current, signal: answer });
      } else if (signal.type === "answer") {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    socketRef.current.on("message", (message) => {
      setMessages((prev) => [...prev, { sender: "stranger", text: message }]);
    });

    socketRef.current.on("user-disconnected", () => {
      alert("Stranger disconnected");
      window.location.reload();
    });
  };

  const createPeerConnection = async (initiator: boolean, roomId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("signal", {
          roomId,
          signal: { candidate: event.candidate },
        });
      }
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("signal", { roomId, signal: offer });
    }
  };

  const handleRemoteVideoLoaded = () => {
    const video = remoteVideoRef.current;
    const container = remoteContainerRef.current;
    if (!video || !container) return;

    const ratio = video.videoWidth / video.videoHeight;
    if (ratio > 1) {
      container.style.maxHeight = `${Math.min(window.innerHeight * 0.8, 720)}px`;
      container.style.maxWidth = "none";
    } else {
      container.style.maxHeight = `${Math.min(window.innerHeight * 0.8, 720)}px`;
      container.style.maxWidth = `${720 * ratio}px`;
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomIdRef.current) return;

    socketRef.current?.emit("message", { roomId: roomIdRef.current, message: input });
    setMessages((prev) => [...prev, { sender: "me", text: input }]);
    setInput("");
  };

  const handleNext = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {/* Video Area */}
      <div className="flex-1 flex flex-col p-2 sm:p-3 md:p-4 gap-2 md:gap-4 relative">
        {/* Header / Status Bar */}
        <div className="absolute top-3 left-3 z-10 bg-black/50 px-3 py-1 rounded-full text-white text-xs sm:text-sm backdrop-blur-sm flex items-center gap-2">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              status === "connected" ? "bg-green-400" : "bg-yellow-400 animate-pulse"
            )}
          />
          {status === "connected" ? "Connected" : status === "waiting" ? "Waiting..." : "Idle"}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <ThemeToggle />
        </div>

        <div ref={remoteContainerRef} className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner min-h-[50vh] md:min-h-0 mx-auto">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            onLoadedMetadata={handleRemoteVideoLoaded}
            className="w-full h-full object-contain"
          />
          {status === "waiting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-400">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
              <p className="text-base sm:text-lg font-medium">Looking for someone...</p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-20 h-28 sm:w-28 sm:h-40 md:w-48 md:h-36 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn("w-full h-full object-contain", !isVideoEnabled && "hidden")}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white">
                <CameraOff className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
              {!isAudioEnabled && <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-14 sm:h-20 flex items-center justify-center gap-3 sm:gap-4 md:gap-8 px-3 sm:px-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={toggleAudio}
            className={cn(
              "p-2.5 sm:p-4 rounded-full transition-all duration-200",
              isAudioEnabled
                ? "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={cn(
              "p-2.5 sm:p-4 rounded-full transition-all duration-200",
              isVideoEnabled
                ? "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {isVideoEnabled ? <Camera className="w-5 h-5 sm:w-6 sm:h-6" /> : <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 sm:px-8 sm:py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-80 transition-opacity flex items-center gap-2 text-sm sm:text-base"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          {/* Mobile Chat Toggle */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="md:hidden p-2.5 sm:p-4 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white relative"
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Chat Area - Desktop (Side Panel) & Mobile (Sheet) */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-white dark:bg-black transition-transform duration-300 md:relative md:inset-auto md:translate-y-0 md:w-96 md:border-l md:border-zinc-200 md:dark:border-zinc-800 flex flex-col",
          isChatOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
        )}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h2 className="font-bold text-lg">Chat</h2>
          <button onClick={() => setIsChatOpen(false)} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 mt-10">
              <p>Say hello!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm sm:text-base",
                  msg.sender === "me"
                    ? "bg-black dark:bg-white text-white dark:text-black rounded-br-none"
                    : "bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white rounded-bl-none"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={status !== "connected" || !input.trim()}
              className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 hover:opacity-80 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
