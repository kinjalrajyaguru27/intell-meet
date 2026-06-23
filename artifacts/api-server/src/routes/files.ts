import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { FileModel, Channel, Team, Meeting } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { canAccessMeeting } from "../lib/authHelpers";

const router = Router();

// Apply auth middleware to all file endpoints
router.use(requireAuth);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// POST /api/files/upload - Stream file upload from raw request binary
router.post("/upload", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filename = (req.headers["x-filename"] as string) || `file_${Date.now()}`;
  const mimeType = (req.headers["content-type"] as string) || "application/octet-stream";
  const channelId = req.headers["x-channel-id"] as string;
  const meetingId = req.headers["x-meeting-id"] as string;

  try {
    // If channelId is provided, verify channel exists and user has access
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
    }

    // If meetingId is provided, verify meeting exists and user has access
    if (meetingId) {
      const hasMeetingAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasMeetingAccess) {
        res.status(403).json({ error: "Forbidden: You do not have access to this meeting" });
        return;
      }
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Create a safe, unique filename
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);

    req.on("error", (err) => {
      req.log.error({ err }, "File upload stream error");
      res.status(500).json({ error: "Upload failed: " + err.message });
    });

    writeStream.on("finish", async () => {
      try {
        const stats = fs.statSync(filePath);
        const sizeBytes = stats.size;
        const fileUrl = `/api/files/download/${safeFilename}`;

        const fileObj = new FileModel({
          filename,
          mimeType,
          sizeBytes,
          fileUrl,
          uploadedBy: req.user!.id,
          channel: channelId || undefined,
          meeting: meetingId || undefined,
        });

        await fileObj.save();
        
        req.log.info({ fileId: fileObj._id.toString(), filename }, "File uploaded successfully");
        res.status(201).json(fileObj);
      } catch (error) {
        req.log.error({ error }, "Error finalising file upload");
        res.status(500).json({ error: "Failed to save file metadata" });
      }
    });
  } catch (error) {
    req.log.error({ error }, "Upload initialization error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/files - List uploaded files
router.get("/", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { channelId, meetingId } = req.query;

  try {
    const filter: any = {};
    if (channelId) {
      // Verify user has access to channel
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
      filter.channel = channelId;
    }
    if (meetingId) {
      // Verify user has access to meeting
      const hasMeetingAccess = await canAccessMeeting(meetingId as string, req.user.id);
      if (!hasMeetingAccess) {
        res.status(403).json({ error: "Forbidden: You do not have access to this meeting" });
        return;
      }
      filter.meeting = meetingId;
    }

    // If no specific channel or meeting is specified, list files uploaded by the user
    if (!channelId && !meetingId) {
      filter.uploadedBy = req.user.id;
    }

    const files = await FileModel.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    req.log.error({ error }, "Error fetching files list");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/files/:fileId - Retrieve file metadata
router.get("/:fileId", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const file = await FileModel.findById(req.params.fileId).populate("uploadedBy", "name email");
    if (!file) {
      res.status(404).json({ error: "File metadata not found" });
      return;
    }

    // Access check: Only allow if uploaded by user, or user has access to the associated channel/meeting
    const uBy = file.uploadedBy as any;
    let hasAccess = (uBy && uBy._id && uBy._id.toString() === req.user.id) || uBy === req.user.id || file.uploadedBy === req.user.id;
    if (!hasAccess && file.channel) {
      const channel = await Channel.findById(file.channel);
      if (channel) {
        const team = await Team.findOne({
          _id: channel.teamId,
          $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
        });
        if (team) hasAccess = true;
      }
    }
    if (!hasAccess && file.meeting) {
      const hasMeetingAccess = await canAccessMeeting(file.meeting, req.user.id);
      if (hasMeetingAccess) hasAccess = true;
    }

    if (!hasAccess) {
      res.status(403).json({ error: "Forbidden: You do not have access to this file" });
      return;
    }

    res.json(file);
  } catch (error) {
    req.log.error({ error }, "Error fetching file metadata");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/files/download/:filename - Download and serve file from disk
router.get("/download/:filename", async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const filename = req.params.filename as string;

  // Strict path traversal prevention validation
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const filePath = path.resolve(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found on server disk" });
    return;
  }

  try {
    let fileMeta = await FileModel.findOne({ fileUrl: `/api/files/download/${filename}` });
    let isReport = false;
    let reportMeta: any = null;

    if (!fileMeta) {
      const { Report } = await import("@workspace/db");
      reportMeta = await Report.findOne({ fileUrl: `/api/files/download/${filename}` });
      if (!reportMeta) {
        res.status(404).json({ error: "File metadata not found" });
        return;
      }
      isReport = true;
    }

    // Access check: Only allow if uploaded/generated by user, or user has access to the associated channel/meeting
    let hasAccess = false;
    if (isReport) {
      hasAccess = reportMeta.generatedBy?.toString() === req.user.id;
    } else {
      hasAccess = fileMeta.uploadedBy?.toString() === req.user.id;
      if (!hasAccess && fileMeta.channel) {
        const channel = await Channel.findById(fileMeta.channel);
        if (channel) {
          const team = await Team.findOne({
            _id: channel.teamId,
            $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
          });
          if (team) hasAccess = true;
        }
      }
      if (!hasAccess && fileMeta.meeting) {
        const hasMeetingAccess = await canAccessMeeting(fileMeta.meeting, req.user.id);
        if (hasMeetingAccess) hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(403).json({ error: "Forbidden: You do not have access to this file" });
      return;
    }

    const mimeType = isReport
      ? (reportMeta.format === "CSV" ? "text/csv" : "text/plain")
      : fileMeta.mimeType;
    const originalName = isReport ? filename : fileMeta.filename;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    req.log.error({ error }, "Error sending file");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
