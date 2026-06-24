import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  Circle,
  Search,
  Paperclip,
  Loader2,
  Send,
  Download,
  Check,
  CheckCheck,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

export default function Collaboration() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlinePresence, setOnlinePresence] = useState<Record<string, "online" | "offline" | "away" | "in-meeting">>({});
  const [userStatus, setUserStatus] = useState<"online" | "away" | "in-meeting">("online");

  const [teams, setTeams] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [newChannelTeamId, setNewChannelTeamId] = useState("");

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  // Load teams
  const fetchTeams = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTeams(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load channels
  const fetchChannels = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/channels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (data.length > 0 && !activeChannelId && !activeDmUserId) {
          setActiveChannelId(data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute unique coworkers across all teams
  const coWorkers = useMemo(() => {
    if (!teams) return [];
    const usersMap = new Map<string, { id: string; name: string; email: string }>();
    teams.forEach((t: any) => {
      t.members?.forEach((m: any) => {
        if (m.user && m.user.id !== user?.id) {
          usersMap.set(m.user.id, m.user);
        }
      });
    });
    return Array.from(usersMap.values());
  }, [teams, user]);

  // Messages REST Loader
  const fetchChatHistory = async (channelId: string | null, dmUserId: string | null) => {
    if (!token) return;
    const url = channelId
      ? `/api/messages/channel/${channelId}`
      : `/api/messages/dm/${dmUserId}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);

        // Mark read
        const unreadIds = data
          .filter((m: any) => m.sender?._id !== user?.id && !m.readBy?.includes(user?.id))
          .map((m: any) => m._id);
        if (unreadIds.length > 0) {
          socket?.emit("message-read", {
            messageIds: unreadIds,
            channelId: channelId || undefined,
            senderId: dmUserId || undefined,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Socket.io Real-Time Connection
  useEffect(() => {
    if (!token) return;
    fetchTeams();
    fetchChannels();

    const socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    const s = io(socketUrl, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    setSocket(s);

    s.on("connect", () => {
      s.emit("get-presence");
    });

    s.on("presence-list", (list: Array<{ userId: string; status: any }>) => {
      const presence: Record<string, any> = {};
      list.forEach((p) => {
        presence[p.userId] = p.status;
      });
      setOnlinePresence(presence);
    });

    s.on("presence-changed", ({ userId, status }: { userId: string; status: any }) => {
      setOnlinePresence((prev) => ({ ...prev, [userId]: status }));
    });

    s.on("direct-message", (msg: any) => {
      const senderId = msg.sender?._id;
      const recipientId = msg.recipient?._id;
      if (
        (activeDmUserId === senderId && user?.id === recipientId) ||
        (activeDmUserId === recipientId && user?.id === senderId)
      ) {
        setChatMessages((prev) => [...prev, msg]);
        s.emit("message-read", { messageIds: [msg._id], senderId });
      }
    });

    s.on("channel-message", (msg: any) => {
      if (activeChannelId === msg.channel) {
        setChatMessages((prev) => [...prev, msg]);
        s.emit("message-read", { messageIds: [msg._id], channelId: msg.channel });
      }
    });

    s.on("typing-indicator", ({ userId, channelId, recipientId, isTyping }: any) => {
      if (channelId && activeChannelId === channelId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      } else if (recipientId && activeDmUserId === userId && recipientId === user?.id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      }
    });

    s.on("messages-read-update", ({ messageIds, readBy }: any) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, readBy: [...(m.readBy || []), readBy] }
            : m
        )
      );
    });

    s.on("notification", (notif: any) => {
      toast({
        title: notif.title,
        description: notif.content,
      });
    });

    return () => {
      s.disconnect();
    };
  }, [token, activeChannelId, activeDmUserId]);

  // Load chat history when active channel or DM changes
  useEffect(() => {
    if (activeChannelId || activeDmUserId) {
      fetchChatHistory(activeChannelId, activeDmUserId);
      setTypingUsers({});

      if (activeChannelId && socket) {
        socket.emit("join-channel", { channelId: activeChannelId });
      }
    }

    return () => {
      if (activeChannelId && socket) {
        socket.emit("leave-channel", { channelId: activeChannelId });
      }
    };
  }, [activeChannelId, activeDmUserId, socket]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleUpdatePresence = (status: "online" | "away" | "in-meeting") => {
    setUserStatus(status);
    socket?.emit("update-presence", { status });
  };

  const handleSendChatMessage = () => {
    if (!messageInput.trim()) return;
    if (activeChannelId) {
      socket?.emit("send-channel-message", {
        channelId: activeChannelId,
        text: messageInput.trim(),
      });
    } else if (activeDmUserId) {
      socket?.emit("send-direct-message", {
        recipientId: activeDmUserId,
        text: messageInput.trim(),
      });
    }
    setMessageInput("");
    socket?.emit("typing-indicator", {
      channelId: activeChannelId || undefined,
      recipientId: activeDmUserId || undefined,
      isTyping: false,
    });
  };

  const typingTimeoutRef = useRef<any>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (socket) {
      socket.emit("typing-indicator", {
        channelId: activeChannelId || undefined,
        recipientId: activeDmUserId || undefined,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-indicator", {
          channelId: activeChannelId || undefined,
          recipientId: activeDmUserId || undefined,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    try {
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${token}`);
      headers.append("Content-Type", file.type);
      headers.append("x-filename", file.name);
      if (activeChannelId) {
        headers.append("x-channel-id", activeChannelId);
      }

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        headers,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to backend uploads directory");
      }

      const fileObj = await uploadRes.json();

      if (activeChannelId) {
        socket?.emit("send-channel-message", {
          channelId: activeChannelId,
          text: `Shared file: ${file.name}`,
          fileId: fileObj._id,
        });
      } else if (activeDmUserId) {
        socket?.emit("send-direct-message", {
          recipientId: activeDmUserId,
          text: `Shared file: ${file.name}`,
          fileId: fileObj._id,
        });
      }

      toast({ title: "Attachment shared", description: `Successfully shared ${file.name}` });
    } catch (err: any) {
      toast({
        title: "File upload failed",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !newChannelTeamId || !token) return;
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
          description: newChannelDesc,
          isPrivate: newChannelPrivate,
          teamId: newChannelTeamId,
        }),
      });

      if (res.ok) {
        const newChan = await res.json();
        toast({ title: "Channel created", description: `#${newChan.name} successfully created.` });
        setIsCreateChannelOpen(false);
        setNewChannelName("");
        setNewChannelDesc("");
        setNewChannelPrivate(false);
        fetchChannels();
        setActiveChannelId(newChan._id);
        setActiveDmUserId(null);
      } else {
        const errorData = await res.json();
        toast({ title: "Failed to create channel", description: errorData.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeChatName = useMemo(() => {
    if (activeChannelId) {
      return `#${channels.find((c) => c._id === activeChannelId)?.name || "channel"}`;
    }
    if (activeDmUserId) {
      return coWorkers.find((u) => u.id === activeDmUserId)?.name || "Coworker";
    }
    return "Select Chat";
  }, [activeChannelId, activeDmUserId, channels, coWorkers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Header with presence selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary animate-pulse" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">Workspace Collaboration</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold">My Status:</span>
          <Select value={userStatus} onValueChange={handleUpdatePresence}>
            <SelectTrigger className="w-32 bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 h-8 text-xs text-zinc-800 dark:text-white font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#09090b] border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-white">
              <SelectItem value="online" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Online</SelectItem>
              <SelectItem value="away" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Away</SelectItem>
              <SelectItem value="in-meeting" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">In Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main chat window */}
      <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden flex h-[580px] shadow-xl relative">
        {/* Left Column */}
        <div className="w-64 border-r border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-[130px]">{user?.name}</h3>

            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-zinc-200/50 dark:hover:bg-white/5">
                  <Plus className="w-4 h-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Chat Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1">
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g. general, engineering"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Project discussion threads"
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Workspace Team</Label>
                    <Select value={newChannelTeamId} onValueChange={setNewChannelTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((t) => (
                           <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Private Channel</Label>
                    <Switch checked={newChannelPrivate} onCheckedChange={setNewChannelPrivate} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setIsCreateChannelOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim() || !newChannelTeamId}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Channels */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block pl-2 mb-1.5">
                Channels
              </span>
              {channels.length === 0 ? (
                <span className="text-[10px] text-zinc-500 italic pl-2">No channels created</span>
              ) : (
                channels.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setActiveChannelId(c._id);
                      setActiveDmUserId(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeChannelId === c._id
                        ? "bg-primary/10 text-primary font-bold border-l-2 border-primary rounded-l-none"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <span className="opacity-70 font-mono">#</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))
              )}
            </div>

            {/* Direct Messages */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block pl-2 mb-1.5">
                Direct Messages
              </span>
              {coWorkers.length === 0 ? (
                <span className="text-[10px] text-zinc-500 italic pl-2">No workspace coworkers</span>
              ) : (
                coWorkers.map((u) => {
                  const presence = onlinePresence[u.id] || "offline";
                  const presenceColors = {
                    online: "text-emerald-500 fill-emerald-500 dark:text-emerald-400 dark:fill-emerald-400",
                    away: "text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400",
                    "in-meeting": "text-cyan-500 fill-cyan-500 dark:text-cyan-400 dark:fill-cyan-400",
                    offline: "text-zinc-400 dark:text-zinc-600 fill-transparent",
                  };

                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveDmUserId(u.id);
                        setActiveChannelId(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeDmUserId === u.id
                          ? "bg-primary/10 text-primary font-bold border-l-2 border-primary rounded-l-none"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Circle className={`w-2 h-2 shrink-0 ${presenceColors[presence]}`} />
                        <span className="truncate">{u.name}</span>
                      </div>
                      <span className="text-[9px] opacity-60 dark:opacity-50 capitalize">{presence === "in-meeting" ? "meeting" : presence}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#09090b]">
          {activeChannelId || activeDmUserId ? (
            <>
              {/* Chat Window Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-black/20">
                <div>
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">{activeChatName}</h4>
                  {activeDmUserId && (
                    <p className="text-[9px] text-zinc-500 capitalize">
                      Status: {onlinePresence[activeDmUserId] || "offline"}
                    </p>
                  )}
                  {activeChannelId && (
                    <p className="text-[9px] text-zinc-500 truncate max-w-sm">
                      {channels.find((c) => c._id === activeChannelId)?.description || "Public team channel"}
                    </p>
                  )}
                </div>

                <div className="relative w-40">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <Input
                    placeholder="Search messages..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="pl-8 pr-3 h-7 text-[10px] bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Message history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages
                  .filter((m) =>
                    !chatSearchQuery.trim()
                      ? true
                      : m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
                  )
                  .map((msg) => {
                    const isMe = msg.sender?._id === user?.id;
                    const senderInitial = (msg.sender?.name || "?").charAt(0).toUpperCase();

                    return (
                      <div key={msg._id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse text-right" : ""}`}>
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {senderInitial}
                        </div>
                        <div className="max-w-[70%] space-y-1">
                          <div className={`flex items-baseline gap-2 text-[9px] text-zinc-500 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">{msg.sender?.name || "Member"}</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed inline-block ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-none text-left"
                              : "bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-white/5"
                          }`}>
                            {msg.text}

                            {msg.file && (
                              <div className="mt-2 p-2 bg-zinc-200/50 dark:bg-black/30 rounded-lg flex items-center justify-between gap-4 border border-zinc-350 dark:border-white/5 text-[10px]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                  <span className="font-semibold truncate text-zinc-900 dark:text-white">{msg.file.filename}</span>
                                </div>
                                <a
                                  href={msg.file.fileUrl}
                                  download
                                  target="_blank"
                                  className="p-1 rounded bg-zinc-250 hover:bg-zinc-300 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-white shrink-0"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          {isMe && (
                            <div className="text-[8px] text-zinc-500 flex justify-end items-center gap-0.5 mt-0.5">
                              {msg.readBy && msg.readBy.length > 0 ? (
                                <>
                                  <CheckCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                  <span>Read</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Sent</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* Typing indicators */}
                {Object.entries(typingUsers)
                  .filter(([uid, typing]) => uid !== user?.id && typing)
                  .map(([uid]) => {
                    const typingName = activeChannelId
                      ? coWorkers.find((u) => u.id === uid)?.name || "Someone"
                      : activeChatName;
                    return (
                      <div key={uid} className="text-[10px] text-zinc-500 italic pl-1 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span>{typingName} is typing...</span>
                      </div>
                    );
                  })}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input panel */}
              <div className="p-3.5 border-t border-zinc-200 dark:border-white/5 flex items-center gap-2 shrink-0 bg-zinc-50/50 dark:bg-black/20">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-250 dark:hover:bg-white/5"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Input
                  placeholder={`Message ${activeChatName}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage();
                  }}
                  className="flex-1 bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs rounded-xl h-9 focus-visible:ring-offset-0 focus-visible:ring-primary"
                />

                <Button
                  size="icon"
                  onClick={handleSendChatMessage}
                  disabled={!messageInput.trim()}
                  className="w-9 h-9 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-50/30 dark:bg-[#09090b]">
              <MessageSquare className="w-12 h-12 text-zinc-400 dark:text-zinc-700/50 mb-4" />
              <h3 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-white">Select Chat Conversation</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                Choose a workspace channel or click on a colleague under Direct Messages to start collaborating in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
