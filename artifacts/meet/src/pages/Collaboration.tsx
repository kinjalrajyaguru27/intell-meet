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
  Trash2,
  LogOut,
  Share2,
  UserPlus,
  Users,
  ShieldCheck,
  FileText,
  Copy,
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

  // Shared Notes & View Filter State
  const [activeTab, setActiveTab] = useState<"all" | "messages" | "notes">("all");
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [noteTitleInput, setNoteTitleInput] = useState("");
  const [noteContentInput, setNoteContentInput] = useState("");

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [newChannelTeamId, setNewChannelTeamId] = useState("");

  // Modals state for Delete, Leave, Share, and Add Members
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);

  const [meetingAttendees, setMeetingAttendees] = useState<any[]>([]);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

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
        const urlParams = new URLSearchParams(window.location.search);
        const urlChannelId = urlParams.get("channel");
        if (urlChannelId && data.some((c: any) => c._id === urlChannelId)) {
          setActiveChannelId(urlChannelId);
          setActiveDmUserId(null);
        } else if (data.length > 0 && !activeChannelId && !activeDmUserId) {
          setActiveChannelId(data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute active channel object and host status
  const activeChannel = useMemo(() => {
    if (!activeChannelId) return null;
    return channels.find((c) => c._id === activeChannelId) || null;
  }, [activeChannelId, channels]);

  const isHost = useMemo(() => {
    if (!activeChannel || !user) return false;
    const hostId = activeChannel.createdBy?._id || activeChannel.createdBy;
    return hostId ? hostId.toString() === user.id : true;
  }, [activeChannel, user]);

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

  // Fetch meeting attendees for adding members
  const fetchMeetingAttendees = async () => {
    if (!token) return;
    setIsLoadingAttendees(true);
    try {
      const res = await fetch("/api/channels/meeting-attendees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMeetingAttendees(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAttendees(false);
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
      if (activeChannelId) {
        s.emit("join-channel", { channelId: activeChannelId });
      }
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

    // Real-Time Channel Sync Listeners
    s.on("channel-created", (newChan: any) => {
      setChannels((prev) => {
        if (prev.some((c) => c._id === newChan._id)) return prev;
        return [...prev, newChan];
      });
    });

    s.on("channel-updated", (updatedChan: any) => {
      setChannels((prev) =>
        prev.map((c) => (c._id === updatedChan._id ? updatedChan : c))
      );
    });

    s.on("channel-deleted", ({ channelId }: { channelId: string }) => {
      setChannels((prev) => prev.filter((c) => c._id !== channelId));
      setActiveChannelId((curr) => (curr === channelId ? null : curr));
      toast({
        title: "Channel Deleted",
        description: "The collaboration channel was deleted by the host.",
      });
    });

    s.on("channel-removed", ({ channelId }: { channelId: string }) => {
      setChannels((prev) => prev.filter((c) => c._id !== channelId));
      setActiveChannelId((curr) => (curr === channelId ? null : curr));
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

  // Host Delete Channel Action
  const handleDeleteChannel = async () => {
    if (!activeChannelId || !token) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Channel Permanently Deleted", description: "Channel, chats, and shared files removed." });
        setIsDeleteDialogOpen(false);
        setChannels((prev) => prev.filter((c) => c._id !== activeChannelId));
        setActiveChannelId(null);
      } else {
        const err = await res.json();
        toast({ title: "Delete Failed", description: err.error || "Failed to delete channel.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Member Leave Channel Action
  const handleLeaveChannel = async () => {
    if (!activeChannelId || !token) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Left Channel", description: "You have left the collaboration channel." });
        setIsLeaveDialogOpen(false);
        setChannels((prev) => prev.filter((c) => c._id !== activeChannelId));
        setActiveChannelId(null);
      } else {
        const err = await res.json();
        toast({ title: "Leave Failed", description: err.error || "Failed to leave channel.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Add Members Action
  const handleAddMembers = async () => {
    if (!activeChannelId || selectedAttendeeIds.length === 0 || !token) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: selectedAttendeeIds }),
      });
      if (res.ok) {
        const updatedChan = await res.json();
        setChannels((prev) => prev.map((c) => (c._id === activeChannelId ? updatedChan : c)));
        toast({ title: "Members Added", description: `Added ${selectedAttendeeIds.length} member(s) to collaboration.` });
        setIsAddMembersDialogOpen(false);
        setSelectedAttendeeIds([]);
      } else {
        const err = await res.json();
        toast({ title: "Failed to Add Members", description: err.error, variant: "destructive" });
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

  // Formatted Chat Export transcript
  const formattedChatExport = useMemo(() => {
    if (!chatMessages.length) return "No messages recorded in conversation.";
    const title = activeChatName;
    const dateStr = new Date().toLocaleString();
    let text = `==================================================\n`;
    text += `COLLABORATION CHAT HISTORY\n`;
    text += `Channel / Workspace: ${title}\n`;
    text += `Exported: ${dateStr}\n`;
    text += `==================================================\n\n`;

    chatMessages.forEach((msg) => {
      const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const sender = msg.sender?.name || "Member";
      text += `[${time}] ${sender}:\n${msg.text}\n`;
      if (msg.file) {
        text += `   [Shared Attachment: ${msg.file.filename}]\n`;
      }
      text += `--------------------------------------------------\n`;
    });

    return text;
  }, [chatMessages, activeChatName]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formattedChatExport);
    toast({ title: "Copied to Clipboard", description: "Chat history transcript copied successfully!" });
  };

  const handleDownloadChat = (format: "txt" | "md") => {
    const blob = new Blob([formattedChatExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanName = activeChatName.replace(/[^a-zA-Z0-9_-]/g, "");
    link.download = `${cleanName}_chat_history.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Transcript Exported", description: `Downloaded as ${format.toUpperCase()} file.` });
  };

  // Publish Note Action
  const handleSendNote = () => {
    if (!noteContentInput.trim()) return;
    const title = noteTitleInput.trim() || "Shared Note";
    const text = noteContentInput.trim();

    if (activeChannelId) {
      socket?.emit("send-channel-message", {
        channelId: activeChannelId,
        text,
        type: "note",
        title,
      });
    } else if (activeDmUserId) {
      socket?.emit("send-direct-message", {
        recipientId: activeDmUserId,
        text,
        type: "note",
        title,
      });
    }
    setIsCreateNoteOpen(false);
    setNoteTitleInput("");
    setNoteContentInput("");
    toast({ title: "Note Published", description: "Shared note sent to all members in real-time." });
  };

  // Single Note Download Action
  const handleDownloadSingleNote = (msg: any, format: "txt" | "md") => {
    const title = msg.title || "Note";
    const author = msg.sender?.name || "Member";
    const time = new Date(msg.createdAt).toLocaleString();

    let text = `==================================================\n`;
    text += `SHARED NOTE: ${title.toUpperCase()}\n`;
    text += `Author: ${author}\n`;
    text += `Date: ${time}\n`;
    text += `Channel/Chat: ${activeChatName}\n`;
    text += `==================================================\n\n`;
    text += `${msg.text}\n\n`;
    if (msg.file) {
      text += `Attachment: ${msg.file.filename}\n`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${cleanTitle}_note.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Note Downloaded", description: `Saved as ${cleanTitle}_note.${format}` });
  };

  // Download All Notes Action
  const handleDownloadAllNotes = (format: "txt" | "md") => {
    const noteMsgs = chatMessages.filter((m) => m.type === "note");
    if (noteMsgs.length === 0) {
      toast({ title: "No Notes Available", description: "There are no shared notes in this channel to download.", variant: "destructive" });
      return;
    }
    let text = `==================================================\n`;
    text += `ALL SHARED NOTES - ${activeChatName.toUpperCase()}\n`;
    text += `Exported: ${new Date().toLocaleString()}\n`;
    text += `Total Notes: ${noteMsgs.length}\n`;
    text += `==================================================\n\n`;

    noteMsgs.forEach((msg, idx) => {
      const title = msg.title || `Note ${idx + 1}`;
      const author = msg.sender?.name || "Member";
      const time = new Date(msg.createdAt).toLocaleString();
      text += `--- NOTE ${idx + 1}: ${title} ---\n`;
      text += `Author: ${author} | Date: ${time}\n\n`;
      text += `${msg.text}\n\n`;
      if (msg.file) {
        text += `Attachment: ${msg.file.filename}\n`;
      }
      text += `--------------------------------------------------\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanName = activeChatName.replace(/[^a-zA-Z0-9_-]/g, "");
    link.download = `${cleanName}_all_notes.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "All Notes Downloaded", description: `Downloaded ${noteMsgs.length} note(s) as .${format.toUpperCase()}` });
  };

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
                           <SelectItem key={t.id || t._id} value={t.id || t._id}>{t.name}</SelectItem>
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
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      activeChannelId === c._id
                        ? "bg-primary/10 text-primary font-bold border-l-2 border-primary rounded-l-none"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="opacity-70 font-mono">#</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    {c.createdBy && (c.createdBy._id === user?.id || c.createdBy === user?.id) && (
                      <span className="text-[8px] px-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded">
                        Host
                      </span>
                    )}
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
              <div className="p-3.5 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-black/20 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-white truncate">{activeChatName}</h4>
                    {activeChannelId && isHost && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        Host
                      </span>
                    )}
                  </div>
                  {activeDmUserId && (
                    <p className="text-[9px] text-zinc-500 capitalize">
                      Status: {onlinePresence[activeDmUserId] || "offline"}
                    </p>
                  )}
                  {activeChannelId && (
                    <p className="text-[9px] text-zinc-500 truncate max-w-xs sm:max-w-md">
                      {activeChannel?.description || "Public team channel"}
                      {activeChannel?.members && ` • ${activeChannel.members.length} members`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-32 sm:w-40">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <Input
                      placeholder="Search messages..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="pl-8 pr-3 h-7 text-[10px] bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Share / Export Chat Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareDialogOpen(true)}
                    className="h-7 px-2 text-[10px] gap-1 bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-500" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>

                  {/* Channel specific action buttons */}
                  {activeChannelId && (
                    <>
                      {/* Add Members Button (Host only) */}
                      {isHost && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            fetchMeetingAttendees();
                            setIsAddMembersDialogOpen(true);
                          }}
                          className="h-7 px-2 text-[10px] gap-1 bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="hidden sm:inline">Add Members</span>
                        </Button>
                      )}

                      {/* Leave Channel Button (Member only) */}
                      {!isHost && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsLeaveDialogOpen(true)}
                          className="h-7 px-2 text-[10px] gap-1 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Leave</span>
                        </Button>
                      )}

                      {/* Delete Channel Button (Host only) */}
                      {isHost && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDeleteDialogOpen(true)}
                          className="h-7 px-2 text-[10px] gap-1 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Message history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages
                  .filter((m) => {
                    if (activeTab === "messages" && m.type === "note") return false;
                    if (activeTab === "notes" && m.type !== "note") return false;
                    return !chatSearchQuery.trim()
                      ? true
                      : (m.text + " " + (m.title || "")).toLowerCase().includes(chatSearchQuery.toLowerCase());
                  })
                  .map((msg) => {
                    const isMe = msg.sender?._id === user?.id;
                    const senderInitial = (msg.sender?.name || "?").charAt(0).toUpperCase();

                    // RENDER NOTE ITEM
                    if (msg.type === "note") {
                      return (
                        <div key={msg._id} className="w-full bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-sm relative group">
                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{msg.title || "Shared Note"}</h4>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider shrink-0">
                                    Note
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-500">
                                  By {msg.sender?.name || "Member"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>

                            {/* Download Single Note Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadSingleNote(msg, "txt")}
                                className="h-6 text-[10px] px-2 gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 bg-white dark:bg-black/40"
                                title="Download Note as TXT"
                              >
                                <Download className="w-3 h-3" />
                                <span>.TXT</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadSingleNote(msg, "md")}
                                className="h-6 text-[10px] px-2 gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 bg-white dark:bg-black/40"
                                title="Download Note as Markdown"
                              >
                                <FileText className="w-3 h-3" />
                                <span>.MD</span>
                              </Button>
                            </div>
                          </div>

                          {/* Note Body Text */}
                          <div className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans bg-white/60 dark:bg-black/30 p-3 rounded-xl border border-amber-500/10">
                            {msg.text}
                          </div>

                            {msg.file && (
                              <div className="mt-2 p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-between gap-3 border border-blue-500/20 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                  <span className="font-semibold truncate text-zinc-900 dark:text-white text-xs">{msg.file.filename}</span>
                                </div>
                                <a
                                  href={msg.file.fileUrl}
                                  download={msg.file.filename}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-[10px] font-bold shrink-0 transition-all shadow-sm"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                              </div>
                            )}
                        </div>
                      );
                    }

                    // RENDER STANDARD CHAT MESSAGE
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
                              <div className="mt-2.5 p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-between gap-3 border border-blue-500/20 text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                  <span className="font-semibold truncate text-zinc-900 dark:text-white text-[11px]">{msg.file.filename}</span>
                                </div>
                                <a
                                  href={msg.file.fileUrl}
                                  download={msg.file.filename}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-[10px] font-bold shrink-0 transition-all shadow-sm"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
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

      {/* Delete Channel Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm font-bold">
              <Trash2 className="w-4 h-4" />
              Delete Collaboration Channel
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
            <p>
              Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-white">{activeChatName}</strong>?
            </p>
            <p className="text-[11px] text-rose-500 font-medium">
              This action cannot be undone. All messages, shared files, and member access will be removed permanently for all participants.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteChannel}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Channel Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <LogOut className="w-4 h-4 text-amber-500" />
              Leave Collaboration Channel
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
            <p>
              Are you sure you want to leave <strong className="text-zinc-900 dark:text-white">{activeChatName}</strong>?
            </p>
            <p className="text-[11px]">
              You will no longer receive messages or notifications from this channel. You can only rejoin if the channel host adds you again.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLeaveChannel}>
              Leave Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share / Export Chat Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <Share2 className="w-4 h-4 text-sky-500" />
              Share & Export Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-zinc-500">
              Export conversation history for <strong className="text-zinc-900 dark:text-white">{activeChatName}</strong> in a clean, readable format.
            </p>
            <div className="p-3 bg-zinc-950 text-zinc-100 font-mono text-[11px] rounded-xl max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-zinc-800">
              {formattedChatExport}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="gap-1.5 text-xs">
              <Copy className="w-3.5 h-3.5" />
              Copy to Clipboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownloadChat("txt")} className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Download .TXT
            </Button>
            <Button size="sm" onClick={() => handleDownloadChat("md")} className="gap-1.5 text-xs bg-primary text-primary-foreground">
              <Download className="w-3.5 h-3.5" />
              Download .MD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members from Meeting Participants Dialog */}
      <Dialog open={isAddMembersDialogOpen} onOpenChange={setIsAddMembersDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Add Members from Meeting Participants
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-zinc-500">
              Select participants from meeting attendee records or registered workspace users to add them directly to <strong className="text-zinc-900 dark:text-white">{activeChatName}</strong>.
            </p>

            {isLoadingAttendees ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-zinc-500">Loading meeting participants...</span>
              </div>
            ) : meetingAttendees.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 italic">
                No extra participants found to add.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {meetingAttendees.map((att) => {
                  const isAlreadyMember = activeChannel?.members?.some(
                    (m: any) => (m._id || m.id || m) === att.id
                  );
                  const isSelected = selectedAttendeeIds.includes(att.id);

                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        if (isAlreadyMember) return;
                        setSelectedAttendeeIds((prev) =>
                          isSelected ? prev.filter((id) => id !== att.id) : [...prev, att.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isAlreadyMember
                          ? "bg-zinc-100 dark:bg-white/5 opacity-60 border-transparent cursor-not-allowed"
                          : isSelected
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-white dark:bg-card border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                          {att.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-zinc-900 dark:text-white truncate">{att.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{att.email || att.source}</div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isAlreadyMember ? (
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded">
                            Member
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddMembersDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddMembers}
              disabled={selectedAttendeeIds.length === 0}
              className="bg-primary text-primary-foreground"
            >
              Add Selected ({selectedAttendeeIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create & Share Note Dialog */}
      <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <FileText className="w-4 h-4 text-amber-500" />
              Create & Share Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-zinc-500">
              Publish a note to <strong className="text-zinc-900 dark:text-white">{activeChatName}</strong>. All channel members will see this note in real-time and can download it anytime.
            </p>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Note Title</Label>
              <Input
                placeholder="e.g. Project Specs / Key Action Items"
                value={noteTitleInput}
                onChange={(e) => setNoteTitleInput(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Note Content *</Label>
              <textarea
                rows={5}
                placeholder="Write your note content here..."
                value={noteContentInput}
                onChange={(e) => setNoteContentInput(e.target.value)}
                className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendNote}
              disabled={!noteContentInput.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              Publish Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
