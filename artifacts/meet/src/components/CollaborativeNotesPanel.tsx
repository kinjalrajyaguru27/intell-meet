import { useState, useRef, useEffect } from "react";
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
  Link,
  Plus,
  Trash2,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  size?: string;
  type: "file" | "drive" | "link";
  addedAt: string;
}

interface CollaborativeNotesPanelProps {
  notes: string;
  onChange: (newNotes: string) => void;
  onSaveNow?: () => void;
  isSaving?: boolean;
  meetingTitle?: string;
  activeMeetingId?: string;
  socket?: any;
  userRole?: string;
}

export default function CollaborativeNotesPanel({
  notes,
  onChange,
  onSaveNow,
  isSaving = false,
  meetingTitle = "Meeting Notes",
  activeMeetingId,
  socket,
  userRole = "participant",
}: CollaborativeNotesPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Note settings
  const [privacy, setPrivacy] = useState<"public" | "private" | "restricted">("public");
  const [attachments, setAttachments] = useState<NoteAttachment[]>(() => {
    try {
      const saved = localStorage.getItem(`notes_attachments_${activeMeetingId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync attachments to LocalStorage & parent
  useEffect(() => {
    if (activeMeetingId) {
      localStorage.setItem(`notes_attachments_${activeMeetingId}`, JSON.stringify(attachments));
    }
  }, [attachments, activeMeetingId]);

  // Listen for socket privacy or attachment updates
  useEffect(() => {
    if (!socket) return;
    const handlePrivacyUpdate = (data: { privacy: "public" | "private" | "restricted" }) => {
      setPrivacy(data.privacy);
    };
    const handleAttachmentUpdate = (data: { attachments: NoteAttachment[] }) => {
      setAttachments(data.attachments);
    };

    socket.on("notes-privacy-updated", handlePrivacyUpdate);
    socket.on("notes-attachments-updated", handleAttachmentUpdate);

    return () => {
      socket.off("notes-privacy-updated", handlePrivacyUpdate);
      socket.off("notes-attachments-updated", handleAttachmentUpdate);
    };
  }, [socket]);

  // Handle Privacy Change
  const handlePrivacyChange = (newPrivacy: "public" | "private" | "restricted") => {
    setPrivacy(newPrivacy);
    if (socket) {
      socket.emit("notes-privacy-update", { privacy: newPrivacy });
    }
    toast({
      title: "Notes Access Updated",
      description:
        newPrivacy === "public"
          ? "Notes are now visible to all participants."
          : newPrivacy === "private"
          ? "Notes are now private to you."
          : "Notes restricted to Host & Moderators.",
    });
  };

  // Handle File Upload from device (Browse)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: NoteAttachment[] = [];
    Array.from(files).forEach((file) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const fileUrl = URL.createObjectURL(file);
      newAttachments.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        url: fileUrl,
        size: `${sizeMb} MB`,
        type: "file",
        addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    });

    const updated = [...attachments, ...newAttachments];
    setAttachments(updated);
    if (socket) {
      socket.emit("notes-attachments-update", { attachments: updated });
    }

    toast({
      title: "File Attached",
      description: `Added ${newAttachments.length} file(s) to meeting notes.`,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Adding Google Drive or Web Link
  const handleAddDriveLink = () => {
    if (!driveUrl.trim()) return;
    const name = driveName.trim() || (driveUrl.includes("drive.google.com") ? "Google Drive Attachment" : "External Link");
    const newAtt: NoteAttachment = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      url: driveUrl.trim().startsWith("http") ? driveUrl.trim() : `https://${driveUrl.trim()}`,
      type: driveUrl.includes("drive.google.com") ? "drive" : "link",
      addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...attachments, newAtt];
    setAttachments(updated);
    if (socket) {
      socket.emit("notes-attachments-update", { attachments: updated });
    }

    setDriveUrl("");
    setDriveName("");
    setShowLinkModal(false);

    toast({
      title: "Link Attached",
      description: `Added link "${name}" to meeting notes.`,
    });
  };

  // Remove Attachment
  const handleRemoveAttachment = (id: string) => {
    const updated = attachments.filter((item) => item.id !== id);
    setAttachments(updated);
    if (socket) {
      socket.emit("notes-attachments-update", { attachments: updated });
    }
  };

  // Export as TXT / Markdown File
  const handleDownloadTxt = () => {
    const header = `# ${meetingTitle}\nDate: ${new Date().toLocaleDateString()}\nAccess: ${privacy.toUpperCase()}\n\n`;
    const content = header + notes + "\n\n--- ATTACHMENTS ---\n" + attachments.map((a) => `- ${a.name} (${a.url})`).join("\n");
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meetingTitle.replace(/\s+/g, "_")}_Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Notes Downloaded",
      description: "Saved TXT file to your device.",
    });
  };

  // Export as PDF (Print dialog formatted)
  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${meetingTitle} - Notes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          h1 { color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
          .content { font-size: 14px; white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .attachments { margin-top: 30px; font-size: 13px; }
          .attachments ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <h1>${meetingTitle}</h1>
        <div class="meta">Exported on ${new Date().toLocaleString()} | Privacy: ${privacy.toUpperCase()}</div>
        <div class="content">${notes || "No notes content."}</div>
        ${
          attachments.length > 0
            ? `<div class="attachments"><h3>Attachments</h3><ul>${attachments
                .map((a) => `<li>${a.name} - ${a.url}</li>`)
                .join("")}</ul></div>`
            : ""
        }
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Copy to Clipboard
  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to Clipboard",
      description: "Meeting notes copied successfully.",
    });
  };

  // Word count & Line count
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const lineCount = notes.split("\n").length;

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden bg-background text-foreground h-full">
      {/* Hidden File Input for Device Browse */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
      />

      {/* Header & Controls Bar */}
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
                Real-time sync & persistent storage
              </p>
            </div>
          </div>

          {/* Save Now Button & Saving Status */}
          <div className="flex items-center gap-1.5">
            {isSaving ? (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 px-2 py-0.5 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 px-2 py-0.5 font-medium">
                <Check className="w-3 h-3 text-emerald-500" /> Saved to DB
              </Badge>
            )}

            {onSaveNow && (
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

        {/* Privacy Selector Toolbar & Actions */}
        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          {/* Privacy Dropdown Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => handlePrivacyChange("public")}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                privacy === "public"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visible to all meeting participants"
            >
              <Globe className="w-3 h-3" /> Public
            </button>
            <button
              type="button"
              onClick={() => handlePrivacyChange("private")}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                privacy === "private"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Private to you only"
            >
              <Lock className="w-3 h-3" /> Private
            </button>
            <button
              type="button"
              onClick={() => handlePrivacyChange("restricted")}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                privacy === "restricted"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Restricted to Host & Selected Team"
            >
              <Users className="w-3 h-3" /> Team
            </button>
          </div>

          {/* Action Buttons: Export, Copy, Attachment */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyNotes}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Copy Notes to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDownloadTxt}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Download as TXT file"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportPdf}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground font-medium"
              title="Export formatted PDF"
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Text Area Input */}
      <div className="flex-1 flex flex-col min-h-[180px] relative">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            privacy === "private"
              ? "Write private meeting notes here... (Only visible to you)"
              : privacy === "restricted"
              ? "Write restricted meeting notes here... (Host & Team only)"
              : "Collaborative meeting notes... Edits sync in real-time with all participants."
          }
          className="w-full flex-1 bg-muted/30 border border-border/60 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 text-foreground font-sans leading-relaxed"
        />
        
        {/* Word Count Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 px-1">
          <span>
            {wordCount} words | {lineCount} lines
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> Auto-saved to meeting history
          </span>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="border-t border-border/60 pt-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5" /> Attachments ({attachments.length})
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-6 text-[11px] px-2 gap-1 font-medium border-border"
            >
              <Plus className="w-3 h-3" /> Add PDF / File
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLinkModal(true)}
              className="h-6 text-[11px] px-2 gap-1 font-medium border-border"
            >
              <Link className="w-3 h-3" /> Drive Link
            </Button>
          </div>
        </div>

        {/* Attachment List */}
        {attachments.length > 0 ? (
          <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-muted/40 hover:bg-muted/70 p-1.5 rounded-lg border border-border/40 text-xs transition-colors group"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  {item.type === "drive" ? (
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  ) : item.name.endsWith(".pdf") ? (
                    <FileText className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  ) : (
                    <File className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-medium text-foreground hover:underline hover:text-primary"
                  >
                    {item.name}
                  </a>
                  {item.size && <span className="text-[10px] text-muted-foreground flex-shrink-0">({item.size})</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(item.id)}
                  className="text-muted-foreground hover:text-destructive p-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Remove attachment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 italic text-center py-1">
            No files or Google Drive links attached yet.
          </p>
        )}
      </div>

      {/* Drive Link Modal / Input Dialog */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-4 w-full max-w-sm space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Link className="w-4 h-4 text-primary" /> Add File or Drive Link
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Link Title (e.g. Project Proposal PDF)"
                value={driveName}
                onChange={(e) => setDriveName(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="url"
                placeholder="Paste Google Drive URL or File Link (https://...)"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowLinkModal(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddDriveLink}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
              >
                Attach Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
