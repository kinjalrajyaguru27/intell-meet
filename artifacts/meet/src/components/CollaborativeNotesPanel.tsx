import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Save,
  Download,
  Copy,
  Paperclip,
  Globe,
  Lock,
  Users,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  Shield,
  X,
  Edit3,
  FileCheck,
} from "lucide-react";

export interface NoteAttachment {
  id: string;
  name: string;
  url: string; // Data URL or Web link
  size?: string;
  type?: string;
  addedAt: string;
}

export interface NoteItem {
  id: string;
  title?: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  visibility: "everyone" | "selected";
  allowedViewers: string[]; // List of user IDs / display names
  attachments: NoteAttachment[];
}

export interface NotesPermissions {
  mode: "everyone" | "host_only" | "selected";
  allowedEditors: string[];
}

export interface ParticipantInfo {
  id: string;
  displayName: string;
  isHost?: boolean;
}

interface CollaborativeNotesPanelProps {
  notes?: string;
  onChange?: (newNotes: string) => void;
  onSaveNow?: () => void;
  isSaving?: boolean;
  meetingTitle?: string;
  activeMeetingId?: string;
  socket?: any;
  userRole?: string;
  isHost?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  participants?: ParticipantInfo[];
  notesPermissions?: NotesPermissions;
  notesList?: NoteItem[];
  onNotesListChange?: (newNotesList: NoteItem[], newPermissions?: NotesPermissions) => void;
  onPermissionsChange?: (newPermissions: NotesPermissions) => void;
}

export default function CollaborativeNotesPanel({
  notes = "",
  onChange,
  onSaveNow,
  isSaving = false,
  meetingTitle = "Meeting Notes",
  activeMeetingId,
  socket,
  userRole = "participant",
  isHost = false,
  currentUserId = "",
  currentUserName = "User",
  participants = [],
  notesPermissions: initialPermissions,
  notesList: initialNotesList,
  onNotesListChange,
  onPermissionsChange,
}: CollaborativeNotesPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Host Notes Permissions State
  const [permissions, setPermissions] = useState<NotesPermissions>(() => {
    return (
      initialPermissions || {
        mode: "everyone",
        allowedEditors: [],
      }
    );
  });

  // Notes List State
  const [notesList, setNotesList] = useState<NoteItem[]>(() => {
    if (initialNotesList && initialNotesList.length > 0) return initialNotesList;
    if (notes && notes.trim()) {
      return [
        {
          id: "default_note_1",
          title: "Collaborative Note",
          content: notes,
          authorId: "system",
          authorName: "Meeting Assistant",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          visibility: "everyone",
          allowedViewers: [],
          attachments: [],
        },
      ];
    }
    return [];
  });

  // Modals & Forms State
  const [showHostPermissionsModal, setShowHostPermissionsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Note Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formVisibility, setFormVisibility] = useState<"everyone" | "selected">("everyone");
  const [formAllowedViewers, setFormAllowedViewers] = useState<string[]>([]);
  const [formAttachments, setFormAttachments] = useState<NoteAttachment[]>([]);

  // Host Permissions Form State
  const [tempMode, setTempMode] = useState<"everyone" | "host_only" | "selected">(permissions.mode);
  const [tempAllowedEditors, setTempAllowedEditors] = useState<string[]>(permissions.allowedEditors);

  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Sync external permissions & notesList when props update
  useEffect(() => {
    if (initialPermissions) {
      setPermissions(initialPermissions);
    }
  }, [initialPermissions]);

  useEffect(() => {
    if (initialNotesList && initialNotesList.length > 0) {
      setNotesList(initialNotesList);
    }
  }, [initialNotesList]);

  // Sync socket events for real-time permissions & notes updates
  useEffect(() => {
    if (!socket) return;

    const handlePermissionsUpdated = (data: { permissions: NotesPermissions }) => {
      if (data?.permissions) {
        setPermissions(data.permissions);
        toast({
          title: "Notes Permissions Changed",
          description:
            data.permissions.mode === "everyone"
              ? "Host allowed everyone to edit notes."
              : data.permissions.mode === "host_only"
              ? "Host restricted editing to Host only."
              : "Host restricted editing to selected participants.",
        });
      }
    };

    const handleNotesListUpdated = (data: { notesList: NoteItem[]; permissions?: NotesPermissions }) => {
      if (data?.notesList) {
        setNotesList(data.notesList);
        if (onChange) {
          const combined = data.notesList.map((n) => n.content).join("\n\n");
          onChange(combined);
        }
      }
      if (data?.permissions) {
        setPermissions(data.permissions);
      }
    };

    socket.on("notes-permissions-updated", handlePermissionsUpdated);
    socket.on("notes-list-updated", handleNotesListUpdated);

    return () => {
      socket.off("notes-permissions-updated", handlePermissionsUpdated);
      socket.off("notes-list-updated", handleNotesListUpdated);
    };
  }, [socket, onChange, toast]);

  // Evaluate Edit Permission for Current User
  const canEdit = useMemo(() => {
    if (isHost || userRole === "host") return true;
    if (permissions.mode === "everyone") return true;
    if (permissions.mode === "host_only") return false;
    if (permissions.mode === "selected") {
      const matchId = currentUserId && permissions.allowedEditors.includes(currentUserId);
      const matchName = currentUserName && permissions.allowedEditors.includes(currentUserName);
      return Boolean(matchId || matchName);
    }
    return true;
  }, [isHost, userRole, permissions, currentUserId, currentUserName]);

  // Filter Visible Notes for Current User
  const visibleNotes = useMemo(() => {
    return notesList.filter((note) => {
      if (note.visibility === "everyone" || !note.visibility) return true;
      if (isHost || userRole === "host") return true;
      if (note.authorId === currentUserId || note.authorName === currentUserName) return true;
      if (
        Array.isArray(note.allowedViewers) &&
        (note.allowedViewers.includes(currentUserId) || note.allowedViewers.includes(currentUserName))
      ) {
        return true;
      }
      return false;
    });
  }, [notesList, isHost, userRole, currentUserId, currentUserName]);

  // Handle Host Saving Permission Settings
  const handleSaveHostPermissions = () => {
    const updatedPermissions: NotesPermissions = {
      mode: tempMode,
      allowedEditors: tempAllowedEditors,
    };
    setPermissions(updatedPermissions);
    setShowHostPermissionsModal(false);

    if (socket && socket.connected) {
      socket.emit("notes-permissions-update", { permissions: updatedPermissions });
      socket.emit("notes-list-update", { notesList, permissions: updatedPermissions });
    }

    if (onPermissionsChange) {
      onPermissionsChange(updatedPermissions);
    }
    if (onNotesListChange) {
      onNotesListChange(notesList, updatedPermissions);
    }

    toast({
      title: "Notes Settings Saved",
      description: `Permission mode set to ${
        tempMode === "everyone"
          ? "Everyone"
          : tempMode === "host_only"
          ? "Only Host"
          : `${tempAllowedEditors.length} Selected Participants`
      }.`,
    });
  };

  // Open Modal for New Note
  const handleOpenNewNoteModal = () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "The host has restricted note creation.",
        variant: "destructive",
      });
      return;
    }
    setEditingNoteId(null);
    setFormTitle("");
    setFormContent("");
    setFormVisibility("everyone");
    setFormAllowedViewers([]);
    setFormAttachments([]);
    setShowNoteModal(true);
  };

  // Open Modal to Edit Existing Note
  const handleOpenEditNoteModal = (note: NoteItem) => {
    if (!canEdit && note.authorId !== currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit this note.",
        variant: "destructive",
      });
      return;
    }
    setEditingNoteId(note.id);
    setFormTitle(note.title || "");
    setFormContent(note.content || "");
    setFormVisibility(note.visibility || "everyone");
    setFormAllowedViewers(note.allowedViewers || []);
    setFormAttachments(note.attachments || []);
    setShowNoteModal(true);
  };

  // File Upload Handler (Browse PDF & Document files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();

      reader.onload = (event) => {
        const fileUrl = event.target?.result as string;
        const newAtt: NoteAttachment = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          url: fileUrl,
          size: `${sizeMb} MB`,
          type: file.type.includes("pdf") ? "pdf" : "file",
          addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setFormAttachments((prev) => [...prev, newAtt]);
        toast({
          title: "File Attached",
          description: `Attached ${file.name} to note.`,
        });
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save Note (New or Edit)
  const handleSaveNoteForm = () => {
    if (!formContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please write some note text before saving.",
        variant: "destructive",
      });
      return;
    }

    let updatedList: NoteItem[];

    if (editingNoteId) {
      updatedList = notesList.map((n) =>
        n.id === editingNoteId
          ? {
              ...n,
              title: formTitle.trim() || "Untitled Note",
              content: formContent.trim(),
              visibility: formVisibility,
              allowedViewers: formVisibility === "selected" ? formAllowedViewers : [],
              attachments: formAttachments,
              updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }
          : n
      );
    } else {
      const newNote: NoteItem = {
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: formTitle.trim() || `Note ${notesList.length + 1}`,
        content: formContent.trim(),
        authorId: currentUserId || "user_" + Date.now(),
        authorName: currentUserName || "Participant",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        visibility: formVisibility,
        allowedViewers: formVisibility === "selected" ? formAllowedViewers : [],
        attachments: formAttachments,
      };
      updatedList = [newNote, ...notesList];
    }

    setNotesList(updatedList);
    setShowNoteModal(false);

    // Broadcast update
    if (socket && socket.connected) {
      socket.emit("notes-list-update", { notesList: updatedList, permissions });
    }

    const combinedNotesText = updatedList.map((n) => n.content).join("\n\n");
    if (onChange) onChange(combinedNotesText);
    if (onNotesListChange) onNotesListChange(updatedList, permissions);

    toast({
      title: editingNoteId ? "Note Updated" : "Note Created",
      description: `Saved note with ${formVisibility === "everyone" ? "Everyone" : "Selected People"} visibility.`,
    });
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    const updatedList = notesList.filter((n) => n.id !== noteId);
    setNotesList(updatedList);

    if (socket && socket.connected) {
      socket.emit("notes-list-update", { notesList: updatedList, permissions });
    }

    const combinedNotesText = updatedList.map((n) => n.content).join("\n\n");
    if (onChange) onChange(combinedNotesText);
    if (onNotesListChange) onNotesListChange(updatedList, permissions);

    toast({
      title: "Note Deleted",
      description: "Removed note from meeting.",
    });
  };

  // Copy Single Note Content
  const handleCopyNoteContent = (note: NoteItem) => {
    navigator.clipboard.writeText(`${note.title ? note.title + "\n" : ""}${note.content}`);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
    toast({
      title: "Copied to Clipboard",
      description: "Note copied successfully.",
    });
  };

  // Export All Visible Notes as TXT
  const handleDownloadAllTxt = () => {
    let content = `# ${meetingTitle}\nExported on: ${new Date().toLocaleString()}\n\n`;
    visibleNotes.forEach((n, idx) => {
      content += `--- Note ${idx + 1}: ${n.title || "Untitled"} ---\n`;
      content += `Author: ${n.authorName} | Time: ${n.createdAt} | Access: ${n.visibility.toUpperCase()}\n\n`;
      content += n.content + "\n\n";
      if (n.attachments && n.attachments.length > 0) {
        content += "Attachments:\n" + n.attachments.map((a) => `- ${a.name} (${a.size || ""})`).join("\n") + "\n\n";
      }
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meetingTitle.replace(/\s+/g, "_")}_Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden bg-background text-foreground h-full">
      {/* Hidden File Input for Device Browse */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,.xlsx,.pptx"
      />

      {/* Header & Controls Toolbar */}
      <div className="flex flex-col space-y-2 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight leading-none text-foreground dark:text-white">
                Collaborative Notes
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {visibleNotes.length} note(s) • Real-time sync & DB persistent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-2 py-0.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-2 py-0.5">
                <Check className="w-3 h-3 text-emerald-500" /> Saved
              </Badge>
            )}

            {onSaveNow && canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSaveNow}
                className="h-7 text-xs px-2 gap-1 font-semibold border-primary/30 text-primary hover:bg-primary/10"
              >
                <Save className="w-3 h-3" /> Save
              </Button>
            )}
          </div>
        </div>

        {/* Action Row: Permissions & Add Note */}
        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          {/* Host Notes Permissions Indicator / Settings Trigger */}
          <div className="flex items-center gap-1.5">
            {(isHost || userRole === "host") ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTempMode(permissions.mode);
                  setTempAllowedEditors(permissions.allowedEditors || []);
                  setShowHostPermissionsModal(true);
                }}
                className="h-7 text-[11px] px-2.5 gap-1.5 font-semibold border-border hover:bg-muted"
                title="Configure Notes Permissions (Host Control)"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Permissions:</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize font-medium">
                  {permissions.mode === "everyone"
                    ? "Everyone"
                    : permissions.mode === "host_only"
                    ? "Host Only"
                    : "Selected Users"}
                </Badge>
              </Button>
            ) : (
              <Badge variant="outline" className="text-[10px] px-2 py-1 gap-1 border-border text-muted-foreground font-medium">
                <Lock className="w-3 h-3" />
                Edit Access:{" "}
                <span className="font-semibold text-foreground capitalize">
                  {permissions.mode === "everyone"
                    ? "Everyone"
                    : permissions.mode === "host_only"
                    ? "Host Only"
                    : permissions.allowedEditors.includes(currentUserId) || permissions.allowedEditors.includes(currentUserName)
                    ? "Granted"
                    : "Restricted"}
                </span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadAllTxt}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground font-medium"
              title="Download Notes TXT"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            {canEdit && (
              <Button
                size="sm"
                onClick={handleOpenNewNoteModal}
                className="h-7 px-2.5 text-xs gap-1 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5" /> Add Note
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Non-Permitted Banner */}
      {!canEdit && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Host has restricted note editing to <strong>{permissions.mode === "host_only" ? "Host Only" : "Selected Participants"}</strong>. You can view permitted notes.</span>
          </div>
        </div>
      )}

      {/* Notes Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note) => (
            <div
              key={note.id}
              className="bg-card border border-border/80 hover:border-border rounded-xl p-3.5 space-y-2.5 shadow-sm transition-all group"
            >
              {/* Note Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {(note.authorName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground leading-tight">
                      {note.title || "Untitled Note"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {note.authorName} • {note.createdAt}
                    </span>
                  </div>
                </div>

                {/* Visibility Badge & Card Actions */}
                <div className="flex items-center gap-1">
                  {note.visibility === "selected" ? (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1 px-1.5 py-0 font-semibold"
                      title={`Shared with selected people (${note.allowedViewers?.length || 0})`}
                    >
                      <Users className="w-2.5 h-2.5" /> Selected People
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 px-1.5 py-0 font-semibold"
                    >
                      <Globe className="w-2.5 h-2.5" /> Everyone
                    </Badge>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopyNoteContent(note)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Copy Note Text"
                  >
                    {copiedNoteId === note.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>

                  {(canEdit || note.authorId === currentUserId || isHost) && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditNoteModal(note)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Edit Note"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Note Content Text */}
              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/40 font-sans">
                {note.content}
              </div>

              {/* Attached Files inside Note */}
              {note.attachments && note.attachments.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-border/40">
                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Paperclip className="w-3 h-3" /> Attached Files ({note.attachments.length})
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {note.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between bg-muted/40 hover:bg-muted/70 px-2 py-1.5 rounded-lg border border-border/40 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <FileCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium text-foreground text-[11px]">
                            {att.name}
                          </span>
                          {att.size && (
                            <span className="text-[9px] text-muted-foreground shrink-0">
                              ({att.size})
                            </span>
                          )}
                        </div>
                        <a
                          href={att.url}
                          download={att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          <Download className="w-3 h-3" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/80 rounded-xl bg-card/25 p-4 space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-muted-foreground">No notes available</p>
            <p className="text-[11px] text-muted-foreground/60 max-w-xs">
              {canEdit
                ? "Click 'Add Note' to create a note with visibility options and attached files."
                : "No notes have been shared with you in this meeting yet."}
            </p>
            {canEdit && (
              <Button
                size="sm"
                onClick={handleOpenNewNoteModal}
                className="h-7 px-3 text-xs font-semibold bg-primary text-primary-foreground mt-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Note
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-2 px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Auto-saved to Database History
        </span>
        <span>{visibleNotes.length} total visible</span>
      </div>

      {/* --- MODAL 1: Create / Edit Note Dialog --- */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                {editingNoteId ? "Edit Note" : "Create New Note"}
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-muted-foreground hover:text-foreground rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Note Title Input */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Note Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Action Items / Meeting Summary"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Note Content Textarea */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Note Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Write your note content here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                />
              </div>

              {/* Note Visibility Settings */}
              <div className="space-y-2 border-t border-border/60 pt-2.5">
                <label className="text-[11px] font-bold text-foreground block">
                  Note Visibility
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormVisibility("everyone")}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      formVisibility === "everyone"
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <div className="text-[11px]">
                      <div className="font-bold leading-tight">Everyone ✅</div>
                      <div className="text-[9px] opacity-75 font-normal">All meeting participants</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormVisibility("selected")}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      formVisibility === "selected"
                        ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <div className="text-[11px]">
                      <div className="font-bold leading-tight">Selected People</div>
                      <div className="text-[9px] opacity-75 font-normal">Pick specific participants</div>
                    </div>
                  </button>
                </div>

                {/* Selected People Checkboxes List */}
                {formVisibility === "selected" && (
                  <div className="bg-muted/30 border border-border rounded-lg p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Select Participants allowed to view:
                    </label>
                    {participants.length > 0 ? (
                      participants.map((p) => {
                        const isChecked = formAllowedViewers.includes(p.id) || formAllowedViewers.includes(p.displayName);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormAllowedViewers([...formAllowedViewers, p.id]);
                                } else {
                                  setFormAllowedViewers(
                                    formAllowedViewers.filter((id) => id !== p.id && id !== p.displayName)
                                  );
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span>{p.displayName} {p.isHost ? "(Host)" : ""}</span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">No other online participants in room.</p>
                    )}
                  </div>
                )}
              </div>

              {/* File Attachment Section */}
              <div className="border-t border-border/60 pt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Attach Files (PDF / Documents)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-6 text-[10px] px-2 gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Browse File
                  </Button>
                </div>

                {formAttachments.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {formAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded text-xs border border-border/40"
                      >
                        <span className="truncate max-w-[200px] font-medium text-[11px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormAttachments(formAttachments.filter((a) => a.id !== att.id))}
                          className="text-muted-foreground hover:text-destructive p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNoteModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNoteForm}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Host Settings / Permissions Modal --- */}
      {showHostPermissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Notes Permission Settings (Host Controls)
              </h3>
              <button
                onClick={() => setShowHostPermissionsModal(false)}
                className="text-muted-foreground hover:text-foreground rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Control who is allowed to create and edit notes during this meeting:
              </p>

              {/* Permission Mode Radios */}
              <div className="space-y-2">
                <label
                  onClick={() => setTempMode("everyone")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    tempMode === "everyone"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="perm_mode"
                    checked={tempMode === "everyone"}
                    onChange={() => setTempMode("everyone")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-foreground">Everyone can create and edit notes (Default)</div>
                    <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                      All participants in the meeting have full write and edit access.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setTempMode("host_only")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    tempMode === "host_only"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="perm_mode"
                    checked={tempMode === "host_only"}
                    onChange={() => setTempMode("host_only")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-foreground">Only Host can create and edit notes</div>
                    <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                      Participants can view notes, but cannot write or edit them.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setTempMode("selected")}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    tempMode === "selected"
                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                      : "bg-muted/20 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="perm_mode"
                    checked={tempMode === "selected"}
                    onChange={() => setTempMode("selected")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-foreground">Only Selected Participants can create and edit notes</div>
                    <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                      Choose specific users who are granted permission to write and edit notes.
                    </div>
                  </div>
                </label>
              </div>

              {/* Selected Participants Checkboxes for Edit Access */}
              {tempMode === "selected" && (
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Select Participants with Edit Permission:
                  </label>
                  {participants.length > 0 ? (
                    participants.map((p) => {
                      const isChecked = tempAllowedEditors.includes(p.id) || tempAllowedEditors.includes(p.displayName);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempAllowedEditors([...tempAllowedEditors, p.id]);
                              } else {
                                setTempAllowedEditors(
                                  tempAllowedEditors.filter((id) => id !== p.id && id !== p.displayName)
                                );
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="font-medium">{p.displayName} {p.isHost ? "(Host)" : ""}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">No participants found in call.</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHostPermissionsModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveHostPermissions}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
              >
                Apply Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
