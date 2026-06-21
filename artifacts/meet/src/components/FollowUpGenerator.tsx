import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  FileText,
  Bell,
  UserCheck,
  Send,
  Download,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";

interface FollowUpGeneratorProps {
  meeting: {
    name: string;
    startedAt: string;
    durationSeconds: number | null;
    participantNames: string[];
    notes: string | null;
    actionItems: Array<{
      text: string;
      assigneeName: string | null;
      dueDate: string | null;
      isDone: boolean;
    }>;
  };
  decisions: Array<{
    decision: string;
    owner: string;
    impact: string;
  }>;
}

export function FollowUpGenerator({ meeting, decisions }: FollowUpGeneratorProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<
    "email" | "recap" | "actions" | "notification" | "client"
  >("email");

  const formattedDate = useMemo(() => {
    return new Date(meeting.startedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [meeting.startedAt]);

  // Template contents generator
  const generatedContent = useMemo(() => {
    const title = meeting.name;
    const participantsList = meeting.participantNames.join(", ") || "None";
    const notesContent = meeting.notes || "No meeting summaries recorded.";

    const actionItemsText =
      meeting.actionItems.length === 0
        ? "* None assigned."
        : meeting.actionItems
            .map(
              (item) =>
                `- [ ] ${item.text}${item.assigneeName ? ` (Assignee: ${item.assigneeName})` : ""}${
                  item.dueDate ? ` - Due: ${item.dueDate}` : ""
                }`
            )
            .join("\n");

    const decisionsText =
      decisions.length === 0
        ? "* No decisions registered."
        : decisions.map((d) => `- ${d.decision} (Maker: ${d.owner}, Impact: ${d.impact})`).join("\n");

    switch (selectedTemplate) {
      case "email":
        return `Subject: Meeting Follow-up & Action Items: ${title} (${formattedDate})

Hi Team,

Thank you for attending today's sync. Below is a recap of what we discussed, decisions taken, and next steps.

---

### Executive Recap
${notesContent.split("\n\n")[0] || notesContent}

### Key Decisions Made
${decisionsText}

### Extracted Action Items
${actionItemsText}

---

Please review your respective action items and update status updates on the platform.

Best regards,
Meeting Intelligence System`;

      case "recap":
        return `# MEETING RECAP: ${title.toUpperCase()}

**Date:** ${formattedDate}
**Attendees:** ${participantsList}

---

## 1. Summary of Notes & Context
${notesContent}

## 2. Key Decisions
${decisionsText}

## 3. Immediate Action Items
${actionItemsText}

---
*Report automatically compiled by Intell Meet AI Module.*`;

      case "actions":
        return `# ACTION ITEM REGISTER: ${title.toUpperCase()}

**Sync Date:** ${formattedDate}
**Participant Size:** ${meeting.participantNames.length} attendees

The following commitments were captured during today's call:

${meeting.actionItems.length === 0 ? "No tasks extracted." : ""}
${meeting.actionItems
  .map(
    (item, index) => `${index + 1}. [${item.isDone ? "RESOLVED" : "PENDING"}] ${item.text}
   - Assignee: ${item.assigneeName || "Unassigned"}
   - Priority Limit: ${item.dueDate || "As soon as possible"}`
  )
  .join("\n\n")}

---
Please update the Kanban board for tracking.`;

      case "notification":
        return `📢 *Intell Meet Update: ${title} (${formattedDate})*

Today the team held a sync with ${meeting.participantNames.length} participants.

*Key Choices Node:*
${decisions.map((d) => `• *Decision*: "${d.decision}" (${d.owner})`).join("\n") || "• General updates reviewed."}

*Open Actions:*
${meeting.actionItems.map((i) => `• *Task*: ${i.text} (${i.assigneeName || "Unassigned"})`).join("\n") || "• No action items."}

View full summaries on the Platform Dashboard.`;

      case "client":
        return `Dear Client,

We are pleased to share the project coordination brief following our sync on ${formattedDate}.

### Meeting Focus: ${title}
We reviewed the progress on milestones, coordinated requirements, and mapped next developmental tracks.

### Decisions Resolved
${decisions.map((d) => `• ${d.decision}`).join("\n") || "• Platform configurations aligned."}

### Agreed Deliverables & Timelines
${meeting.actionItems
  .map(
    (i) => `• ${i.text} - Target: ${i.dueDate || "Next sprint milestone"} (Responsible: ${i.assigneeName || "Team"})`
  )
  .join("\n") || "• No deliverables registered."}

Should you have any questions or feedback, please don't hesitate to reach out.

Warm regards,
The Engineering Team`;
    }
  }, [meeting, decisions, selectedTemplate, formattedDate]);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: "Copied", description: "Follow-up text copied to clipboard." });
  };

  // 1. PDF Export (using clean iframe printing)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Meeting Report - ${meeting.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            h1 { color: #8b5cf6; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; }
            h2 { color: #3b82f6; font-size: 18px; margin-top: 30px; }
            h3 { color: #111827; font-size: 14px; margin-top: 20px; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .meta { font-size: 12px; color: #6b7280; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>Meeting Report: ${meeting.name}</h1>
          <div class="meta">
            <strong>Date:</strong> ${formattedDate} | 
            <strong>Participants:</strong> ${meeting.participantNames.join(", ") || "None"}
          </div>
          <pre>${generatedContent}</pre>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast({ title: "Exporting PDF", description: "Print dialog launched successfully." });
  };

  // 2. DOCX Export (using HTML Word mime)
  const handleExportDOCX = () => {
    const title = meeting.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const formattedHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${meeting.name}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
            h1 { color: #7c3aed; font-size: 18pt; border-bottom: 1px solid #ddd; }
            pre { font-family: Arial, sans-serif; font-size: 11pt; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${meeting.name}</h1>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Attendees:</strong> ${meeting.participantNames.join(", ")}</p>
          <pre>${generatedContent}</pre>
        </body>
      </html>
    `;
    const blob = new Blob(["\ufeff" + formattedHtml], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meeting_recap_${title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "DOCX Exported", description: "Word document successfully downloaded." });
  };

  // 3. CSV Export (for Action Items table)
  const handleExportCSV = () => {
    let csvContent = "Action Item,Assignee,Due Date,Status\n";
    meeting.actionItems.forEach((item) => {
      csvContent += `"${item.text.replace(/"/g, '""')}","${
        item.assigneeName || "Unassigned"
      }","${item.dueDate || "As soon as possible"}","${item.isDone ? "Done" : "Todo"}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `action_items_${meeting.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Exported", description: "CSV datasheet successfully downloaded." });
  };

  // 4. Excel Export (using HTML table technique)
  const handleExportExcel = () => {
    let htmlTable = `
      <table border="1">
        <tr style="background-color: #8b5cf6; color: white; font-weight: bold;">
          <th>Action Item</th>
          <th>Assignee</th>
          <th>Due Date</th>
          <th>Status</th>
        </tr>
    `;
    meeting.actionItems.forEach((item) => {
      htmlTable += `
        <tr>
          <td>${item.text}</td>
          <td>${item.assigneeName || "Unassigned"}</td>
          <td>${item.dueDate || "As soon as possible"}</td>
          <td>${item.isDone ? "Done" : "Todo"}</td>
        </tr>
      `;
    });
    htmlTable += "</table>";

    const blob = new Blob(["\ufeff" + htmlTable], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `action_items_${meeting.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Excel Exported", description: "Excel spreadsheet successfully downloaded." });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Selector sidebar */}
      <div className="md:col-span-1 space-y-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2">
          Select AI Format
        </span>
        <button
          onClick={() => setSelectedTemplate("email")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
            selectedTemplate === "email"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          }`}
        >
          <Mail className="w-4 h-4" />
          Follow-up Email
        </button>
        <button
          onClick={() => setSelectedTemplate("recap")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
            selectedTemplate === "recap"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Meeting Recap
        </button>
        <button
          onClick={() => setSelectedTemplate("actions")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
            selectedTemplate === "actions"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Action Item Summary
        </button>
        <button
          onClick={() => setSelectedTemplate("notification")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
            selectedTemplate === "notification"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          }`}
        >
          <Bell className="w-4 h-4" />
          Team Notification
        </button>
        <button
          onClick={() => setSelectedTemplate("client")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
            selectedTemplate === "client"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          }`}
        >
          <Mail className="w-4 h-4" />
          Client Update
        </button>
      </div>

      {/* Editor & Actions */}
      <div className="md:col-span-3 space-y-4">
        <Card className="bg-card/30 border-white/5 backdrop-blur-md">
          <CardContent className="p-5 space-y-4">
            <textarea
              value={generatedContent}
              readOnly
              rows={12}
              className="w-full bg-muted/10 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none font-mono text-white resize-y leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
              <Button onClick={handleCopy} size="sm" variant="outline" className="gap-1.5 text-xs font-semibold rounded-full border-white/10 hover:bg-white/5">
                <Send className="w-3.5 h-3.5" />
                Copy to Clipboard
              </Button>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportPDF} size="sm" variant="outline" className="gap-1 px-3 text-xs rounded-full border-white/10 hover:bg-white/5">
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
                <Button onClick={handleExportDOCX} size="sm" variant="outline" className="gap-1 px-3 text-xs rounded-full border-white/10 hover:bg-white/5">
                  <FileCode className="w-3 h-3" />
                  Word
                </Button>
                <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-1 px-3 text-xs rounded-full border-white/10 hover:bg-white/5">
                  <FileSpreadsheet className="w-3 h-3" />
                  CSV
                </Button>
                <Button onClick={handleExportExcel} size="sm" variant="outline" className="gap-1 px-3 text-xs rounded-full border-white/10 hover:bg-white/5">
                  <FileSpreadsheet className="w-3 h-3" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
