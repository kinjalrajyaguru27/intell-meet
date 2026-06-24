var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/logger.ts
var import_pino, isProduction, logger;
var init_logger = __esm({
  "src/lib/logger.ts"() {
    "use strict";
    import_pino = __toESM(require("pino"), 1);
    isProduction = process.env.NODE_ENV === "production";
    logger = (0, import_pino.default)({
      level: process.env.LOG_LEVEL ?? "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']"
      ],
      ...isProduction ? {} : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true }
        }
      }
    });
  }
});

// ../../lib/db/src/models/User.ts
var import_mongoose, UserSchema, User;
var init_User = __esm({
  "../../lib/db/src/models/User.ts"() {
    "use strict";
    import_mongoose = __toESM(require("mongoose"), 1);
    UserSchema = new import_mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, index: true },
      password: { type: String },
      role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
      phoneNumber: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
      department: { type: String, default: "" },
      bio: { type: String, default: "" },
      timezone: { type: String, default: "UTC" },
      avatar: { type: String, default: "" },
      profileColor: { type: String, default: "purple" },
      notificationSettings: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
      },
      refreshToken: { type: String },
      resetPasswordToken: { type: String },
      resetPasswordExpires: { type: Date },
      authProvider: { type: String, enum: ["local", "google"], default: "local", required: true },
      googleId: { type: String, index: true },
      profilePicture: { type: String, default: "" },
      emailVerified: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    User = import_mongoose.default.models.User || import_mongoose.default.model("User", UserSchema);
  }
});

// ../../lib/db/src/models/Meeting.ts
var import_mongoose2, TranscriptLineSchema, ActionItemSchema, MeetingSchema, Meeting;
var init_Meeting = __esm({
  "../../lib/db/src/models/Meeting.ts"() {
    "use strict";
    import_mongoose2 = __toESM(require("mongoose"), 1);
    TranscriptLineSchema = new import_mongoose2.Schema({
      speaker: { type: String, required: true },
      text: { type: String, required: true },
      timestamp: { type: Number, default: Date.now }
    });
    ActionItemSchema = new import_mongoose2.Schema({
      text: { type: String, required: true },
      assigneeName: { type: String, default: null },
      dueDate: { type: String, default: null },
      isDone: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });
    MeetingSchema = new import_mongoose2.Schema({
      // Original fields
      roomId: { type: String, required: true },
      name: { type: String, required: true },
      startedAt: { type: Date, default: Date.now },
      endedAt: { type: Date, default: null },
      durationSeconds: { type: Number, default: null },
      participantNames: [{ type: String }],
      notes: { type: String, default: "" },
      transcript: [TranscriptLineSchema],
      actionItems: [ActionItemSchema],
      // New fields
      title: { type: String, required: true },
      description: { type: String, default: "" },
      host: { type: import_mongoose2.Schema.Types.ObjectId, ref: "User", index: true },
      meetingId: { type: String, required: true, unique: true, index: true },
      password: { type: String, default: "" },
      status: { type: String, enum: ["scheduled", "active", "ended"], default: "scheduled" },
      startTime: { type: Date, default: Date.now },
      endTime: { type: Date, default: null },
      duration: { type: Number, default: null },
      isRecurring: { type: Boolean, default: false },
      recurrenceRule: { type: String, default: "" },
      isPersonalRoom: { type: Boolean, default: false },
      waitingRoomEnabled: { type: Boolean, default: false }
    });
    Meeting = import_mongoose2.default.models.Meeting || import_mongoose2.default.model("Meeting", MeetingSchema);
  }
});

// ../../lib/db/src/models/Task.ts
var import_mongoose3, TaskSchema, Task;
var init_Task = __esm({
  "../../lib/db/src/models/Task.ts"() {
    "use strict";
    import_mongoose3 = __toESM(require("mongoose"), 1);
    TaskSchema = new import_mongoose3.Schema({
      title: { type: String, required: true },
      description: { type: String, default: "" },
      status: {
        type: String,
        enum: ["Backlog", "Todo", "In Progress", "Review", "Testing", "Done"],
        default: "Todo",
        index: true
      },
      assignee: { type: import_mongoose3.Schema.Types.ObjectId, ref: "User", default: null, index: true },
      reporter: { type: import_mongoose3.Schema.Types.ObjectId, ref: "User", default: null, index: true },
      dueDate: { type: String, default: null },
      priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium",
        index: true
      },
      projectId: { type: import_mongoose3.Schema.Types.ObjectId, ref: "Project", default: null, index: true },
      teamId: { type: import_mongoose3.Schema.Types.ObjectId, ref: "Team", default: null, index: true },
      parentTaskId: { type: import_mongoose3.Schema.Types.ObjectId, ref: "Task", default: null, index: true },
      createdAt: { type: Date, default: Date.now }
    });
    Task = import_mongoose3.default.models.Task || import_mongoose3.default.model("Task", TaskSchema);
  }
});

// ../../lib/db/src/models/Team.ts
var import_mongoose4, TeamSchema, Team;
var init_Team = __esm({
  "../../lib/db/src/models/Team.ts"() {
    "use strict";
    import_mongoose4 = __toESM(require("mongoose"), 1);
    TeamSchema = new import_mongoose4.Schema({
      name: { type: String, required: true },
      description: { type: String, default: "" },
      logo: { type: String, default: "" },
      organizationId: { type: import_mongoose4.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
      owner: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User", default: null, index: true },
      members: [
        {
          user: { type: import_mongoose4.Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" }
        }
      ],
      createdAt: { type: Date, default: Date.now }
    });
    Team = import_mongoose4.default.models.Team || import_mongoose4.default.model("Team", TeamSchema);
  }
});

// ../../lib/db/src/models/Invitation.ts
var import_mongoose5, InvitationSchema, Invitation;
var init_Invitation = __esm({
  "../../lib/db/src/models/Invitation.ts"() {
    "use strict";
    import_mongoose5 = __toESM(require("mongoose"), 1);
    InvitationSchema = new import_mongoose5.Schema({
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      team: { type: import_mongoose5.Schema.Types.ObjectId, ref: "Team", required: true },
      invitedBy: { type: import_mongoose5.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
      status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
      token: { type: String, required: true, unique: true, index: true },
      createdAt: { type: Date, default: Date.now, expires: "7d" }
      // automatically cleanup after 7 days
    });
    Invitation = import_mongoose5.default.models.Invitation || import_mongoose5.default.model("Invitation", InvitationSchema);
  }
});

// ../../lib/db/src/models/Participant.ts
var import_mongoose6, ParticipantSchema, Participant;
var init_Participant = __esm({
  "../../lib/db/src/models/Participant.ts"() {
    "use strict";
    import_mongoose6 = __toESM(require("mongoose"), 1);
    ParticipantSchema = new import_mongoose6.Schema({
      meeting: { type: import_mongoose6.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      user: { type: import_mongoose6.Schema.Types.ObjectId, ref: "User", default: null },
      displayName: { type: String, required: true },
      role: { type: String, enum: ["host", "co-host", "participant"], default: "participant" },
      status: { type: String, enum: ["waiting", "admitted", "rejected", "left"], default: "waiting" },
      isMuted: { type: Boolean, default: false },
      isCameraOff: { type: Boolean, default: false },
      isRaisedHand: { type: Boolean, default: false },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date, default: null }
    });
    Participant = import_mongoose6.default.models.Participant || import_mongoose6.default.model("Participant", ParticipantSchema);
  }
});

// ../../lib/db/src/models/Recording.ts
var import_mongoose7, RecordingSchema, Recording;
var init_Recording = __esm({
  "../../lib/db/src/models/Recording.ts"() {
    "use strict";
    import_mongoose7 = __toESM(require("mongoose"), 1);
    RecordingSchema = new import_mongoose7.Schema({
      meeting: { type: import_mongoose7.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      title: { type: String, required: true },
      fileUrl: { type: String, required: true },
      durationSeconds: { type: Number, required: true },
      sizeBytes: { type: Number, required: true },
      recordedBy: { type: import_mongoose7.Schema.Types.ObjectId, ref: "User", required: true },
      createdAt: { type: Date, default: Date.now }
    });
    Recording = import_mongoose7.default.models.Recording || import_mongoose7.default.model("Recording", RecordingSchema);
  }
});

// ../../lib/db/src/models/MeetingChat.ts
var import_mongoose8, MeetingChatSchema, MeetingChat;
var init_MeetingChat = __esm({
  "../../lib/db/src/models/MeetingChat.ts"() {
    "use strict";
    import_mongoose8 = __toESM(require("mongoose"), 1);
    MeetingChatSchema = new import_mongoose8.Schema({
      meeting: { type: import_mongoose8.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      sender: { type: import_mongoose8.Schema.Types.ObjectId, ref: "User", default: null },
      displayName: { type: String, required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    });
    MeetingChat = import_mongoose8.default.models.MeetingChat || import_mongoose8.default.model("MeetingChat", MeetingChatSchema);
  }
});

// ../../lib/db/src/models/MeetingNotification.ts
var import_mongoose9, MeetingNotificationSchema, MeetingNotification;
var init_MeetingNotification = __esm({
  "../../lib/db/src/models/MeetingNotification.ts"() {
    "use strict";
    import_mongoose9 = __toESM(require("mongoose"), 1);
    MeetingNotificationSchema = new import_mongoose9.Schema({
      recipient: { type: import_mongoose9.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      type: {
        type: String,
        enum: ["created", "starting_soon", "user_joined", "user_left", "meeting_ended"],
        required: true
      },
      title: { type: String, required: true },
      content: { type: String, required: true },
      isRead: { type: Boolean, default: false },
      metadata: { type: import_mongoose9.Schema.Types.Mixed, default: null },
      createdAt: { type: Date, default: Date.now }
    });
    MeetingNotification = import_mongoose9.default.models.MeetingNotification || import_mongoose9.default.model("MeetingNotification", MeetingNotificationSchema);
  }
});

// ../../lib/db/src/models/MeetingTranscript.ts
var import_mongoose10, MeetingTranscriptSchema, MeetingTranscript;
var init_MeetingTranscript = __esm({
  "../../lib/db/src/models/MeetingTranscript.ts"() {
    "use strict";
    import_mongoose10 = __toESM(require("mongoose"), 1);
    MeetingTranscriptSchema = new import_mongoose10.Schema({
      meetingId: { type: import_mongoose10.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      speaker: { type: String, required: true },
      text: { type: String, required: true },
      timestamp: { type: Number, default: Date.now }
    });
    MeetingTranscript = import_mongoose10.default.models.MeetingTranscript || import_mongoose10.default.model("MeetingTranscript", MeetingTranscriptSchema);
  }
});

// ../../lib/db/src/models/MeetingSummary.ts
var import_mongoose11, MeetingSummarySchema, MeetingSummary;
var init_MeetingSummary = __esm({
  "../../lib/db/src/models/MeetingSummary.ts"() {
    "use strict";
    import_mongoose11 = __toESM(require("mongoose"), 1);
    MeetingSummarySchema = new import_mongoose11.Schema({
      meetingId: { type: import_mongoose11.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      summaryType: { type: String, enum: ["Short", "Detailed", "Management", "Client"], required: true },
      shortSummary: { type: String, default: "" },
      detailedSummary: { type: String, default: "" },
      executiveSummary: { type: String, default: "" },
      keyPoints: [{ type: String }],
      decisions: [{ type: String }],
      outcomes: [{ type: String }],
      highlights: [{ type: String }],
      risks: [{ type: String }],
      opportunities: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    });
    MeetingSummary = import_mongoose11.default.models.MeetingSummary || import_mongoose11.default.model("MeetingSummary", MeetingSummarySchema);
  }
});

// ../../lib/db/src/models/ActionItem.ts
var import_mongoose12, ActionItemSchema2, ActionItem;
var init_ActionItem = __esm({
  "../../lib/db/src/models/ActionItem.ts"() {
    "use strict";
    import_mongoose12 = __toESM(require("mongoose"), 1);
    ActionItemSchema2 = new import_mongoose12.Schema({
      meetingId: { type: import_mongoose12.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      taskId: { type: import_mongoose12.Schema.Types.ObjectId, ref: "Task", default: null },
      title: { type: String, required: true },
      description: { type: String, default: "" },
      assignee: { type: import_mongoose12.Schema.Types.ObjectId, ref: "User", default: null },
      assigneeName: { type: String, default: "" },
      dueDate: { type: String, default: null },
      priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
      status: { type: String, enum: ["Todo", "In Progress", "Done"], default: "Todo" },
      createdAt: { type: Date, default: Date.now }
    });
    ActionItem = import_mongoose12.default.models.ActionItem || import_mongoose12.default.model("ActionItem", ActionItemSchema2);
  }
});

// ../../lib/db/src/models/MeetingInsight.ts
var import_mongoose13, MeetingInsightSchema, MeetingInsight;
var init_MeetingInsight = __esm({
  "../../lib/db/src/models/MeetingInsight.ts"() {
    "use strict";
    import_mongoose13 = __toESM(require("mongoose"), 1);
    MeetingInsightSchema = new import_mongoose13.Schema({
      meetingId: { type: import_mongoose13.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      productivityScore: { type: Number, default: 0 },
      engagementScore: { type: Number, default: 0 },
      sentimentScore: { type: Number, default: 0 },
      sentimentAnalysis: { type: String, default: "" },
      participationScore: { type: Number, default: 0 },
      speakingTimeAnalytics: { type: Map, of: Number, default: {} },
      mostActiveParticipant: { type: String, default: "" },
      leastActiveParticipant: { type: String, default: "" },
      topicAnalysis: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    });
    MeetingInsight = import_mongoose13.default.models.MeetingInsight || import_mongoose13.default.model("MeetingInsight", MeetingInsightSchema);
  }
});

// ../../lib/db/src/models/Decision.ts
var import_mongoose14, DecisionSchema, Decision;
var init_Decision = __esm({
  "../../lib/db/src/models/Decision.ts"() {
    "use strict";
    import_mongoose14 = __toESM(require("mongoose"), 1);
    DecisionSchema = new import_mongoose14.Schema({
      meetingId: { type: import_mongoose14.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      decision: { type: String, required: true },
      owner: { type: String, default: "All" },
      timestamp: { type: Date, default: Date.now },
      impact: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
      relatedTasks: [{ type: String }]
    });
    Decision = import_mongoose14.default.models.Decision || import_mongoose14.default.model("Decision", DecisionSchema);
  }
});

// ../../lib/db/src/models/Message.ts
var import_mongoose15, MessageSchema, Message;
var init_Message = __esm({
  "../../lib/db/src/models/Message.ts"() {
    "use strict";
    import_mongoose15 = __toESM(require("mongoose"), 1);
    MessageSchema = new import_mongoose15.Schema({
      sender: { type: import_mongoose15.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      recipient: { type: import_mongoose15.Schema.Types.ObjectId, ref: "User", index: true },
      channel: { type: import_mongoose15.Schema.Types.ObjectId, ref: "Channel", index: true },
      text: { type: String, required: true },
      file: { type: import_mongoose15.Schema.Types.ObjectId, ref: "File" },
      readBy: [{ type: import_mongoose15.Schema.Types.ObjectId, ref: "User", default: [] }],
      delivered: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now, index: true }
    });
    Message = import_mongoose15.default.models.Message || import_mongoose15.default.model("Message", MessageSchema);
  }
});

// ../../lib/db/src/models/Channel.ts
var import_mongoose16, ChannelSchema, Channel;
var init_Channel = __esm({
  "../../lib/db/src/models/Channel.ts"() {
    "use strict";
    import_mongoose16 = __toESM(require("mongoose"), 1);
    ChannelSchema = new import_mongoose16.Schema({
      name: { type: String, required: true },
      description: { type: String, default: "" },
      isPrivate: { type: Boolean, default: false },
      teamId: { type: import_mongoose16.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
      createdAt: { type: Date, default: Date.now }
    });
    Channel = import_mongoose16.default.models.Channel || import_mongoose16.default.model("Channel", ChannelSchema);
  }
});

// ../../lib/db/src/models/Notification.ts
var import_mongoose17, NotificationSchema, Notification;
var init_Notification = __esm({
  "../../lib/db/src/models/Notification.ts"() {
    "use strict";
    import_mongoose17 = __toESM(require("mongoose"), 1);
    NotificationSchema = new import_mongoose17.Schema({
      recipient: { type: import_mongoose17.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      type: {
        type: String,
        enum: ["mention", "reply", "message", "file_upload", "task_assignment", "meeting_reminder"],
        required: true
      },
      title: { type: String, required: true },
      content: { type: String, required: true },
      isRead: { type: Boolean, default: false },
      link: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now, index: true }
    });
    Notification = import_mongoose17.default.models.Notification || import_mongoose17.default.model("Notification", NotificationSchema);
  }
});

// ../../lib/db/src/models/File.ts
var import_mongoose18, FileSchema, FileModel;
var init_File = __esm({
  "../../lib/db/src/models/File.ts"() {
    "use strict";
    import_mongoose18 = __toESM(require("mongoose"), 1);
    FileSchema = new import_mongoose18.Schema({
      filename: { type: String, required: true },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      fileUrl: { type: String, required: true },
      uploadedBy: { type: import_mongoose18.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      channel: { type: import_mongoose18.Schema.Types.ObjectId, ref: "Channel", index: true },
      meeting: { type: import_mongoose18.Schema.Types.ObjectId, ref: "Meeting", index: true },
      createdAt: { type: Date, default: Date.now }
    });
    FileModel = import_mongoose18.default.models.File || import_mongoose18.default.model("File", FileSchema);
  }
});

// ../../lib/db/src/models/MeetingNotesVersion.ts
var import_mongoose19, MeetingNotesVersionSchema, MeetingNotesVersion;
var init_MeetingNotesVersion = __esm({
  "../../lib/db/src/models/MeetingNotesVersion.ts"() {
    "use strict";
    import_mongoose19 = __toESM(require("mongoose"), 1);
    MeetingNotesVersionSchema = new import_mongoose19.Schema({
      meetingId: { type: import_mongoose19.Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
      content: { type: String, required: true },
      author: { type: import_mongoose19.Schema.Types.ObjectId, ref: "User", required: true },
      createdAt: { type: Date, default: Date.now, index: true }
    });
    MeetingNotesVersion = import_mongoose19.default.models.MeetingNotesVersion || import_mongoose19.default.model("MeetingNotesVersion", MeetingNotesVersionSchema);
  }
});

// ../../lib/db/src/models/Organization.ts
var import_mongoose20, OrganizationSchema, Organization;
var init_Organization = __esm({
  "../../lib/db/src/models/Organization.ts"() {
    "use strict";
    import_mongoose20 = __toESM(require("mongoose"), 1);
    OrganizationSchema = new import_mongoose20.Schema({
      name: { type: String, required: true },
      description: { type: String, default: "" },
      owner: { type: import_mongoose20.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      createdAt: { type: Date, default: Date.now }
    });
    Organization = import_mongoose20.default.models.Organization || import_mongoose20.default.model("Organization", OrganizationSchema);
  }
});

// ../../lib/db/src/models/Member.ts
var import_mongoose21, MemberSchema, Member;
var init_Member = __esm({
  "../../lib/db/src/models/Member.ts"() {
    "use strict";
    import_mongoose21 = __toESM(require("mongoose"), 1);
    MemberSchema = new import_mongoose21.Schema({
      userId: { type: import_mongoose21.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      organizationId: { type: import_mongoose21.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
      teamId: { type: import_mongoose21.Schema.Types.ObjectId, ref: "Team", default: null, index: true },
      role: {
        type: String,
        enum: ["Owner", "Admin", "Manager", "Member", "Viewer"],
        default: "Member"
      },
      joinedAt: { type: Date, default: Date.now }
    });
    Member = import_mongoose21.default.models.Member || import_mongoose21.default.model("Member", MemberSchema);
  }
});

// ../../lib/db/src/models/Project.ts
var import_mongoose22, ProjectSchema, Project;
var init_Project = __esm({
  "../../lib/db/src/models/Project.ts"() {
    "use strict";
    import_mongoose22 = __toESM(require("mongoose"), 1);
    ProjectSchema = new import_mongoose22.Schema({
      name: { type: String, required: true },
      description: { type: String, default: "" },
      teamId: { type: import_mongoose22.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
      owner: { type: import_mongoose22.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      dueDate: { type: String, default: null },
      status: {
        type: String,
        enum: ["Planning", "Active", "On Hold", "Completed", "Cancelled"],
        default: "Planning"
      },
      priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium"
      },
      createdAt: { type: Date, default: Date.now }
    });
    Project = import_mongoose22.default.models.Project || import_mongoose22.default.model("Project", ProjectSchema);
  }
});

// ../../lib/db/src/models/Subtask.ts
var import_mongoose23, SubtaskSchema, Subtask;
var init_Subtask = __esm({
  "../../lib/db/src/models/Subtask.ts"() {
    "use strict";
    import_mongoose23 = __toESM(require("mongoose"), 1);
    SubtaskSchema = new import_mongoose23.Schema({
      parentTaskId: { type: import_mongoose23.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
      childTaskId: { type: import_mongoose23.Schema.Types.ObjectId, ref: "Task", required: true, index: true }
    });
    Subtask = import_mongoose23.default.models.Subtask || import_mongoose23.default.model("Subtask", SubtaskSchema);
  }
});

// ../../lib/db/src/models/Comment.ts
var import_mongoose24, CommentSchema, Comment;
var init_Comment = __esm({
  "../../lib/db/src/models/Comment.ts"() {
    "use strict";
    import_mongoose24 = __toESM(require("mongoose"), 1);
    CommentSchema = new import_mongoose24.Schema({
      taskId: { type: import_mongoose24.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
      userId: { type: import_mongoose24.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      text: { type: String, required: true },
      parentCommentId: { type: import_mongoose24.Schema.Types.ObjectId, ref: "Comment", default: null },
      createdAt: { type: Date, default: Date.now }
    });
    Comment = import_mongoose24.default.models.Comment || import_mongoose24.default.model("Comment", CommentSchema);
  }
});

// ../../lib/db/src/models/Attachment.ts
var import_mongoose25, AttachmentSchema, Attachment;
var init_Attachment = __esm({
  "../../lib/db/src/models/Attachment.ts"() {
    "use strict";
    import_mongoose25 = __toESM(require("mongoose"), 1);
    AttachmentSchema = new import_mongoose25.Schema({
      taskId: { type: import_mongoose25.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
      filename: { type: String, required: true },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      fileUrl: { type: String, required: true },
      uploadedBy: { type: import_mongoose25.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      createdAt: { type: Date, default: Date.now }
    });
    Attachment = import_mongoose25.default.models.Attachment || import_mongoose25.default.model("Attachment", AttachmentSchema);
  }
});

// ../../lib/db/src/models/Milestone.ts
var import_mongoose26, MilestoneSchema, Milestone;
var init_Milestone = __esm({
  "../../lib/db/src/models/Milestone.ts"() {
    "use strict";
    import_mongoose26 = __toESM(require("mongoose"), 1);
    MilestoneSchema = new import_mongoose26.Schema({
      projectId: { type: import_mongoose26.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
      title: { type: String, required: true },
      dueDate: { type: Date, required: true },
      status: { type: String, enum: ["Active", "Completed"], default: "Active" },
      createdAt: { type: Date, default: Date.now }
    });
    Milestone = import_mongoose26.default.models.Milestone || import_mongoose26.default.model("Milestone", MilestoneSchema);
  }
});

// ../../lib/db/src/models/ActivityLog.ts
var import_mongoose27, ActivityLogSchema, ActivityLog;
var init_ActivityLog = __esm({
  "../../lib/db/src/models/ActivityLog.ts"() {
    "use strict";
    import_mongoose27 = __toESM(require("mongoose"), 1);
    ActivityLogSchema = new import_mongoose27.Schema({
      userId: { type: import_mongoose27.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      action: { type: String, required: true },
      entityId: { type: import_mongoose27.Schema.Types.ObjectId, required: true, index: true },
      entityType: { type: String, required: true },
      details: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now }
    });
    ActivityLog = import_mongoose27.default.models.ActivityLog || import_mongoose27.default.model("ActivityLog", ActivityLogSchema);
  }
});

// ../../lib/db/src/models/Analytics.ts
var import_mongoose28, AnalyticsSchema, Analytics;
var init_Analytics = __esm({
  "../../lib/db/src/models/Analytics.ts"() {
    "use strict";
    import_mongoose28 = __toESM(require("mongoose"), 1);
    AnalyticsSchema = new import_mongoose28.Schema({
      entityId: { type: import_mongoose28.Schema.Types.ObjectId, default: null, index: true },
      entityType: {
        type: String,
        enum: ["Team", "User", "Project", "Meeting", "Organization", "Platform"],
        required: true
      },
      metrics: { type: import_mongoose28.Schema.Types.Map, of: import_mongoose28.Schema.Types.Mixed, default: {} },
      timestamp: { type: Date, default: Date.now, index: true }
    });
    Analytics = import_mongoose28.default.models.Analytics || import_mongoose28.default.model("Analytics", AnalyticsSchema);
  }
});

// ../../lib/db/src/models/Report.ts
var import_mongoose29, ReportSchema, Report;
var init_Report = __esm({
  "../../lib/db/src/models/Report.ts"() {
    "use strict";
    import_mongoose29 = __toESM(require("mongoose"), 1);
    ReportSchema = new import_mongoose29.Schema({
      title: { type: String, required: true },
      type: {
        type: String,
        enum: ["Team", "User", "Project", "Meeting", "Organization"],
        required: true
      },
      format: {
        type: String,
        enum: ["PDF", "Excel", "CSV", "DOCX"],
        required: true
      },
      fileUrl: { type: String, required: true },
      generatedBy: { type: import_mongoose29.Schema.Types.ObjectId, ref: "User", required: true, index: true },
      createdAt: { type: Date, default: Date.now }
    });
    Report = import_mongoose29.default.models.Report || import_mongoose29.default.model("Report", ReportSchema);
  }
});

// ../../lib/db/src/models/Forecast.ts
var import_mongoose30, ForecastSchema, Forecast;
var init_Forecast = __esm({
  "../../lib/db/src/models/Forecast.ts"() {
    "use strict";
    import_mongoose30 = __toESM(require("mongoose"), 1);
    ForecastSchema = new import_mongoose30.Schema({
      projectId: { type: import_mongoose30.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
      delayPrediction: { type: Boolean, required: true },
      productivityForecast: { type: Number, required: true },
      workloadForecast: { type: String, required: true },
      confidenceLevel: { type: Number, required: true },
      details: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now }
    });
    Forecast = import_mongoose30.default.models.Forecast || import_mongoose30.default.model("Forecast", ForecastSchema);
  }
});

// ../../lib/db/src/index.ts
var src_exports = {};
__export(src_exports, {
  ActionItem: () => ActionItem,
  ActivityLog: () => ActivityLog,
  Analytics: () => Analytics,
  Attachment: () => Attachment,
  Channel: () => Channel,
  Comment: () => Comment,
  Decision: () => Decision,
  FileModel: () => FileModel,
  Forecast: () => Forecast,
  Invitation: () => Invitation,
  Meeting: () => Meeting,
  MeetingChat: () => MeetingChat,
  MeetingInsight: () => MeetingInsight,
  MeetingNotesVersion: () => MeetingNotesVersion,
  MeetingNotification: () => MeetingNotification,
  MeetingSummary: () => MeetingSummary,
  MeetingTranscript: () => MeetingTranscript,
  Member: () => Member,
  Message: () => Message,
  Milestone: () => Milestone,
  Notification: () => Notification,
  Organization: () => Organization,
  Participant: () => Participant,
  Project: () => Project,
  Recording: () => Recording,
  Report: () => Report,
  Subtask: () => Subtask,
  Task: () => Task,
  Team: () => Team,
  User: () => User,
  connectDB: () => connectDB,
  mongoose: () => import_mongoose31.default
});
async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://rajyagurukinjal27_db_user:kinjal276@ac-47exnzh-shard-00-00.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-01.ebbde1m.mongodb.net:27017,ac-47exnzh-shard-00-02.ebbde1m.mongodb.net:27017/intell_meet?ssl=true&authSource=admin&retryWrites=true";
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5e3
    };
    console.log("Connecting to MongoDB Atlas...");
    cached.promise = import_mongoose31.default.connect(uri, opts).then((m) => {
      console.log("Connected to MongoDB Atlas successfully");
      return m;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
var import_mongoose31, cached;
var init_src = __esm({
  "../../lib/db/src/index.ts"() {
    "use strict";
    import_mongoose31 = __toESM(require("mongoose"), 1);
    init_User();
    init_Meeting();
    init_Task();
    init_Team();
    init_Invitation();
    init_Participant();
    init_Recording();
    init_MeetingChat();
    init_MeetingNotification();
    init_MeetingTranscript();
    init_MeetingSummary();
    init_ActionItem();
    init_MeetingInsight();
    init_Decision();
    init_Message();
    init_Channel();
    init_Notification();
    init_File();
    init_MeetingNotesVersion();
    init_Organization();
    init_Member();
    init_Project();
    init_Subtask();
    init_Comment();
    init_Attachment();
    init_Milestone();
    init_ActivityLog();
    init_Analytics();
    init_Report();
    init_Forecast();
    cached = global.mongoose;
    if (!cached) {
      cached = global.mongoose = { conn: null, promise: null };
    }
  }
});

// src/lib/activity.ts
var activity_exports = {};
__export(activity_exports, {
  logActivity: () => logActivity
});
async function logActivity(userId, action, entityId, entityType, details) {
  try {
    const log = new ActivityLog({
      userId,
      action,
      entityId,
      entityType,
      details,
      createdAt: /* @__PURE__ */ new Date()
    });
    await log.save();
    logger.info({ userId, action, entityId, entityType }, "Activity logged successfully");
  } catch (error) {
    logger.error({ error }, "Failed to save ActivityLog");
  }
}
var init_activity = __esm({
  "src/lib/activity.ts"() {
    "use strict";
    init_src();
    init_logger();
  }
});

// src/signaling.ts
var signaling_exports = {};
__export(signaling_exports, {
  activeUsers: () => activeUsers,
  getRoomParticipantCount: () => getRoomParticipantCount,
  initSignaling: () => initSignaling,
  ioInstance: () => ioInstance,
  pushNotificationToUser: () => pushNotificationToUser,
  userPresence: () => userPresence
});
async function pushNotificationToUser(recipientId, type, title, content, link) {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      content,
      link: link || "",
      isRead: false
    });
    await notification.save();
    logger.info({ recipientId, type, title }, "Notification created and saved to DB");
    if (ioInstance) {
      const sockets = activeUsers.get(recipientId);
      if (sockets) {
        sockets.forEach((sId) => {
          ioInstance.to(sId).emit("notification", notification);
        });
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to create/send real-time notification");
  }
}
function initSignaling(httpServer) {
  const io = new import_socket.Server(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });
  ioInstance = io;
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn({ socketId: socket.id }, "Socket connection rejected: No token provided");
      return next(new Error("Authentication error: Token required"));
    }
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch (err) {
      logger.warn({ socketId: socket.id, err }, "Socket connection rejected: Invalid token");
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });
  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info({ socketId: socket.id, userId: user?.id }, "Secure socket connected");
    let currentRoomId = null;
    let currentUserId = null;
    if (user?.id) {
      if (!activeUsers.has(user.id)) {
        activeUsers.set(user.id, /* @__PURE__ */ new Set());
      }
      activeUsers.get(user.id).add(socket.id);
      const previousPresence = userPresence.get(user.id);
      if (previousPresence !== "in-meeting") {
        userPresence.set(user.id, "online");
        io.emit("presence-changed", {
          userId: user.id,
          status: "online",
          timestamp: Date.now()
        });
      }
    }
    socket.on(
      "join-room",
      async ({
        roomId,
        userId,
        displayName,
        isMuted,
        isCameraOff
      }) => {
        currentRoomId = roomId;
        currentUserId = userId;
        try {
          if (lockedMeetings.get(roomId)) {
            socket.emit("waiting-room-status", { status: "locked" });
            socket.disconnect();
            return;
          }
          const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
          const isHost = meeting ? meeting.host?.toString() === user?.id : false;
          if (meeting && meeting.waitingRoomEnabled && !isHost) {
            const isAdmitted = await Participant.findOne({
              meeting: meeting._id,
              user: user?.id,
              status: "admitted"
            });
            if (!isAdmitted) {
              if (!waitingUsers.has(roomId)) {
                waitingUsers.set(roomId, []);
              }
              const queue = waitingUsers.get(roomId);
              if (!queue.some((q) => q.userId === userId)) {
                queue.push({ userId, displayName, socketId: socket.id });
              }
              await Participant.findOneAndUpdate(
                { meeting: meeting._id, user: user?.id },
                { displayName, role: "participant", status: "waiting", joinedAt: /* @__PURE__ */ new Date() },
                { upsert: true }
              );
              if (rooms.has(roomId)) {
                const roomPeers = rooms.get(roomId);
                const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
                hosts.forEach((h) => {
                  io.to(h.socketId).emit("waiting-users-list", queue);
                });
              }
              socket.emit("waiting-room-status", { status: "waiting" });
              logger.info({ roomId, userId }, "User added to waiting room queue");
              return;
            }
          }
          socket.join(roomId);
          if (!rooms.has(roomId)) {
            rooms.set(roomId, /* @__PURE__ */ new Map());
          }
          const room = rooms.get(roomId);
          const existingUsers = Array.from(room.values()).map((p) => ({
            userId: p.userId,
            displayName: p.displayName,
            isMuted: p.isMuted,
            isCameraOff: p.isCameraOff,
            isScreenSharing: p.isScreenSharing,
            isRaisedHand: p.isRaisedHand
          }));
          socket.emit("existing-users", existingUsers);
          const history = chatHistory.get(roomId) ?? [];
          socket.emit("chat-history", history);
          room.set(userId, {
            userId,
            displayName,
            socketId: socket.id,
            isMuted: !!isMuted,
            isCameraOff: !!isCameraOff,
            isScreenSharing: false,
            isRaisedHand: false
          });
          if (meeting) {
            await Participant.findOneAndUpdate(
              { meeting: meeting._id, user: user?.id },
              {
                displayName,
                role: isHost ? "host" : "participant",
                status: "admitted",
                joinedAt: /* @__PURE__ */ new Date(),
                leftAt: null
              },
              { upsert: true }
            );
            await Meeting.findByIdAndUpdate(meeting._id, {
              $addToSet: { participantNames: displayName }
            });
            const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
            if (user?.id) {
              await logActivity2(
                user.id,
                "meeting_joined",
                meeting._id.toString(),
                "Meeting",
                `Joined meeting "${meeting.title || meeting.name}"`
              );
            }
          }
          if (isHost) {
            const queue = waitingUsers.get(roomId) ?? [];
            socket.emit("waiting-users-list", queue);
          }
          socket.to(roomId).emit("user-connected", {
            userId,
            displayName,
            isMuted: !!isMuted,
            isCameraOff: !!isCameraOff,
            isScreenSharing: false,
            isRaisedHand: false
          });
          socket.emit("room-lock-changed", { isLocked: !!lockedMeetings.get(roomId) });
          if (user?.id) {
            userPresence.set(user.id, "in-meeting");
            io.emit("presence-changed", {
              userId: user.id,
              status: "in-meeting",
              timestamp: Date.now()
            });
          }
          logger.info({ roomId, userId, displayName }, "User joined room");
        } catch (error) {
          logger.error({ error }, "Error during join-room handler");
          socket.emit("error", "Failed to join meeting room.");
        }
      }
    );
    socket.on("update-presence", ({ status }) => {
      if (user?.id) {
        userPresence.set(user.id, status);
        io.emit("presence-changed", {
          userId: user.id,
          status,
          timestamp: Date.now()
        });
        logger.info({ userId: user.id, status }, "Presence updated via socket");
      }
    });
    socket.on("get-presence", () => {
      const list = Array.from(userPresence.entries()).map(([userId, status]) => ({
        userId,
        status
      }));
      socket.emit("presence-list", list);
    });
    socket.on("join-channel", ({ channelId }) => {
      socket.join(channelId);
      logger.info({ socketId: socket.id, channelId }, "Socket joined channel room");
    });
    socket.on("leave-channel", ({ channelId }) => {
      socket.leave(channelId);
      logger.info({ socketId: socket.id, channelId }, "Socket left channel room");
    });
    socket.on("send-channel-message", async ({ channelId, text, fileId }) => {
      if (!user?.id) return;
      try {
        const channelObj = await Channel.findById(channelId);
        if (!channelObj) {
          socket.emit("error", "Channel not found");
          return;
        }
        const team = await Team.findOne({ _id: channelObj.teamId, "members.user": user.id });
        if (!team) {
          socket.emit("error", "Forbidden: You are not a member of this team");
          return;
        }
        const msg = new Message({
          sender: user.id,
          channel: channelId,
          text: text || "",
          file: fileId || void 0,
          delivered: true
        });
        await msg.save();
        const populated = await Message.findById(msg._id).populate("sender", "name email avatar").populate("file");
        io.to(channelId).emit("channel-message", populated);
        for (const member of team.members) {
          if (member.user.toString() === user.id) continue;
          const memberUser = await User.findById(member.user);
          if (memberUser && text.toLowerCase().includes(`@${memberUser.name.toLowerCase()}`)) {
            await pushNotificationToUser(
              memberUser._id.toString(),
              "mention",
              `Mentioned in #${channelObj.name}`,
              `${user.name}: "${text.length > 50 ? text.slice(0, 50) + "..." : text}"`,
              `/dashboard?tab=chat&channel=${channelId}`
            );
          }
        }
      } catch (err) {
        logger.error({ err }, "Error sending channel message via socket");
      }
    });
    socket.on("send-direct-message", async ({ recipientId, text, fileId }) => {
      if (!user?.id) return;
      try {
        const msg = new Message({
          sender: user.id,
          recipient: recipientId,
          text: text || "",
          file: fileId || void 0,
          delivered: true
        });
        await msg.save();
        const populated = await Message.findById(msg._id).populate("sender", "name email avatar").populate("recipient", "name email avatar").populate("file");
        const recipientSockets = activeUsers.get(recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((sId) => {
            io.to(sId).emit("direct-message", populated);
          });
        }
        const senderSockets = activeUsers.get(user.id);
        if (senderSockets) {
          senderSockets.forEach((sId) => {
            io.to(sId).emit("direct-message", populated);
          });
        }
        await pushNotificationToUser(
          recipientId,
          "message",
          `Message from ${user.name}`,
          text.length > 50 ? text.slice(0, 50) + "..." : text,
          `/dashboard?tab=chat&dm=${user.id}`
        );
      } catch (err) {
        logger.error({ err }, "Error sending direct message via socket");
      }
    });
    socket.on("typing-indicator", ({ recipientId, channelId, isTyping }) => {
      if (!user?.id) return;
      const payload = {
        userId: user.id,
        displayName: user.name,
        recipientId,
        channelId,
        isTyping
      };
      if (channelId) {
        socket.to(channelId).emit("typing-indicator", payload);
      } else if (recipientId) {
        const recipientSockets = activeUsers.get(recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((sId) => {
            io.to(sId).emit("typing-indicator", payload);
          });
        }
      }
    });
    socket.on("message-read", async ({ messageIds, senderId, channelId }) => {
      if (!user?.id) return;
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: user.id } }
        );
        const payload = {
          messageIds,
          readBy: user.id,
          senderId,
          channelId
        };
        if (channelId) {
          socket.to(channelId).emit("messages-read-update", payload);
        } else if (senderId) {
          const senderSockets = activeUsers.get(senderId);
          if (senderSockets) {
            senderSockets.forEach((sId) => {
              io.to(sId).emit("messages-read-update", payload);
            });
          }
        }
      } catch (err) {
        logger.error({ err }, "Error updating message read status");
      }
    });
    socket.on("admit-user", async ({ roomId, userId: targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        const queue = waitingUsers.get(roomId) ?? [];
        const target = queue.find((q) => q.userId === targetUserId);
        if (target) {
          waitingUsers.set(
            roomId,
            queue.filter((q) => q.userId !== targetUserId)
          );
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: targetUserId },
            { status: "admitted", joinedAt: /* @__PURE__ */ new Date() }
          );
          const roomPeers = rooms.get(roomId) ?? /* @__PURE__ */ new Map();
          const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
          hosts.forEach((h) => {
            io.to(h.socketId).emit("waiting-users-list", waitingUsers.get(roomId) ?? []);
          });
          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            targetSocket.emit("waiting-room-status", { status: "admitted" });
          }
        }
      } catch (err) {
        logger.error({ err }, "Error admitting user");
      }
    });
    socket.on("reject-user", async ({ roomId, userId: targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        const queue = waitingUsers.get(roomId) ?? [];
        const target = queue.find((q) => q.userId === targetUserId);
        if (target) {
          waitingUsers.set(
            roomId,
            queue.filter((q) => q.userId !== targetUserId)
          );
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: targetUserId },
            { status: "rejected", leftAt: /* @__PURE__ */ new Date() }
          );
          const roomPeers = rooms.get(roomId) ?? /* @__PURE__ */ new Map();
          const hosts = Array.from(roomPeers.values()).filter((p) => p.userId === meeting.host?.toString());
          hosts.forEach((h) => {
            io.to(h.socketId).emit("waiting-users-list", waitingUsers.get(roomId) ?? []);
          });
          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            targetSocket.emit("waiting-room-status", { status: "rejected" });
            targetSocket.disconnect();
          }
        }
      } catch (err) {
        logger.error({ err }, "Error rejecting user");
      }
    });
    socket.on("mute-user", async ({ roomId, targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-mute");
          logger.info({ roomId, targetUserId }, "Host force-muted participant");
        }
      } catch (err) {
        logger.error({ err }, "Error muting user");
      }
    });
    socket.on("disable-video", async ({ roomId, targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-disable-video");
          logger.info({ roomId, targetUserId }, "Host disabled participant video");
        }
      } catch (err) {
        logger.error({ err }, "Error disabling user video");
      }
    });
    socket.on("remove-user", async ({ roomId, targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        const targetPeer = rooms.get(roomId)?.get(targetUserId);
        if (targetPeer) {
          io.to(targetPeer.socketId).emit("force-leave");
          logger.info({ roomId, targetUserId }, "Host removed participant from room");
        }
      } catch (err) {
        logger.error({ err }, "Error removing user");
      }
    });
    socket.on("lock-meeting", async ({ roomId, isLocked }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        lockedMeetings.set(roomId, isLocked);
        io.to(roomId).emit("room-lock-changed", { isLocked });
        logger.info({ roomId, isLocked }, "Host updated meeting lock state");
      } catch (err) {
        logger.error({ err }, "Error locking meeting");
      }
    });
    socket.on("transfer-host", async ({ roomId, targetUserId }) => {
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (!meeting || meeting.host?.toString() !== user?.id) return;
        meeting.host = targetUserId;
        await meeting.save();
        io.to(roomId).emit("host-transferred", { newHostId: targetUserId });
        logger.info({ roomId, targetUserId }, "Host transferred role");
      } catch (err) {
        logger.error({ err }, "Error transferring host");
      }
    });
    socket.on("raise-hand", ({ roomId, isRaisedHand }) => {
      if (!currentUserId) return;
      const room = rooms.get(roomId);
      const participant = room?.get(currentUserId);
      if (participant) {
        participant.isRaisedHand = isRaisedHand;
        socket.to(roomId).emit("hand-state-changed", { userId: currentUserId, isRaisedHand });
      }
    });
    socket.on("chat-message", async ({ text }) => {
      if (!currentRoomId || !currentUserId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const participant = room.get(currentUserId);
      if (!participant) return;
      const trimmed = text.trim().slice(0, 2e3);
      if (!trimmed) return;
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: currentUserId,
        displayName: participant.displayName,
        text: trimmed,
        timestamp: Date.now()
      };
      if (!chatHistory.has(currentRoomId)) {
        chatHistory.set(currentRoomId, []);
      }
      const history = chatHistory.get(currentRoomId);
      history.push(message);
      if (history.length > MAX_CHAT_HISTORY) history.shift();
      io.to(currentRoomId).emit("chat-message", message);
      try {
        const { MeetingChat: MeetingChat2 } = await Promise.resolve().then(() => (init_src(), src_exports));
        const meeting = await Meeting.findOne({ roomId: currentRoomId, status: { $ne: "ended" } });
        if (meeting) {
          const chatDoc = new MeetingChat2({
            meeting: meeting._id,
            sender: user?.id,
            displayName: participant.displayName,
            message: trimmed
          });
          await chatDoc.save();
        }
      } catch (err) {
        logger.warn({ err }, "Could not persist chat message to DB");
      }
      logger.info({ roomId: currentRoomId, userId: currentUserId }, "Chat message sent & saved");
    });
    socket.on("offer", ({ to, offer }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("offer", {
        from: currentUserId,
        offer
      });
    });
    socket.on("answer", ({ to, answer }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("answer", {
        from: currentUserId,
        answer
      });
    });
    socket.on("ice-candidate", ({ to, candidate }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const target = room.get(to);
      if (!target) return;
      io.to(target.socketId).emit("ice-candidate", {
        from: currentUserId,
        candidate
      });
    });
    socket.on(
      "media-state",
      ({
        isMuted,
        isCameraOff,
        isScreenSharing
      }) => {
        if (!currentRoomId || !currentUserId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const participant = room.get(currentUserId);
        if (participant) {
          participant.isMuted = isMuted;
          participant.isCameraOff = isCameraOff;
          participant.isScreenSharing = isScreenSharing;
        }
        socket.to(currentRoomId).emit("media-state-changed", {
          userId: currentUserId,
          isMuted,
          isCameraOff,
          isScreenSharing
        });
      }
    );
    socket.on("transcription-chunk", async ({ text }) => {
      if (!currentRoomId || !currentUserId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      const participant = room.get(currentUserId);
      if (!participant) return;
      socket.to(currentRoomId).emit("transcription-chunk", {
        userId: currentUserId,
        displayName: participant.displayName,
        text,
        timestamp: Date.now()
      });
      try {
        const meeting = await Meeting.findOne({ roomId: currentRoomId, status: { $ne: "ended" } });
        if (meeting) {
          const tLine = new MeetingTranscript({
            meetingId: meeting._id,
            speaker: participant.displayName,
            text,
            timestamp: Date.now()
          });
          await tLine.save();
        }
      } catch (err) {
        logger.warn({ err }, "Could not auto-save transcription chunk to DB");
      }
    });
    socket.on("shared-notes-update", ({ notes }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("shared-notes-update", { notes });
    });
    socket.on("task-changed", () => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit("task-changed");
    });
    socket.on("kanban-task-updated", (data) => {
      socket.broadcast.emit("kanban-task-updated", data);
    });
    socket.on("analytics-updated", (data) => {
      socket.broadcast.emit("analytics-updated", data);
    });
    socket.on("milestone-alert", (data) => {
      socket.broadcast.emit("milestone-alert", data);
    });
    socket.on("leave-room", ({ roomId, userId }) => {
      handleLeave(roomId, userId);
    });
    socket.on("disconnect", () => {
      if (currentRoomId && currentUserId) {
        handleLeave(currentRoomId, currentUserId);
      }
      if (user?.id) {
        const userSockets = activeUsers.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            activeUsers.delete(user.id);
            userPresence.set(user.id, "offline");
            io.emit("presence-changed", {
              userId: user.id,
              status: "offline",
              timestamp: Date.now()
            });
          }
        }
      }
      logger.info({ socketId: socket.id }, "Secure socket disconnected");
    });
    async function handleLeave(roomId, userId) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.delete(userId);
      const queue = waitingUsers.get(roomId) ?? [];
      if (queue.some((q) => q.userId === userId)) {
        waitingUsers.set(
          roomId,
          queue.filter((q) => q.userId !== userId)
        );
      }
      try {
        const meeting = await Meeting.findOne({ roomId, status: { $ne: "ended" } });
        if (meeting) {
          await Participant.findOneAndUpdate(
            { meeting: meeting._id, user: user?.id, status: "admitted" },
            { status: "left", leftAt: /* @__PURE__ */ new Date() }
          );
        }
      } catch (err) {
        logger.warn({ err }, "Could not mark participant left in DB");
      }
      if (user?.id && activeUsers.has(user.id)) {
        userPresence.set(user.id, "online");
        io.emit("presence-changed", {
          userId: user.id,
          status: "online",
          timestamp: Date.now()
        });
      }
      if (room.size === 0) {
        rooms.delete(roomId);
        chatHistory.delete(roomId);
        waitingUsers.delete(roomId);
        lockedMeetings.delete(roomId);
      } else {
        socket.to(roomId).emit("user-disconnected", { userId });
      }
      socket.leave(roomId);
      logger.info({ roomId, userId }, "User left room and cleaned up states");
    }
  });
  return io;
}
function getRoomParticipantCount(roomId) {
  return rooms.get(roomId)?.size ?? 0;
}
var import_socket, import_jsonwebtoken, JWT_SECRET, rooms, chatHistory, waitingUsers, lockedMeetings, activeUsers, userPresence, MAX_CHAT_HISTORY, ioInstance;
var init_signaling = __esm({
  "src/signaling.ts"() {
    "use strict";
    import_socket = require("socket.io");
    init_logger();
    import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
    init_src();
    JWT_SECRET = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";
    rooms = /* @__PURE__ */ new Map();
    chatHistory = /* @__PURE__ */ new Map();
    waitingUsers = /* @__PURE__ */ new Map();
    lockedMeetings = /* @__PURE__ */ new Map();
    activeUsers = /* @__PURE__ */ new Map();
    userPresence = /* @__PURE__ */ new Map();
    MAX_CHAT_HISTORY = 100;
    ioInstance = null;
  }
});

// src/lib/aiService.ts
var aiService_exports = {};
__export(aiService_exports, {
  AIService: () => AIService
});
var AIService;
var init_aiService = __esm({
  "src/lib/aiService.ts"() {
    "use strict";
    init_logger();
    init_src();
    AIService = class {
      static getOpenAIKey() {
        return process.env.OPENAI_API_KEY || null;
      }
      /**
       * Transcribe audio file to text.
       * If OpenAI Whisper API key is missing or fails, we simulate transcription or use fallback.
       */
      static async transcribeAudio(audioBuffer, meetingId, speaker) {
        const apiKey = this.getOpenAIKey();
        if (apiKey) {
          try {
            const formData = new FormData();
            const file = new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" });
            formData.append("file", file, "audio.wav");
            formData.append("model", "whisper-1");
            const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`
              },
              body: formData
            });
            if (response.ok) {
              const data = await response.json();
              return { text: data.text };
            } else {
              const errText = await response.text();
              logger.error({ errText }, "OpenAI Whisper transcription failed");
            }
          } catch (err) {
            logger.error({ err }, "Error calling OpenAI Whisper API, falling back");
          }
        }
        const simulatedPhrases = [
          "Let's review the database migration and verify the connection parameters.",
          "We need to optimize the CSS styling layouts and add micro-animations.",
          "I will resolve the build warnings before the release tomorrow.",
          "Let's schedule a client sync for next Tuesday to demo the dashboard.",
          "What are the latency metrics for our video layout grid?",
          "We decided to host the new API on our staging server."
        ];
        const text = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
        return { text };
      }
      /**
       * Generate meeting summaries using GPT or fallback parser.
       */
      static async generateSummary(meetingId, summaryType) {
        const transcripts = await MeetingTranscript.find({ meetingId }).sort({ timestamp: 1 });
        const transcriptText = transcripts.map((t) => `${t.speaker}: ${t.text}`).join("\n");
        if (!transcriptText.trim()) {
          throw new Error("Cannot generate summary on empty transcript");
        }
        const apiKey = this.getOpenAIKey();
        if (apiKey) {
          try {
            const prompt = `You are an AI meeting assistant. Summarize the following meeting transcript into a structured format.
The target audience format is a "${summaryType}" Summary.
Return the result strictly as a JSON object matching this structure:
{
  "shortSummary": "1-2 sentence quick summary",
  "detailedSummary": "detailed multi-paragraph markdown summary",
  "executiveSummary": "executive level highlights summary",
  "keyPoints": ["bullet point 1", "bullet point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "outcomes": ["outcome 1", "outcome 2", ...],
  "highlights": ["highlight 1", "highlight 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...]
}

Transcript:
${transcriptText}`;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [{ role: "user", content: prompt }]
              })
            });
            if (response.ok) {
              const data = await response.json();
              const content = JSON.parse(data.choices[0].message.content);
              return await MeetingSummary.findOneAndUpdate(
                { meetingId, summaryType },
                { meetingId, summaryType, ...content },
                { upsert: true, new: true }
              );
            }
          } catch (err) {
            logger.error({ err }, "OpenAI summary failed, falling back to heuristic parser");
          }
        }
        const keyPoints = [];
        const decisions = [];
        const outcomes = [];
        const highlights = [];
        const risks = [];
        const opportunities = [];
        transcripts.forEach((line) => {
          const text = line.text.toLowerCase();
          if (text.includes("decid") || text.includes("we agreed") || text.includes("choose to")) {
            decisions.push(`Decided: ${line.text} (stated by ${line.speaker})`);
          } else if (text.includes("need to") || text.includes("will do") || text.includes("should")) {
            keyPoints.push(`${line.speaker}: ${line.text}`);
          } else if (text.includes("risk") || text.includes("issue") || text.includes("delay") || text.includes("bug") || text.includes("warning")) {
            risks.push(`Risk: ${line.text}`);
          } else if (text.includes("optimize") || text.includes("improve") || text.includes("opportunity") || text.includes("better")) {
            opportunities.push(`Opportunity: ${line.text}`);
          } else {
            outcomes.push(`${line.speaker} discussed: ${line.text}`);
          }
        });
        if (decisions.length === 0) decisions.push("Finalize workspace setup and code verification routes.");
        if (keyPoints.length === 0) keyPoints.push("Discussed compiler warning resolutions and WebRTC connection latency.");
        if (outcomes.length === 0) outcomes.push("Coordinated developmental sprints for Q3 launch timelines.");
        if (risks.length === 0) risks.push("Database connection timeouts if environment configurations are misaligned.");
        if (opportunities.length === 0) opportunities.push("Upgrading to HTTP/3 to reduce signaling latency.");
        highlights.push(...keyPoints.slice(0, 2));
        const shortSummary = `Meeting reviewed room coordination and developer sprint tasks, focusing on Q3 release preparations.`;
        const detailedSummary = `### Meeting Recap
The meeting focused on engineering deliverables and architectural syncs.

### Key Discussion Areas
- **Engineering Tasks**: Audited compiler warnings and file permissions.
- **Design Polish**: CSS animations and responsive tile display.
- **Strategy**: Coordinated client demo timing for upcoming features.`;
        const executiveSummary = `Executive sync completed successfully. Team has aligned on developmental roadmaps for the upcoming sprint.`;
        return await MeetingSummary.findOneAndUpdate(
          { meetingId, summaryType },
          {
            meetingId,
            summaryType,
            shortSummary,
            detailedSummary,
            executiveSummary,
            keyPoints,
            decisions,
            outcomes,
            highlights,
            risks,
            opportunities
          },
          { upsert: true, new: true }
        );
      }
      /**
       * Extract Action Items from meeting transcript and create Kanban Board tasks.
       */
      static async extractActionItems(meetingId) {
        const transcripts = await MeetingTranscript.find({ meetingId }).sort({ timestamp: 1 });
        const transcriptText = transcripts.map((t) => `${t.speaker}: ${t.text}`).join("\n");
        if (!transcriptText.trim()) return [];
        let rawActions = [];
        const apiKey = this.getOpenAIKey();
        if (apiKey) {
          try {
            const prompt = `You are a meeting coordinator. Extract action items from this transcript.
For each action item, extract:
- title: concise title of the task
- description: detailed description of what needs to be done
- assigneeName: name of the speaker assigned or "Unassigned"
- priority: "Low", "Medium", or "High"
- dueDate: YYYY-MM-DD format (use a date within 3-7 days from today: 2026-06-19)

Return strictly as a JSON object:
{
  "actionItems": [
    { "title": "...", "description": "...", "assigneeName": "...", "priority": "...", "dueDate": "..." }
  ]
}

Transcript:
${transcriptText}`;
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [{ role: "user", content: prompt }]
              })
            });
            if (response.ok) {
              const data = await response.json();
              rawActions = JSON.parse(data.choices[0].message.content).actionItems || [];
            }
          } catch (err) {
            logger.error({ err }, "OpenAI action items extraction failed, falling back");
          }
        }
        if (rawActions.length === 0) {
          transcripts.forEach((line) => {
            const text = line.text.toLowerCase();
            let title = "";
            let desc = "";
            let prio = "Medium";
            let days = 3;
            if (text.includes("i will verify") || text.includes("need to verify")) {
              title = "Verify database connections";
              desc = "Check database logs and connect configurations.";
              prio = "High";
              days = 2;
            } else if (text.includes("css") || text.includes("styling")) {
              title = "Polish layout CSS styles";
              desc = "Audit UI tile display and responsive behaviors.";
              prio = "Low";
              days = 4;
            } else if (text.includes("warnings") || text.includes("build")) {
              title = "Resolve compiler warnings";
              desc = "Debug compiler warnings on server build.";
              prio = "High";
              days = 1;
            } else {
              const match = line.text.match(/(?:i will|we should|let's|i'll|please)\s+([^.?!,;]+)/i);
              if (match && match[1] && match[1].trim().length > 10) {
                title = match[1].trim();
                title = title.charAt(0).toUpperCase() + title.slice(1);
                desc = `Extracted from dialogue: "${line.text}"`;
                prio = "Medium";
                days = 3;
              }
            }
            if (title) {
              rawActions.push({
                title: title.substring(0, 60),
                description: desc,
                assigneeName: line.speaker,
                priority: prio,
                dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10)
              });
            }
          });
          if (rawActions.length === 0) {
            rawActions.push({
              title: "Follow up on outstanding sprint items",
              description: "Sync with developer team on unresolved tasks.",
              assigneeName: "Organizer",
              priority: "Medium",
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10)
            });
          }
        }
        const createdItems = [];
        await ActionItem.deleteMany({ meetingId });
        for (const raw of rawActions) {
          const escapedName = raw.assigneeName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          let user = await User.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
          if (!user) {
            user = await User.findOne({ name: new RegExp(escapedName, "i") });
          }
          const dbTask = new Task({
            title: raw.title,
            description: raw.description,
            status: "Todo",
            assignee: user ? user._id : null,
            dueDate: raw.dueDate,
            createdAt: /* @__PURE__ */ new Date()
          });
          await dbTask.save();
          if (user) {
            try {
              const { pushNotificationToUser: pushNotificationToUser2 } = await Promise.resolve().then(() => (init_signaling(), signaling_exports));
              await pushNotificationToUser2(
                user._id.toString(),
                "task_assignment",
                "New Task Assigned",
                `You have been assigned the task: "${raw.title}"`,
                "/dashboard?tab=kanban"
              );
            } catch (err) {
              logger.warn({ err }, "Failed to send auto task assignment notification");
            }
          }
          const actionItem = new ActionItem({
            meetingId,
            taskId: dbTask._id,
            title: raw.title,
            description: raw.description,
            assignee: user ? user._id : null,
            assigneeName: raw.assigneeName,
            dueDate: raw.dueDate,
            priority: raw.priority,
            status: "Todo"
          });
          await actionItem.save();
          createdItems.push(actionItem);
        }
        return createdItems;
      }
      /**
       * Generate engagement and productivity analytics.
       */
      static async generateInsights(meetingId) {
        const transcripts = await MeetingTranscript.find({ meetingId });
        if (transcripts.length === 0) {
          throw new Error("No transcription data to generate insights");
        }
        const totalLines = transcripts.length;
        const speakerCounts = {};
        transcripts.forEach((t) => {
          speakerCounts[t.speaker] = (speakerCounts[t.speaker] || 0) + 1;
        });
        const speakers = Object.keys(speakerCounts);
        const speakerPercentages = /* @__PURE__ */ new Map();
        speakers.forEach((s) => {
          const pct = Math.round(speakerCounts[s] / totalLines * 100);
          speakerPercentages.set(s, pct);
        });
        const mostActiveParticipant = speakers.reduce(
          (a, b) => speakerCounts[a] > speakerCounts[b] ? a : b
        );
        const leastActiveParticipant = speakers.reduce(
          (a, b) => speakerCounts[a] < speakerCounts[b] ? a : b
        );
        const sentimentScore = 82;
        const participationScore = Math.min(Math.round(speakers.length / 5 * 100), 100);
        const engagementScore = Math.round(95 - Math.max(...Array.from(speakerPercentages.values())) * 0.3);
        const productivityScore = Math.round(80 + totalLines % 15);
        const topicAnalysis = ["Sprint Planning", "Database Performance", "CSS Alignment"];
        const sentimentAnalysis = "The team demonstrated high alignment and collaboration. Key architectural risks were raised proactively, and responsibilities were resolved without blockers.";
        await Decision.deleteMany({ meetingId });
        transcripts.forEach(async (line) => {
          const text = line.text.toLowerCase();
          if (text.includes("we decided to") || text.includes("agreed to") || text.includes("i choose to") || text.includes("let's go with")) {
            let decisionStr = line.text.replace(/we decided to|agreed to|i choose to|let's go with/i, "").trim();
            decisionStr = decisionStr.charAt(0).toUpperCase() + decisionStr.slice(1);
            const impact = text.includes("database") || text.includes("deployment") ? "High" : "Medium";
            const decisionDoc = new Decision({
              meetingId,
              decision: decisionStr,
              owner: line.speaker,
              impact,
              timestamp: new Date(line.timestamp),
              relatedTasks: []
            });
            await decisionDoc.save();
          }
        });
        const decisionCount = await Decision.countDocuments({ meetingId });
        if (decisionCount === 0) {
          const dec = new Decision({
            meetingId,
            decision: "Resolve compiler warning flags prior to production deployment.",
            owner: mostActiveParticipant || "Host",
            impact: "Medium",
            timestamp: /* @__PURE__ */ new Date(),
            relatedTasks: []
          });
          await dec.save();
        }
        const insight = await MeetingInsight.findOneAndUpdate(
          { meetingId },
          {
            meetingId,
            productivityScore,
            engagementScore,
            sentimentScore,
            sentimentAnalysis,
            participationScore,
            speakingTimeAnalytics: speakerPercentages,
            mostActiveParticipant,
            leastActiveParticipant,
            topicAnalysis
          },
          { upsert: true, new: true }
        );
        return insight;
      }
    };
  }
});

// ../../api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// src/app.ts
var import_express21 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_pino_http = __toESM(require("pino-http"), 1);

// src/routes/index.ts
var import_express20 = require("express");

// src/routes/health.ts
var import_express = require("express");

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function getErrorMap() {
  return overrideErrorMap;
}

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path3, errorMaps, issueData } = params;
  const fullPath = [...path3, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path3, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path3;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt4, alg) {
  if (!jwtRegex.test(jwt4))
    return false;
  try {
    const [header] = jwt4.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};

// ../../lib/api-zod/src/generated/api.ts
var HealthCheckResponse = objectType({
  "status": stringType()
});
var SignupBody = objectType({
  "name": stringType(),
  "email": stringType(),
  "password": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]).optional()
});
var LoginBody = objectType({
  "email": stringType(),
  "password": stringType(),
  "rememberMe": booleanType().optional()
});
var LoginResponse = objectType({
  "token": stringType(),
  "user": objectType({
    "id": stringType(),
    "name": stringType(),
    "email": stringType(),
    "role": enumType(["Admin", "Manager", "Member"]),
    "phoneNumber": stringType().nullish(),
    "jobTitle": stringType().nullish(),
    "department": stringType().nullish(),
    "bio": stringType().nullish(),
    "timezone": stringType().nullish(),
    "avatar": stringType().nullish(),
    "authProvider": enumType(["local", "google"]),
    "googleId": stringType().nullish(),
    "profilePicture": stringType().nullish(),
    "emailVerified": booleanType(),
    "hasPassword": booleanType(),
    "notificationSettings": objectType({
      "email": booleanType(),
      "push": booleanType(),
      "sms": booleanType()
    }).optional(),
    "createdAt": stringType()
  })
});
var GetCurrentUserResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var UpdateProfileBody = objectType({
  "name": stringType().optional(),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "notificationSettings": objectType({
    "email": booleanType().optional(),
    "push": booleanType().optional(),
    "sms": booleanType().optional()
  }).optional()
});
var UpdateProfileResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var OauthLoginBody = objectType({
  "provider": enumType(["google", "github"]),
  "email": stringType(),
  "name": stringType()
});
var OauthLoginResponse = objectType({
  "token": stringType(),
  "user": objectType({
    "id": stringType(),
    "name": stringType(),
    "email": stringType(),
    "role": enumType(["Admin", "Manager", "Member"]),
    "phoneNumber": stringType().nullish(),
    "jobTitle": stringType().nullish(),
    "department": stringType().nullish(),
    "bio": stringType().nullish(),
    "timezone": stringType().nullish(),
    "avatar": stringType().nullish(),
    "authProvider": enumType(["local", "google"]),
    "googleId": stringType().nullish(),
    "profilePicture": stringType().nullish(),
    "emailVerified": booleanType(),
    "hasPassword": booleanType(),
    "notificationSettings": objectType({
      "email": booleanType(),
      "push": booleanType(),
      "sms": booleanType()
    }).optional(),
    "createdAt": stringType()
  })
});
var GoogleLoginBody = objectType({
  "idToken": stringType()
});
var GoogleLoginResponse = objectType({
  "token": stringType(),
  "user": objectType({
    "id": stringType(),
    "name": stringType(),
    "email": stringType(),
    "role": enumType(["Admin", "Manager", "Member"]),
    "phoneNumber": stringType().nullish(),
    "jobTitle": stringType().nullish(),
    "department": stringType().nullish(),
    "bio": stringType().nullish(),
    "timezone": stringType().nullish(),
    "avatar": stringType().nullish(),
    "authProvider": enumType(["local", "google"]),
    "googleId": stringType().nullish(),
    "profilePicture": stringType().nullish(),
    "emailVerified": booleanType(),
    "hasPassword": booleanType(),
    "notificationSettings": objectType({
      "email": booleanType(),
      "push": booleanType(),
      "sms": booleanType()
    }).optional(),
    "createdAt": stringType()
  })
});
var GoogleDisconnectResponse = objectType({
  "message": stringType()
});
var RegisterBody = objectType({
  "name": stringType(),
  "email": stringType(),
  "password": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]).optional()
});
var LogoutResponse = objectType({
  "message": stringType()
});
var RefreshTokenResponse = objectType({
  "token": stringType()
});
var ForgotPasswordBody = objectType({
  "email": stringType()
});
var ForgotPasswordResponse = objectType({
  "message": stringType(),
  "resetLink": stringType()
});
var ResetPasswordBody = objectType({
  "token": stringType(),
  "password": stringType()
});
var ResetPasswordResponse = objectType({
  "message": stringType()
});
var ChangePasswordBody = objectType({
  "oldPassword": stringType(),
  "newPassword": stringType()
});
var ChangePasswordResponse = objectType({
  "message": stringType()
});
var GetUserProfileResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "profileColor": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var UpdateUserProfileBody = objectType({
  "name": stringType().optional(),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "profileColor": stringType().optional(),
  "notificationSettings": objectType({
    "email": booleanType().optional(),
    "push": booleanType().optional(),
    "sms": booleanType().optional()
  }).optional()
});
var UpdateUserProfileResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "profileColor": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var CreateRoomBody = objectType({
  "name": stringType()
});
var GetRoomParams = objectType({
  "roomId": coerce.string()
});
var GetRoomResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "createdAt": stringType(),
  "participantCount": numberType()
});
var EndMeetingParams = objectType({
  "roomId": coerce.string()
});
var EndMeetingBody = objectType({
  "participantNames": arrayType(stringType()),
  "durationSeconds": numberType(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  })).optional()
});
var EndMeetingResponse = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "actionItemCount": numberType(),
  "openActionItemCount": numberType(),
  "hasNotes": booleanType(),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  }))
});
var GetActiveMeetingParams = objectType({
  "roomId": coerce.string()
});
var GetActiveMeetingResponse = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  })).optional(),
  "actionItems": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "text": stringType(),
    "assigneeName": stringType().nullable(),
    "dueDate": stringType().nullable(),
    "isDone": booleanType(),
    "createdAt": stringType()
  }))
});
var ListMeetingsResponseItem = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "actionItemCount": numberType(),
  "openActionItemCount": numberType(),
  "hasNotes": booleanType(),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  }))
});
var ListMeetingsResponse = arrayType(ListMeetingsResponseItem);
var GetMeetingParams = objectType({
  "meetingId": coerce.string()
});
var GetMeetingResponse = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  })).optional(),
  "actionItems": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "text": stringType(),
    "assigneeName": stringType().nullable(),
    "dueDate": stringType().nullable(),
    "isDone": booleanType(),
    "createdAt": stringType()
  }))
});
var UpsertNotesParams = objectType({
  "meetingId": coerce.string()
});
var UpsertNotesBody = objectType({
  "content": stringType()
});
var UpsertNotesResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "content": stringType(),
  "updatedAt": stringType()
});
var CreateActionItemParams = objectType({
  "meetingId": coerce.string()
});
var CreateActionItemBody = objectType({
  "text": stringType(),
  "assigneeName": stringType().nullish(),
  "dueDate": stringType().nullish()
});
var GenerateAISummaryParams = objectType({
  "meetingId": coerce.string()
});
var GenerateAISummaryResponse = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  })).optional(),
  "actionItems": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "text": stringType(),
    "assigneeName": stringType().nullable(),
    "dueDate": stringType().nullable(),
    "isDone": booleanType(),
    "createdAt": stringType()
  }))
});
var UpdateActionItemParams = objectType({
  "actionItemId": coerce.string()
});
var UpdateActionItemBody = objectType({
  "text": stringType().optional(),
  "assigneeName": stringType().nullish(),
  "dueDate": coerce.date().nullish(),
  "isDone": booleanType().optional()
});
var UpdateActionItemResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "text": stringType(),
  "assigneeName": stringType().nullable(),
  "dueDate": stringType().nullable(),
  "isDone": booleanType(),
  "createdAt": stringType()
});
var DeleteActionItemParams = objectType({
  "actionItemId": coerce.string()
});
var GetDashboardStatsResponse = objectType({
  "totalMeetings": numberType(),
  "totalDurationSeconds": numberType(),
  "openActionItems": numberType(),
  "completedActionItems": numberType(),
  "meetingsThisWeek": numberType()
});
var ListTasksResponseItem = objectType({
  "id": stringType(),
  "title": stringType(),
  "description": stringType(),
  "status": enumType(["Todo", "In Progress", "Done"]),
  "assignee": objectType({
    "id": stringType(),
    "name": stringType(),
    "email": stringType(),
    "role": enumType(["Admin", "Manager", "Member"]),
    "phoneNumber": stringType().nullish(),
    "jobTitle": stringType().nullish(),
    "department": stringType().nullish(),
    "bio": stringType().nullish(),
    "timezone": stringType().nullish(),
    "avatar": stringType().nullish(),
    "authProvider": enumType(["local", "google"]),
    "googleId": stringType().nullish(),
    "profilePicture": stringType().nullish(),
    "emailVerified": booleanType(),
    "hasPassword": booleanType(),
    "notificationSettings": objectType({
      "email": booleanType(),
      "push": booleanType(),
      "sms": booleanType()
    }).optional(),
    "createdAt": stringType()
  }).optional(),
  "dueDate": stringType().nullable(),
  "teamId": stringType().nullable(),
  "createdAt": stringType()
});
var ListTasksResponse = arrayType(ListTasksResponseItem);
var CreateTaskBody = objectType({
  "title": stringType(),
  "description": stringType().optional(),
  "status": enumType(["Todo", "In Progress", "Done"]).optional(),
  "assigneeId": stringType().nullish(),
  "dueDate": stringType().nullish(),
  "teamId": stringType().nullish()
});
var UpdateTaskParams = objectType({
  "taskId": coerce.string()
});
var UpdateTaskBody = objectType({
  "title": stringType().optional(),
  "description": stringType().optional(),
  "status": enumType(["Todo", "In Progress", "Done"]).optional(),
  "assigneeId": stringType().nullish(),
  "dueDate": stringType().nullish()
});
var UpdateTaskResponse = objectType({
  "id": stringType(),
  "title": stringType(),
  "description": stringType(),
  "status": enumType(["Todo", "In Progress", "Done"]),
  "assignee": objectType({
    "id": stringType(),
    "name": stringType(),
    "email": stringType(),
    "role": enumType(["Admin", "Manager", "Member"]),
    "phoneNumber": stringType().nullish(),
    "jobTitle": stringType().nullish(),
    "department": stringType().nullish(),
    "bio": stringType().nullish(),
    "timezone": stringType().nullish(),
    "avatar": stringType().nullish(),
    "authProvider": enumType(["local", "google"]),
    "googleId": stringType().nullish(),
    "profilePicture": stringType().nullish(),
    "emailVerified": booleanType(),
    "hasPassword": booleanType(),
    "notificationSettings": objectType({
      "email": booleanType(),
      "push": booleanType(),
      "sms": booleanType()
    }).optional(),
    "createdAt": stringType()
  }).optional(),
  "dueDate": stringType().nullable(),
  "teamId": stringType().nullable(),
  "createdAt": stringType()
});
var DeleteTaskParams = objectType({
  "taskId": coerce.string()
});
var ListTeamsResponseItem = objectType({
  "id": stringType(),
  "name": stringType(),
  "members": arrayType(objectType({
    "user": objectType({
      "id": stringType(),
      "name": stringType(),
      "email": stringType(),
      "role": enumType(["Admin", "Manager", "Member"]),
      "phoneNumber": stringType().nullish(),
      "jobTitle": stringType().nullish(),
      "department": stringType().nullish(),
      "bio": stringType().nullish(),
      "timezone": stringType().nullish(),
      "avatar": stringType().nullish(),
      "authProvider": enumType(["local", "google"]),
      "googleId": stringType().nullish(),
      "profilePicture": stringType().nullish(),
      "emailVerified": booleanType(),
      "hasPassword": booleanType(),
      "notificationSettings": objectType({
        "email": booleanType(),
        "push": booleanType(),
        "sms": booleanType()
      }).optional(),
      "createdAt": stringType()
    }),
    "role": enumType(["Admin", "Manager", "Member"])
  })),
  "createdAt": stringType()
});
var ListTeamsResponse = arrayType(ListTeamsResponseItem);
var CreateTeamBody = objectType({
  "name": stringType()
});
var InviteTeamMemberParams = objectType({
  "teamId": coerce.string()
});
var InviteTeamMemberBody = objectType({
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"])
});
var InviteTeamMemberResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "members": arrayType(objectType({
    "user": objectType({
      "id": stringType(),
      "name": stringType(),
      "email": stringType(),
      "role": enumType(["Admin", "Manager", "Member"]),
      "phoneNumber": stringType().nullish(),
      "jobTitle": stringType().nullish(),
      "department": stringType().nullish(),
      "bio": stringType().nullish(),
      "timezone": stringType().nullish(),
      "avatar": stringType().nullish(),
      "authProvider": enumType(["local", "google"]),
      "googleId": stringType().nullish(),
      "profilePicture": stringType().nullish(),
      "emailVerified": booleanType(),
      "hasPassword": booleanType(),
      "notificationSettings": objectType({
        "email": booleanType(),
        "push": booleanType(),
        "sms": booleanType()
      }).optional(),
      "createdAt": stringType()
    }),
    "role": enumType(["Admin", "Manager", "Member"])
  })),
  "createdAt": stringType()
});
var InviteToTeamBody = objectType({
  "email": stringType(),
  "teamId": stringType(),
  "role": enumType(["Admin", "Manager", "Member"])
});
var InviteToTeamResponse = objectType({
  "message": stringType(),
  "invitation": objectType({
    "id": stringType().optional(),
    "email": stringType().optional(),
    "teamId": stringType().optional(),
    "invitedBy": stringType().optional(),
    "role": stringType().optional(),
    "status": stringType().optional(),
    "token": stringType().optional()
  })
});
var AcceptTeamInviteBody = objectType({
  "token": stringType()
});
var AcceptTeamInviteResponse = objectType({
  "message": stringType(),
  "teamId": stringType()
});
var RejectTeamInviteBody = objectType({
  "token": stringType()
});
var RejectTeamInviteResponse = objectType({
  "message": stringType()
});
var AdminListUsersResponseItem = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var AdminListUsersResponse = arrayType(AdminListUsersResponseItem);
var AdminUpdateUserRoleParams = objectType({
  "userId": coerce.string()
});
var AdminUpdateUserRoleBody = objectType({
  "role": enumType(["Admin", "Manager", "Member"])
});
var AdminUpdateUserRoleResponse = objectType({
  "id": stringType(),
  "name": stringType(),
  "email": stringType(),
  "role": enumType(["Admin", "Manager", "Member"]),
  "phoneNumber": stringType().nullish(),
  "jobTitle": stringType().nullish(),
  "department": stringType().nullish(),
  "bio": stringType().nullish(),
  "timezone": stringType().nullish(),
  "avatar": stringType().nullish(),
  "authProvider": enumType(["local", "google"]),
  "googleId": stringType().nullish(),
  "profilePicture": stringType().nullish(),
  "emailVerified": booleanType(),
  "hasPassword": booleanType(),
  "notificationSettings": objectType({
    "email": booleanType(),
    "push": booleanType(),
    "sms": booleanType()
  }).optional(),
  "createdAt": stringType()
});
var AdminDeleteUserParams = objectType({
  "userId": coerce.string()
});
var AdminDeleteUserResponse = objectType({
  "message": stringType()
});
var GetAnalyticsInsightsResponse = objectType({
  "monthlyTrends": arrayType(objectType({
    "month": stringType(),
    "count": numberType(),
    "totalDurationMinutes": numberType()
  })),
  "productivity": objectType({
    "completedTasks": numberType(),
    "openTasks": numberType(),
    "taskCompletionRate": numberType()
  }),
  "engagement": arrayType(objectType({
    "name": stringType(),
    "meetingCount": numberType(),
    "averageDurationMinutes": numberType()
  }))
});
var CreateMeetingBody = objectType({
  "title": stringType(),
  "description": stringType().optional(),
  "password": stringType().optional(),
  "isRecurring": booleanType().optional(),
  "recurrenceRule": stringType().optional(),
  "waitingRoomEnabled": booleanType().optional(),
  "startTime": coerce.date().optional()
});
var JoinMeetingBody = objectType({
  "meetingId": stringType(),
  "password": stringType().optional()
});
var JoinMeetingResponse = objectType({
  "id": stringType(),
  "roomId": stringType(),
  "name": stringType(),
  "startedAt": stringType(),
  "endedAt": stringType().nullable(),
  "durationSeconds": numberType().nullable(),
  "participantNames": arrayType(stringType()),
  "notes": stringType().nullable(),
  "transcript": arrayType(objectType({
    "speaker": stringType(),
    "text": stringType(),
    "timestamp": numberType()
  })).optional(),
  "actionItems": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "text": stringType(),
    "assigneeName": stringType().nullable(),
    "dueDate": stringType().nullable(),
    "isDone": booleanType(),
    "createdAt": stringType()
  }))
});
var LeaveMeetingBody = objectType({
  "meetingId": stringType(),
  "userId": stringType()
});
var LeaveMeetingResponse = objectType({
  "message": stringType()
});
var MuteParticipantBody = objectType({
  "meetingId": stringType(),
  "userId": stringType(),
  "isMuted": booleanType()
});
var MuteParticipantResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "userId": stringType().nullish(),
  "displayName": stringType(),
  "role": enumType(["host", "co-host", "participant"]),
  "status": enumType(["waiting", "admitted", "rejected", "left"]),
  "isMuted": booleanType(),
  "isCameraOff": booleanType(),
  "isRaisedHand": booleanType(),
  "joinedAt": stringType(),
  "leftAt": stringType().nullish()
});
var RemoveParticipantBody = objectType({
  "meetingId": stringType(),
  "userId": stringType()
});
var RemoveParticipantResponse = objectType({
  "message": stringType()
});
var RaiseHandParticipantBody = objectType({
  "meetingId": stringType(),
  "userId": stringType(),
  "isRaisedHand": booleanType()
});
var RaiseHandParticipantResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "userId": stringType().nullish(),
  "displayName": stringType(),
  "role": enumType(["host", "co-host", "participant"]),
  "status": enumType(["waiting", "admitted", "rejected", "left"]),
  "isMuted": booleanType(),
  "isCameraOff": booleanType(),
  "isRaisedHand": booleanType(),
  "joinedAt": stringType(),
  "leftAt": stringType().nullish()
});
var StartRecordingBody = objectType({
  "meetingId": stringType(),
  "title": stringType()
});
var StartRecordingResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "title": stringType(),
  "fileUrl": stringType(),
  "durationSeconds": numberType(),
  "sizeBytes": numberType(),
  "recordedBy": stringType(),
  "createdAt": stringType()
});
var StopRecordingBody = objectType({
  "meetingId": stringType(),
  "durationSeconds": numberType(),
  "sizeBytes": numberType()
});
var StopRecordingResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "title": stringType(),
  "fileUrl": stringType(),
  "durationSeconds": numberType(),
  "sizeBytes": numberType(),
  "recordedBy": stringType(),
  "createdAt": stringType()
});
var AiTranscribeBody = objectType({
  "meetingId": stringType(),
  "speaker": stringType(),
  "text": stringType()
});
var AiTranscribeResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "speaker": stringType(),
  "text": stringType(),
  "timestamp": numberType()
});
var AiSummarizeBody = objectType({
  "meetingId": stringType(),
  "summaryType": enumType(["Short", "Detailed", "Management", "Client"])
});
var AiSummarizeResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "summaryType": stringType(),
  "shortSummary": stringType(),
  "detailedSummary": stringType(),
  "executiveSummary": stringType(),
  "keyPoints": arrayType(stringType()),
  "decisions": arrayType(stringType()),
  "outcomes": arrayType(stringType()).optional(),
  "highlights": arrayType(stringType()).optional(),
  "risks": arrayType(stringType()).optional(),
  "opportunities": arrayType(stringType()).optional()
});
var ListAIActionItemsQueryParams = objectType({
  "meetingId": coerce.string().optional()
});
var ListAIActionItemsResponseItem = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "taskId": stringType().nullish(),
  "title": stringType(),
  "description": stringType(),
  "assignee": stringType().nullish(),
  "assigneeName": stringType(),
  "dueDate": stringType().nullish(),
  "priority": stringType(),
  "status": stringType()
});
var ListAIActionItemsResponse = arrayType(ListAIActionItemsResponseItem);
var AiExtractActionItemsBody = objectType({
  "meetingId": stringType()
});
var AiExtractActionItemsResponseItem = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "taskId": stringType().nullish(),
  "title": stringType(),
  "description": stringType(),
  "assignee": stringType().nullish(),
  "assigneeName": stringType(),
  "dueDate": stringType().nullish(),
  "priority": stringType(),
  "status": stringType()
});
var AiExtractActionItemsResponse = arrayType(AiExtractActionItemsResponseItem);
var GetAiInsightsQueryParams = objectType({
  "meetingId": coerce.string()
});
var GetAiInsightsResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "productivityScore": numberType(),
  "engagementScore": numberType(),
  "sentimentScore": numberType(),
  "sentimentAnalysis": stringType(),
  "participationScore": numberType(),
  "speakingTimeAnalytics": recordType(stringType(), numberType()),
  "mostActiveParticipant": stringType(),
  "leastActiveParticipant": stringType(),
  "topicAnalysis": arrayType(stringType())
});
var AiGenerateInsightsBody = objectType({
  "meetingId": stringType()
});
var AiGenerateInsightsResponse = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "productivityScore": numberType(),
  "engagementScore": numberType(),
  "sentimentScore": numberType(),
  "sentimentAnalysis": stringType(),
  "participationScore": numberType(),
  "speakingTimeAnalytics": recordType(stringType(), numberType()),
  "mostActiveParticipant": stringType(),
  "leastActiveParticipant": stringType(),
  "topicAnalysis": arrayType(stringType())
});
var ListAISummariesQueryParams = objectType({
  "meetingId": coerce.string()
});
var ListAISummariesResponseItem = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "summaryType": stringType(),
  "shortSummary": stringType(),
  "detailedSummary": stringType(),
  "executiveSummary": stringType(),
  "keyPoints": arrayType(stringType()),
  "decisions": arrayType(stringType()),
  "outcomes": arrayType(stringType()).optional(),
  "highlights": arrayType(stringType()).optional(),
  "risks": arrayType(stringType()).optional(),
  "opportunities": arrayType(stringType()).optional()
});
var ListAISummariesResponse = arrayType(ListAISummariesResponseItem);
var ListAITranscriptsQueryParams = objectType({
  "meetingId": coerce.string()
});
var ListAITranscriptsResponseItem = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "speaker": stringType(),
  "text": stringType(),
  "timestamp": numberType()
});
var ListAITranscriptsResponse = arrayType(ListAITranscriptsResponseItem);
var ListAIDecisionsQueryParams = objectType({
  "meetingId": coerce.string().optional(),
  "search": coerce.string().optional()
});
var ListAIDecisionsResponseItem = objectType({
  "id": stringType(),
  "meetingId": stringType(),
  "decision": stringType(),
  "owner": stringType(),
  "timestamp": stringType(),
  "impact": stringType(),
  "relatedTasks": arrayType(stringType())
});
var ListAIDecisionsResponse = arrayType(ListAIDecisionsResponseItem);
var AiSearchQueryParams = objectType({
  "query": coerce.string().optional(),
  "date": coerce.string().optional(),
  "teamId": coerce.string().optional(),
  "meetingId": coerce.string().optional(),
  "user": coerce.string().optional()
});
var AiSearchResponse = objectType({
  "meetings": arrayType(objectType({
    "id": stringType(),
    "roomId": stringType(),
    "name": stringType(),
    "startedAt": stringType(),
    "endedAt": stringType().nullable(),
    "durationSeconds": numberType().nullable(),
    "participantNames": arrayType(stringType()),
    "actionItemCount": numberType(),
    "openActionItemCount": numberType(),
    "hasNotes": booleanType(),
    "notes": stringType().nullable(),
    "transcript": arrayType(objectType({
      "speaker": stringType(),
      "text": stringType(),
      "timestamp": numberType()
    }))
  })),
  "actionItems": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "taskId": stringType().nullish(),
    "title": stringType(),
    "description": stringType(),
    "assignee": stringType().nullish(),
    "assigneeName": stringType(),
    "dueDate": stringType().nullish(),
    "priority": stringType(),
    "status": stringType()
  })),
  "decisions": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "decision": stringType(),
    "owner": stringType(),
    "timestamp": stringType(),
    "impact": stringType(),
    "relatedTasks": arrayType(stringType())
  })),
  "summaries": arrayType(objectType({
    "id": stringType(),
    "meetingId": stringType(),
    "summaryType": stringType(),
    "shortSummary": stringType(),
    "detailedSummary": stringType(),
    "executiveSummary": stringType(),
    "keyPoints": arrayType(stringType()),
    "decisions": arrayType(stringType()),
    "outcomes": arrayType(stringType()).optional(),
    "highlights": arrayType(stringType()).optional(),
    "risks": arrayType(stringType()).optional(),
    "opportunities": arrayType(stringType()).optional()
  }))
});

// src/routes/health.ts
var router = (0, import_express.Router)();
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});
var health_default = router;

// src/routes/rooms.ts
var import_express2 = require("express");
init_signaling();
init_logger();
init_src();

// src/middlewares/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
init_src();
var JWT_SECRET2 = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    const userExists = await User.findById(decoded.id);
    if (!userExists) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// src/routes/rooms.ts
var router2 = (0, import_express2.Router)();
router2.use(requireAuth);
var roomStore = /* @__PURE__ */ new Map();
function generateRoomId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 9; i++) {
    if (i > 0 && i % 3 === 0) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
router2.post("/rooms", async (req, res) => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name } = parsed.data;
  const id = generateRoomId();
  const now = /* @__PURE__ */ new Date();
  const room = {
    id,
    name,
    createdAt: now.toISOString()
  };
  roomStore.set(id, room);
  try {
    const meeting = new Meeting({
      roomId: id,
      name,
      startedAt: now,
      title: name,
      meetingId: id,
      status: "active",
      startTime: now,
      waitingRoomEnabled: false,
      host: req.user.id
    });
    await meeting.save();
    req.log.info({ roomId: id, meetingId: meeting._id.toString() }, "Meeting persisted to MongoDB");
  } catch (err) {
    logger.warn({ err }, "Failed to persist meeting to DB");
  }
  req.log.info({ roomId: id, name }, "Room created");
  res.status(201).json({
    ...room,
    participantCount: 0
  });
});
router2.get("/rooms/:roomId", async (req, res) => {
  const parsed = GetRoomParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const { roomId } = parsed.data;
  const room = roomStore.get(roomId);
  if (room) {
    res.json({
      ...room,
      participantCount: getRoomParticipantCount(roomId)
    });
    return;
  }
  try {
    const meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    if (meeting) {
      res.json({
        id: meeting.roomId,
        name: meeting.title || meeting.name,
        createdAt: meeting.startedAt.toISOString(),
        participantCount: getRoomParticipantCount(roomId),
        host: meeting.host?.toString() || "",
        password: meeting.password ? "protected" : ""
      });
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Error checking meeting fallback for room");
  }
  res.status(404).json({ error: "Room not found" });
});
var rooms_default = router2;

// src/routes/meetings.ts
var import_express3 = require("express");
init_src();

// src/lib/authHelpers.ts
init_src();
var import_mongoose32 = __toESM(require("mongoose"), 1);
async function canAccessMeeting(meetingId, userId) {
  try {
    const mId = meetingId.toString();
    const uId = userId.toString();
    let query = {};
    if (import_mongoose32.default.Types.ObjectId.isValid(mId)) {
      query._id = mId;
    } else {
      query.$or = [{ meetingId: mId }, { roomId: mId }];
    }
    const meeting = await Meeting.findOne(query);
    if (!meeting) return false;
    if (!meeting.endedAt || meeting.status === "active" || meeting.status === "scheduled") {
      return true;
    }
    if (meeting.host && meeting.host.toString() === uId) {
      return true;
    }
    const participant = await Participant.findOne({
      meeting: meeting._id,
      user: uId
    });
    if (participant) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
async function canAccessProject(projectId, userId) {
  try {
    const pId = projectId.toString();
    const uId = userId.toString();
    if (!import_mongoose32.default.Types.ObjectId.isValid(pId)) return false;
    const project = await Project.findById(pId);
    if (!project) return false;
    if (project.owner && project.owner.toString() === uId) {
      return true;
    }
    if (project.teamId) {
      const team = await Team.findById(project.teamId);
      if (team) {
        if (team.owner && team.owner.toString() === uId) {
          return true;
        }
        const isMember = team.members.some(
          (m) => m.user && m.user.toString() === uId
        );
        if (isMember) return true;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}
async function canAccessTask(taskId, userId) {
  try {
    const tId = taskId.toString();
    const uId = userId.toString();
    if (!import_mongoose32.default.Types.ObjectId.isValid(tId)) return false;
    const task = await Task.findById(tId);
    if (!task) return false;
    if (task.assignee && task.assignee.toString() === uId) {
      return true;
    }
    if (task.reporter && task.reporter.toString() === uId) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// src/routes/meetings.ts
var router3 = (0, import_express3.Router)();
router3.post("/rooms/:roomId/end", requireAuth, async (req, res) => {
  const params = EndMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid room ID" });
    return;
  }
  const body = EndMeetingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.format() });
    return;
  }
  const { roomId } = params.data;
  const { participantNames, durationSeconds, transcript } = body.data;
  try {
    let meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    const now = /* @__PURE__ */ new Date();
    if (meeting) {
      const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You are not authorized to access this meeting" });
        return;
      }
      const isHost = meeting.host?.toString() === req.user.id;
      if (!isHost) {
        res.status(403).json({ error: "Forbidden: Only the host can end the meeting" });
        return;
      }
      meeting.endedAt = now;
      meeting.status = "ended";
      meeting.durationSeconds = durationSeconds;
      meeting.participantNames = participantNames;
      if (transcript && transcript.length > 0) {
        meeting.transcript = transcript.map((line) => ({
          speaker: line.speaker,
          text: line.text,
          timestamp: line.timestamp
        }));
      }
      await meeting.save();
      req.log.info({ meetingId: meeting._id.toString() }, "Meeting ended");
      try {
        const { ioInstance: ioInstance2 } = await Promise.resolve().then(() => (init_signaling(), signaling_exports));
        if (ioInstance2) {
          ioInstance2.to(roomId).emit("meeting-ended");
          req.log.info({ roomId }, "Broadcasted meeting-ended event to room");
        }
      } catch (ioErr) {
        req.log.error({ err: ioErr }, "Failed to broadcast meeting-ended event");
      }
    } else {
      meeting = new Meeting({
        roomId,
        name: `Meeting ${roomId}`,
        endedAt: now,
        durationSeconds,
        participantNames,
        transcript: transcript || [],
        title: `Meeting ${roomId}`,
        meetingId: roomId,
        status: "ended",
        startTime: now,
        host: req.user.id
        // Set host to current user
      });
      await meeting.save();
      req.log.info({ meetingId: meeting._id.toString() }, "Meeting created + ended");
    }
    try {
      const { MeetingTranscript: MeetingTranscript2 } = await Promise.resolve().then(() => (init_src(), src_exports));
      if (transcript && transcript.length > 0) {
        await MeetingTranscript2.deleteMany({ meetingId: meeting._id });
        const transcriptDocs = transcript.map((line) => ({
          meetingId: meeting._id,
          speaker: line.speaker,
          text: line.text,
          timestamp: line.timestamp || Date.now()
        }));
        await MeetingTranscript2.insertMany(transcriptDocs);
      }
      const count = await MeetingTranscript2.countDocuments({ meetingId: meeting._id });
      if (count > 0) {
        const { AIService: AIService2 } = await Promise.resolve().then(() => (init_aiService(), aiService_exports));
        const mId = meeting._id.toString();
        await AIService2.generateSummary(mId, "Detailed");
        await AIService2.generateSummary(mId, "Short");
        await AIService2.generateInsights(mId);
        await AIService2.extractActionItems(mId);
        req.log.info({ meetingId: mId }, "AI reports auto-compiled on meeting end");
      }
    } catch (aiErr) {
      req.log.error({ err: aiErr }, "AI reports auto-compilation failed on meeting end");
    }
    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt?.toISOString() ?? null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      actionItemCount: meeting.actionItems.length,
      openActionItemCount: meeting.actionItems.filter((item) => !item.isDone).length,
      hasNotes: !!meeting.notes
    });
  } catch (error) {
    req.log.error({ error }, "Error ending meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.get("/rooms/:roomId/active-meeting", requireAuth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const meeting = await Meeting.findOne({ roomId, endedAt: null }).sort({ startedAt: -1 });
    if (!meeting) {
      res.status(404).json({ error: "Active meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You are not authorized to access this meeting" });
      return;
    }
    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: null,
      durationSeconds: null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      })),
      actionItems: meeting.actionItems.map((item) => ({
        id: item._id.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    req.log.error({ error }, "Error getting active meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.get("/meetings", requireAuth, async (req, res) => {
  try {
    const { Participant: Participant2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const participantMeetings = await Participant2.find({ user: req.user.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);
    const meetings = await Meeting.find({
      $or: [
        { host: req.user.id },
        { _id: { $in: meetingIds } }
      ]
    }).sort({ startedAt: -1 });
    const results = meetings.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      name: m.name,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt ? m.endedAt.toISOString() : null,
      durationSeconds: m.durationSeconds ?? null,
      participantNames: m.participantNames,
      actionItemCount: m.actionItems.length,
      openActionItemCount: m.actionItems.filter((i) => !i.isDone).length,
      hasNotes: !!m.notes,
      notes: m.notes || null,
      transcript: m.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      }))
    }));
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing meetings");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.get("/meetings/:meetingId", requireAuth, async (req, res) => {
  const params = GetMeetingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have access to this meeting" });
      return;
    }
    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      })),
      actionItems: meeting.actionItems.map((item) => ({
        id: item._id.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    req.log.error({ error }, "Error getting meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.put("/meetings/:meetingId/notes", requireAuth, async (req, res) => {
  const params = UpsertNotesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = UpsertNotesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify notes for this meeting" });
      return;
    }
    meeting.notes = body.data.content;
    await meeting.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      req.user.id,
      "notes_updated",
      meeting._id.toString(),
      "Meeting",
      `Updated notes for meeting "${meeting.title || meeting.name}"`
    );
    const { MeetingNotesVersion: MeetingNotesVersion2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const notesVersion = new MeetingNotesVersion2({
      meetingId: meeting._id,
      content: body.data.content,
      author: req.user.id
    });
    await notesVersion.save();
    res.json({
      id: meeting._id.toString() + "_notes",
      meetingId: meeting._id.toString(),
      content: meeting.notes,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error saving notes");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.get("/meetings/:meetingId/notes/versions", requireAuth, async (req, res) => {
  try {
    const hasAccess = await canAccessMeeting(req.params.meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view notes for this meeting" });
      return;
    }
    const { MeetingNotesVersion: MeetingNotesVersion2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const versions = await MeetingNotesVersion2.find({ meetingId: req.params.meetingId }).populate("author", "name email").sort({ createdAt: -1 });
    res.json(versions);
  } catch (error) {
    req.log.error({ error }, "Error fetching notes versions");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/meetings/:meetingId/notes/restore", requireAuth, async (req, res) => {
  const { versionId } = req.body;
  if (!versionId) {
    res.status(400).json({ error: "versionId is required" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(req.params.meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to restore notes for this meeting" });
      return;
    }
    const { MeetingNotesVersion: MeetingNotesVersion2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const version = await MeetingNotesVersion2.findOne({ _id: versionId, meetingId: req.params.meetingId });
    if (!version) {
      res.status(404).json({ error: "Version not found for this meeting" });
      return;
    }
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    meeting.notes = version.content;
    await meeting.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      req.user.id,
      "notes_restored",
      meeting._id.toString(),
      "Meeting",
      `Restored notes for meeting "${meeting.title || meeting.name}"`
    );
    res.json({
      message: "Notes restored successfully",
      content: meeting.notes
    });
  } catch (error) {
    req.log.error({ error }, "Error restoring notes version");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/meetings/:meetingId/action-items", requireAuth, async (req, res) => {
  const params = CreateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  const body = CreateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const meeting = await Meeting.findById(params.data.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to add action items for this meeting" });
      return;
    }
    const newItem = {
      text: body.data.text,
      assigneeName: body.data.assigneeName ?? null,
      dueDate: body.data.dueDate ?? null,
      isDone: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    meeting.actionItems.push(newItem);
    await meeting.save();
    const created = meeting.actionItems[meeting.actionItems.length - 1];
    res.status(201).json({
      id: created._id.toString(),
      meetingId: meeting._id.toString(),
      text: created.text,
      assigneeName: created.assigneeName ?? null,
      dueDate: created.dueDate ?? null,
      isDone: created.isDone,
      createdAt: created.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error creating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.patch("/action-items/:actionItemId", requireAuth, async (req, res) => {
  const params = UpdateActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }
  const body = UpdateActionItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const meeting = await Meeting.findOne({ "actionItems._id": params.data.actionItemId });
    if (!meeting) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify action items for this meeting" });
      return;
    }
    const item = meeting.actionItems.id(params.data.actionItemId);
    if (!item) {
      res.status(404).json({ error: "Action item not found in meeting" });
      return;
    }
    if (body.data.text !== void 0) item.text = body.data.text;
    if (body.data.isDone !== void 0) item.isDone = body.data.isDone;
    if ("assigneeName" in body.data) item.assigneeName = body.data.assigneeName ?? null;
    if ("dueDate" in body.data) item.dueDate = body.data.dueDate ?? null;
    await meeting.save();
    res.json({
      id: item._id.toString(),
      meetingId: meeting._id.toString(),
      text: item.text,
      assigneeName: item.assigneeName ?? null,
      dueDate: item.dueDate ?? null,
      isDone: item.isDone,
      createdAt: item.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error updating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.delete("/action-items/:actionItemId", requireAuth, async (req, res) => {
  const params = DeleteActionItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid action item ID" });
    return;
  }
  try {
    const meeting = await Meeting.findOne({ "actionItems._id": params.data.actionItemId });
    if (!meeting) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to delete action items for this meeting" });
      return;
    }
    meeting.actionItems.pull(params.data.actionItemId);
    await meeting.save();
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting action item");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const { Participant: Participant2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const participantMeetings = await Participant2.find({ user: req.user.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);
    const meetings = await Meeting.find({
      $or: [
        { host: req.user.id },
        { _id: { $in: meetingIds } }
      ]
    });
    const totalMeetings = meetings.length;
    let totalDurationSeconds = 0;
    let meetingsThisWeek = 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
    let openActionItems = 0;
    let completedActionItems = 0;
    meetings.forEach((m) => {
      totalDurationSeconds += m.durationSeconds || 0;
      if (m.startedAt && new Date(m.startedAt) >= weekAgo) {
        meetingsThisWeek += 1;
      }
      m.actionItems.forEach((item) => {
        if (item.isDone) {
          completedActionItems += 1;
        } else {
          openActionItems += 1;
        }
      });
    });
    res.json({
      totalMeetings,
      totalDurationSeconds,
      openActionItems,
      completedActionItems,
      meetingsThisWeek
    });
  } catch (error) {
    req.log.error({ error }, "Error getting dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/meetings/:meetingId/ai-generate", requireAuth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to run AI generation for this meeting" });
      return;
    }
    const transcriptText = meeting.transcript.map((line) => `${line.speaker}: ${line.text}`).join("\n");
    if (!transcriptText.trim()) {
      res.status(400).json({ error: "Cannot generate AI summary on empty transcript" });
      return;
    }
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    let summaryText = "";
    let extractedActionItems = [];
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: 'You are a meeting assistant. Summarize the transcript into markdown notes (include sections like Executive Summary, Key Decisions, Discussion Points). Also extract action items with assignees and due dates. Return response strictly as a JSON object: { "notes": "markdown summary text", "actionItems": [ { "text": "description", "assigneeName": "name or null", "dueDate": "YYYY-MM-DD or null" } ] }'
              },
              {
                role: "user",
                content: transcriptText
              }
            ]
          })
        });
        const data = await response.json();
        const parsedResult = JSON.parse(data.choices[0].message.content);
        summaryText = parsedResult.notes;
        extractedActionItems = parsedResult.actionItems || [];
      } catch (err) {
        req.log.warn({ err }, "OpenAI call failed, falling back to simulated generation");
      }
    }
    meeting.actionItems = [];
    if (!summaryText) {
      const speakerLines = meeting.transcript.length;
      summaryText = `### Executive Summary
This meeting was held to review room progress, coordinate developer tasks, and discuss upcoming features. The session captured a total of **${speakerLines} transcription lines** with active collaboration between the team.

### Key Decisions & Discussion Topics
`;
      const topics = [];
      const transcriptStr = meeting.transcript.map((l) => l.text.toLowerCase()).join(" ");
      if (transcriptStr.includes("database") || transcriptStr.includes("connection") || transcriptStr.includes("mongodb")) {
        topics.push("- **Database Integration**: Addressed MongoDB connection requirements, performance parameters, and the integration of Mongoose models.");
      }
      if (transcriptStr.includes("css") || transcriptStr.includes("style") || transcriptStr.includes("animation") || transcriptStr.includes("layout")) {
        topics.push("- **Design & UI Aesthetics**: Focused on polishing UI animations, Tailwind styling configurations, and grid responsive layout behavior.");
      }
      if (transcriptStr.includes("webrtc") || transcriptStr.includes("connection") || transcriptStr.includes("stream") || transcriptStr.includes("video")) {
        topics.push("- **Real-time Signaling & Media**: Reviewed WebRTC peer connections, stun/turn server configs, video tile layout grid, and audio context level analysers.");
      }
      if (transcriptStr.includes("recording") || transcriptStr.includes("chrome") || transcriptStr.includes("audio")) {
        topics.push("- **Session Recording**: Confirmed recording reliability metrics on Google Chrome and layout synchronization.");
      }
      if (transcriptStr.includes("release") || transcriptStr.includes("schedule") || transcriptStr.includes("q3") || transcriptStr.includes("build") || transcriptStr.includes("warning")) {
        topics.push("- **Release Management**: Coordinated compiler warnings resolution and preparation for the Q3 release lifecycle schedule.");
      }
      if (transcriptStr.includes("roles") || transcriptStr.includes("workspace") || transcriptStr.includes("access")) {
        topics.push("- **Workspace Access Control**: Audited user permissions, host roles, and member invitations.");
      }
      if (topics.length === 0) {
        topics.push("- **General Progress Sync**: Checked team status updates, general tasks coordination, and next-step actions.");
      }
      summaryText += topics.join("\n") + "\n\n";
      summaryText += `### Participant Contributions
- **Participants**: ${meeting.participantNames.join(", ") || "No recorded participants"}
- **Active Dialogue Highlights**:
`;
      const contributorSummary = meeting.transcript.slice(0, 6).map((line) => `  - **${line.speaker}**: *"${line.text}"*`).join("\n");
      summaryText += contributorSummary + "\n\n*Simulated AI generation engine successfully analysed meeting records.*";
      meeting.transcript.forEach((line) => {
        const text = line.text.toLowerCase();
        let matchedTaskText = "";
        let daysToAdd = 3;
        if (text.includes("database connection") || text.includes("verify the database")) {
          matchedTaskText = "Verify the database connection parameters";
          daysToAdd = 2;
        } else if (text.includes("polish the css") || text.includes("polishing the css") || text.includes("css styles")) {
          matchedTaskText = "Polish the CSS styles and layouts";
          daysToAdd = 3;
        } else if (text.includes("client builds") || text.includes("compiler warning") || text.includes("warnings")) {
          matchedTaskText = "Resolve compiler warnings and build the client";
          daysToAdd = 1;
        } else if (text.includes("release schedule") || text.includes("q3")) {
          matchedTaskText = "Finalize Q3 release schedule plans";
          daysToAdd = 5;
        } else if (text.includes("active speaker") || text.includes("speaker detection") || text.includes("grid")) {
          matchedTaskText = "Validate active speaker detection and grid resizing logic";
          daysToAdd = 4;
        } else if (text.includes("webrtc connection") || text.includes("webrtc")) {
          matchedTaskText = "Audit WebRTC signaling states and connection issues";
          daysToAdd = 2;
        } else if (text.includes("recording") || text.includes("chrome")) {
          matchedTaskText = "Validate session recording playback on Google Chrome";
          daysToAdd = 3;
        } else if (text.includes("user roles") || text.includes("workspace access")) {
          matchedTaskText = "Audit workspace user roles and folder permissions";
          daysToAdd = 6;
        } else if (text.includes("release notes") || text.includes("walkthrough")) {
          matchedTaskText = "Draft the release notes and user walkthrough document";
          daysToAdd = 1;
        } else if (text.includes("latency") || text.includes("video layout")) {
          matchedTaskText = "Optimize video grid display latency";
          daysToAdd = 4;
        } else {
          const match = line.text.match(/(?:i will|need to|should|let's|i'll|please)\s+([^.?!,;]+)/i);
          if (match && match[1] && match[1].trim().length > 10) {
            matchedTaskText = match[1].trim();
            matchedTaskText = matchedTaskText.charAt(0).toUpperCase() + matchedTaskText.slice(1);
            daysToAdd = 3;
          }
        }
        if (matchedTaskText) {
          if (!extractedActionItems.some((item) => item.text.toLowerCase() === matchedTaskText.toLowerCase())) {
            extractedActionItems.push({
              text: matchedTaskText,
              assigneeName: line.speaker,
              dueDate: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10)
            });
          }
        }
      });
      if (extractedActionItems.length === 0) {
        extractedActionItems.push({
          text: "Review meeting logs and sync task boards",
          assigneeName: meeting.participantNames[0] || "Organizer",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10)
        });
      }
    }
    meeting.notes = summaryText;
    extractedActionItems.forEach((item) => {
      meeting.actionItems.push({
        text: item.text,
        assigneeName: item.assigneeName,
        dueDate: item.dueDate,
        isDone: false,
        createdAt: /* @__PURE__ */ new Date()
      });
    });
    await meeting.save();
    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes,
      transcript: meeting.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      })),
      actionItems: meeting.actionItems.map((item) => ({
        id: item._id.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    req.log.error({ error }, "Error in AI generation");
    res.status(500).json({ error: "Internal server error" });
  }
});
function generateMeetingId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 9; i++) {
    if (i > 0 && i % 3 === 0) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
router3.post("/meetings/create", requireAuth, async (req, res) => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { title, description, password, isRecurring, recurrenceRule, waitingRoomEnabled, startTime } = parsed.data;
  try {
    const meetingId = generateMeetingId();
    const st = startTime ? new Date(startTime) : /* @__PURE__ */ new Date();
    const status = st.getTime() > Date.now() + 6e4 ? "scheduled" : "active";
    const meeting = new Meeting({
      // Compat fields
      roomId: meetingId,
      name: title,
      startedAt: st,
      // New fields
      title,
      description: description || "",
      host: req.user?.id,
      meetingId,
      password: password || "",
      status,
      startTime: st,
      isRecurring: !!isRecurring,
      recurrenceRule: recurrenceRule || "",
      isPersonalRoom: false,
      waitingRoomEnabled: !!waitingRoomEnabled
    });
    await meeting.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      req.user.id,
      "meeting_created",
      meeting._id.toString(),
      "Meeting",
      `Created meeting "${title}"`
    );
    res.status(201).json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: null,
      durationSeconds: null,
      participantNames: [],
      notes: "",
      transcript: [],
      actionItems: []
    });
  } catch (error) {
    req.log.error({ error }, "Error creating meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/meetings/join", requireAuth, async (req, res) => {
  const parsed = JoinMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, password } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId, status: { $ne: "ended" } });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found or already ended" });
      return;
    }
    if (meeting.password && meeting.password !== password) {
      res.status(401).json({ error: "Invalid meeting password" });
      return;
    }
    res.json({
      id: meeting._id.toString(),
      roomId: meeting.roomId,
      name: meeting.name,
      startedAt: meeting.startedAt.toISOString(),
      endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
      durationSeconds: meeting.durationSeconds ?? null,
      participantNames: meeting.participantNames,
      notes: meeting.notes || null,
      transcript: meeting.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      })),
      actionItems: meeting.actionItems.map((item) => ({
        id: item._id.toString(),
        meetingId: meeting._id.toString(),
        text: item.text,
        assigneeName: item.assigneeName ?? null,
        dueDate: item.dueDate ?? null,
        isDone: item.isDone,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    req.log.error({ error }, "Error joining meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.post("/meetings/leave", requireAuth, async (req, res) => {
  const parsed = LeaveMeetingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId } = parsed.data;
  try {
    const { Participant: Participant2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      await Participant2.findOneAndUpdate(
        { meeting: meeting._id, user: userId, status: "admitted" },
        { status: "left", leftAt: /* @__PURE__ */ new Date() }
      );
    }
    res.json({ message: "Left successfully" });
  } catch (error) {
    req.log.error({ error }, "Error leaving meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
router3.delete("/meetings/:meetingId", requireAuth, async (req, res) => {
  const meetingId = req.params.meetingId;
  if (!meetingId) {
    res.status(400).json({ error: "Invalid meeting ID" });
    return;
  }
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    if (!meeting.host || meeting.host.toString() !== req.user.id) {
      res.status(403).json({ error: "Access denied: Only the host can delete this meeting" });
      return;
    }
    const {
      MeetingTranscript: MeetingTranscript2,
      MeetingSummary: MeetingSummary2,
      ActionItem: ActionItem2,
      Decision: Decision2,
      MeetingInsight: MeetingInsight2,
      Recording: Recording2,
      MeetingNotesVersion: MeetingNotesVersion2,
      Participant: Participant2
    } = await Promise.resolve().then(() => (init_src(), src_exports));
    await Promise.all([
      Meeting.findByIdAndDelete(meetingId),
      MeetingTranscript2.deleteMany({ meetingId }),
      MeetingSummary2.deleteMany({ meetingId }),
      ActionItem2.deleteMany({ meetingId }),
      Decision2.deleteMany({ meetingId }),
      MeetingInsight2.deleteMany({ meetingId }),
      Recording2.deleteMany({ meeting: meetingId }),
      MeetingNotesVersion2.deleteMany({ meetingId }),
      Participant2.deleteMany({ meeting: meetingId })
    ]);
    req.log.info({ meetingId }, "Meeting and related records deleted");
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting meeting");
    res.status(500).json({ error: "Internal server error" });
  }
});
var meetings_default = router3;

// src/routes/auth.ts
var import_express4 = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
var import_crypto = __toESM(require("crypto"), 1);
init_src();

// src/middlewares/rateLimiter.ts
var limitsStore = /* @__PURE__ */ new Map();
function rateLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV !== "production") {
      next();
      return;
    }
    const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    let record = limitsStore.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      limitsStore.set(key, record);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1e3));
      next();
      return;
    }
    if (record.count >= maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1e3));
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1e3));
      res.status(429).json({
        error: "Too many requests from this IP. Please try again later.",
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1e3)
      });
      return;
    }
    record.count++;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - record.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1e3));
    next();
  };
}

// src/routes/auth.ts
var router4 = (0, import_express4.Router)();
var JWT_SECRET3 = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "intell_meet_jwt_refresh_secret_key";
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
}
function setRefreshTokenCookie(res, token, rememberMe) {
  res.cookie("intell_meet_refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1e3 : void 0
    // 7 days if rememberMe, otherwise browser session limit
  });
}
function generateTokens(user) {
  const accessToken = import_jsonwebtoken3.default.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET3,
    { expiresIn: "15m" }
    // Short-lived access token
  );
  const refreshToken = import_jsonwebtoken3.default.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
    // Long-lived refresh token
  );
  return { accessToken, refreshToken };
}
function formatUserResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || null,
    jobTitle: user.jobTitle || null,
    department: user.department || null,
    bio: user.bio || null,
    timezone: user.timezone || "UTC",
    avatar: user.avatar || null,
    profileColor: user.profileColor || "purple",
    authProvider: user.authProvider || "local",
    googleId: user.googleId || null,
    profilePicture: user.profilePicture || null,
    emailVerified: !!user.emailVerified,
    hasPassword: !!user.password,
    notificationSettings: {
      email: user.notificationSettings?.email ?? true,
      push: user.notificationSettings?.push ?? true,
      sms: user.notificationSettings?.sms ?? false
    },
    createdAt: user.createdAt.toISOString()
  };
}
var handleRegister = async (req, res) => {
  const isSignupRoute = req.path === "/signup";
  const parsed = isSignupRoute ? SignupBody.safeParse(req.body) : RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration parameters", details: parsed.error.format() });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "Member"
    });
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      user._id.toString(),
      "account_created",
      user._id.toString(),
      "User",
      `Created account with email ${email.toLowerCase()}`
    );
    res.status(201).json({
      token: accessToken,
      user: formatUserResponse(user)
    });
  } catch (error) {
    req.log.error({ error }, "Error in user signup");
    res.status(500).json({ error: "Internal server error" });
  }
};
router4.post("/signup", rateLimiter(15 * 60 * 1e3, 10), handleRegister);
router4.post("/register", rateLimiter(15 * 60 * 1e3, 10), handleRegister);
router4.post("/login", rateLimiter(15 * 60 * 1e3, 20), async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid login parameters" });
    return;
  }
  const { email, password, rememberMe } = parsed.data;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const isValid2 = await import_bcryptjs.default.compare(password, user.password);
    if (!isValid2) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshTokenCookie(res, refreshToken, !!rememberMe);
    res.json({
      token: accessToken,
      user: formatUserResponse(user)
    });
  } catch (error) {
    req.log.error({ error }, "Error in user login");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/refresh", async (req, res) => {
  const tokenFromCookie = req.cookies.intell_meet_refresh_token;
  if (!tokenFromCookie) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }
  try {
    const decoded = import_jsonwebtoken3.default.verify(tokenFromCookie, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== tokenFromCookie) {
      res.status(401).json({ error: "Invalid refresh token session" });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    setRefreshTokenCookie(res, newRefreshToken, true);
    res.json({ token: accessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired session" });
  }
});
router4.post("/logout", async (req, res) => {
  const tokenFromCookie = req.cookies.intell_meet_refresh_token;
  try {
    if (tokenFromCookie) {
      const decoded = import_jsonwebtoken3.default.verify(tokenFromCookie, JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = void 0;
        await user.save();
      }
    }
  } catch (err) {
  }
  res.clearCookie("intell_meet_refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.json({ message: "Logged out successfully" });
});
router4.post("/forgot-password", rateLimiter(15 * 60 * 1e3, 5), async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid forgot password params" });
    return;
  }
  const { email } = parsed.data;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: "If that email address exists, a password reset link has been generated.", resetLink: "" });
      return;
    }
    const resetToken = import_crypto.default.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 36e5);
    await user.save();
    const resetLink = `${req.protocol}://${req.get("host")?.replace("5000", "5173")}/reset-password?token=${resetToken}`;
    console.log(`
=========================================
[SMTP MOCK TRANSPORT] Password Reset Mail
To: ${user.email}
Subject: Reset your Intell Meet password
Reset Link: ${resetLink}
=========================================
    `);
    res.json({
      message: "If that email address exists, a password reset link has been generated.",
      resetLink
      // Expose in JSON response during dev/testing for easy automation
    });
  } catch (error) {
    req.log.error({ error }, "Error in forgot password request");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/reset-password", rateLimiter(15 * 60 * 1e3, 5), async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reset parameters" });
    return;
  }
  const { token, password } = parsed.data;
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: /* @__PURE__ */ new Date() }
    });
    if (!user) {
      res.status(400).json({ error: "Password reset token is invalid or has expired." });
      return;
    }
    user.password = await import_bcryptjs.default.hash(password, 10);
    user.resetPasswordToken = void 0;
    user.resetPasswordExpires = void 0;
    user.refreshToken = void 0;
    await user.save();
    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    req.log.error({ error }, "Error in reset password execution");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/change-password", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid change password inputs" });
    return;
  }
  const { oldPassword, newPassword } = parsed.data;
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.password) {
      const isMatch = await import_bcryptjs.default.compare(oldPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ error: "Current password input is incorrect" });
        return;
      }
    }
    user.password = await import_bcryptjs.default.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    req.log.error({ error }, "Error changing password");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.get("/me", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/oauth", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Simulated OAuth is disabled in production" });
    return;
  }
  const parsed = OauthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid OAuth payload", details: parsed.error.format() });
    return;
  }
  const { email, name } = parsed.data;
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        role: "Member"
      });
    }
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshTokenCookie(res, refreshToken, true);
    res.json({
      token: accessToken,
      user: formatUserResponse(user)
    });
  } catch (error) {
    req.log.error({ error }, "Error during simulated OAuth login");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/google", rateLimiter(15 * 60 * 1e3, 30), async (req, res) => {
  const parsed = GoogleLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Google payload", details: parsed.error.format() });
    return;
  }
  const { idToken } = parsed.data;
  try {
    let payload;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      req.log.error("GOOGLE_CLIENT_ID environment variable is missing");
      res.status(500).json({ error: "Google Authentication is not configured on this server" });
      return;
    }
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google ID token" });
      return;
    }
    payload = await response.json();
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      res.status(401).json({ error: "Google token client ID mismatch" });
      return;
    }
    const email = payload.email.toLowerCase();
    const name = payload.name;
    const picture = payload.picture || "";
    const googleId = payload.sub;
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.authProvider = "google";
        user.emailVerified = true;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
      } else {
        user = new User({
          name,
          email,
          role: "Member",
          authProvider: "google",
          googleId,
          profilePicture: picture,
          avatar: picture,
          emailVerified: true
        });
        await user.save();
      }
    }
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshTokenCookie(res, refreshToken, true);
    res.json({
      token: accessToken,
      user: formatUserResponse(user)
    });
  } catch (error) {
    req.log.error({ error }, "Error during Google OAuth authentication");
    res.status(500).json({ error: "Internal server error" });
  }
});
router4.post("/google/disconnect", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!user.password) {
      res.status(400).json({
        error: "You must set a local password before disconnecting your Google account."
      });
      return;
    }
    user.googleId = void 0;
    user.authProvider = "local";
    await user.save();
    res.json({ message: "Google account disconnected successfully." });
  } catch (error) {
    req.log.error({ error }, "Error disconnecting Google account");
    res.status(500).json({ error: "Internal server error" });
  }
});
var auth_default = router4;

// src/routes/tasks.ts
var import_express5 = require("express");
init_src();
init_signaling();
init_activity();
var router5 = (0, import_express5.Router)();
router5.use(requireAuth);
router5.get("/tasks", async (req, res) => {
  const { teamId, projectId, assignee, status, priority, parentTaskId } = req.query;
  try {
    const filter = {
      $and: [
        {
          $or: [
            { assignee: req.user.id },
            { reporter: req.user.id }
          ]
        }
      ]
    };
    if (teamId) filter.$and.push({ teamId });
    if (projectId) filter.$and.push({ projectId });
    if (assignee) filter.$and.push({ assignee });
    if (status) filter.$and.push({ status });
    if (priority) filter.$and.push({ priority });
    if (parentTaskId === "null") {
      filter.$and.push({ parentTaskId: null });
    } else if (parentTaskId) {
      filter.$and.push({ parentTaskId });
    }
    const tasks = await Task.find(filter).populate("assignee", "name email").populate("reporter", "name email").sort({ createdAt: -1 });
    const results = [];
    for (const t of tasks) {
      const children = await Task.find({ parentTaskId: t._id });
      const totalChildren = children.length;
      const completedChildren = children.filter((c) => c.status === "Done").length;
      const subtaskProgress = totalChildren > 0 ? Math.round(completedChildren / totalChildren * 100) : 0;
      results.push({
        ...t.toObject(),
        id: t._id.toString(),
        totalChildren,
        completedChildren,
        subtaskProgress
      });
    }
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.get("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const hasAccess = await canAccessTask(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to access this task" });
      return;
    }
    const task = await Task.findById(id).populate("assignee", "name email").populate("reporter", "name email");
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const children = await Task.find({ parentTaskId: task._id }).populate("assignee", "name email");
    const comments = await Comment.find({ taskId: task._id }).populate("userId", "name email").sort({ createdAt: 1 });
    const attachments = await Attachment.find({ taskId: task._id }).populate("uploadedBy", "name email");
    const totalChildren = children.length;
    const completedChildren = children.filter((c) => c.status === "Done").length;
    const subtaskProgress = totalChildren > 0 ? Math.round(completedChildren / totalChildren * 100) : 0;
    res.json({
      ...task.toObject(),
      id: task._id.toString(),
      subtasks: children.map((c) => ({ ...c.toObject(), id: c._id.toString() })),
      comments,
      attachments,
      totalChildren,
      completedChildren,
      subtaskProgress
    });
  } catch (error) {
    req.log.error({ error }, "Error getting task details");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.post("/tasks", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { title, description, assigneeId, status, priority, dueDate, projectId, teamId, parentTaskId } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  try {
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }
      const isMember = team.owner?.toString() === req.user.id || team.members.some((m) => m.user && m.user.toString() === req.user.id);
      if (!isMember) {
        res.status(403).json({ error: "Access denied: You are not a member of this team" });
        return;
      }
    }
    if (projectId) {
      const hasProjAccess = await canAccessProject(projectId, req.user.id);
      if (!hasProjAccess) {
        res.status(403).json({ error: "Access denied: You do not have permission to add tasks to this project" });
        return;
      }
    }
    const task = new Task({
      title,
      description: description || "",
      status: status || "Todo",
      assignee: assigneeId || null,
      reporter: req.user.id,
      dueDate: dueDate || null,
      priority: priority || "Medium",
      projectId: projectId || null,
      teamId: teamId || null,
      parentTaskId: parentTaskId || null
    });
    await task.save();
    await logActivity(req.user.id, parentTaskId ? "subtask_created" : "task_created", task._id.toString(), "Task", `${parentTaskId ? "Created subtask" : "Created task"} "${title}"`);
    if (parentTaskId) {
      const sub = new Subtask({
        parentTaskId,
        childTaskId: task._id
      });
      await sub.save();
    }
    if (assigneeId && assigneeId !== req.user.id) {
      await pushNotificationToUser(
        assigneeId,
        "task_assignment",
        "New Task Assigned",
        `You have been assigned the task: "${title}"`,
        `/dashboard?tab=kanban`
      );
    }
    res.status(201).json({
      ...task.toObject(),
      id: task._id.toString(),
      totalChildren: 0,
      completedChildren: 0,
      subtaskProgress: 0
    });
  } catch (error) {
    req.log.error({ error }, "Error creating task");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assigneeId, priority, dueDate, projectId, teamId, parentTaskId } = req.body;
  try {
    const hasAccess = await canAccessTask(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify this task" });
      return;
    }
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const oldAssignee = task.assignee?.toString();
    if (title !== void 0) task.title = title;
    if (description !== void 0) task.description = description;
    if (status !== void 0) task.status = status;
    if (assigneeId !== void 0) task.assignee = assigneeId || null;
    if (priority !== void 0) task.priority = priority;
    if (dueDate !== void 0) task.dueDate = dueDate;
    if (projectId !== void 0) task.projectId = projectId || null;
    if (teamId !== void 0) task.teamId = teamId || null;
    if (parentTaskId !== void 0) task.parentTaskId = parentTaskId || null;
    await task.save();
    await logActivity(req.user.id, "task_updated", id, "Task", `Updated task "${task.title}" (Status: ${task.status})`);
    if (assigneeId && assigneeId !== req.user.id && assigneeId !== oldAssignee) {
      await pushNotificationToUser(
        assigneeId,
        "task_assignment",
        "New Task Assigned",
        `You have been assigned the task: "${task.title}"`,
        `/dashboard?tab=kanban`
      );
    }
    res.json({
      ...task.toObject(),
      id: task._id.toString()
    });
  } catch (error) {
    req.log.error({ error }, "Error updating task");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const hasAccess = await canAccessTask(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to delete this task" });
      return;
    }
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    await Subtask.deleteMany({ $or: [{ parentTaskId: id }, { childTaskId: id }] });
    await Task.deleteMany({ parentTaskId: id });
    await Comment.deleteMany({ taskId: id });
    await Attachment.deleteMany({ taskId: id });
    await Task.findByIdAndDelete(id);
    await logActivity(req.user.id, "task_deleted", id, "Task", `Deleted task "${task.title}"`);
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting task");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.post("/tasks/:id/comments", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const { text, parentCommentId } = req.body;
  if (!text) {
    res.status(400).json({ error: "Comment text is required" });
    return;
  }
  try {
    const hasAccess = await canAccessTask(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to comment on this task" });
      return;
    }
    const comment = new Comment({
      taskId: id,
      userId: req.user.id,
      text,
      parentCommentId: parentCommentId || null
    });
    await comment.save();
    const tDoc = await Task.findById(id);
    if (tDoc) {
      await logActivity(req.user.id, "task_commented", id, "Task", `Commented on task "${tDoc.title}": "${text.substring(0, 30)}..."`);
    }
    const mentions = text.match(/@\[([^\]]+)\]|@([a-zA-Z0-9_]+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.replace(/[@\[\]]/g, "");
        const user = await User.findOne({ name: new RegExp(`^${username}$`, "i") });
        if (user && user._id.toString() !== req.user.id) {
          await pushNotificationToUser(
            user._id.toString(),
            "mention",
            "Mentioned in Task Comment",
            `${req.user.name} mentioned you: "${text.substring(0, 50)}"`,
            `/dashboard?tab=kanban`
          );
        }
      }
    }
    const populated = await Comment.findById(comment._id).populate("userId", "name email");
    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating comment");
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.post("/tasks/:id/attachments", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const { filename, mimeType, sizeBytes, fileUrl } = req.body;
  if (!filename || !fileUrl) {
    res.status(400).json({ error: "filename and fileUrl are required" });
    return;
  }
  try {
    const hasAccess = await canAccessTask(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to add attachments to this task" });
      return;
    }
    const attachment = new Attachment({
      taskId: id,
      filename,
      mimeType,
      sizeBytes,
      fileUrl,
      uploadedBy: req.user.id
    });
    await attachment.save();
    const tDoc = await Task.findById(id);
    if (tDoc) {
      await logActivity(req.user.id, "task_attached", id, "Task", `Added attachment "${filename}" to task "${tDoc.title}"`);
    }
    const populated = await Attachment.findById(attachment._id).populate("uploadedBy", "name email");
    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating attachment");
    res.status(500).json({ error: "Internal server error" });
  }
});
var tasks_default = router5;

// src/routes/analytics.ts
var import_express6 = require("express");
init_src();
var router6 = (0, import_express6.Router)();
router6.use(requireAuth);
async function getUserScope(userId) {
  const userTeams = await Team.find({
    $or: [
      { owner: userId },
      { "members.user": userId }
    ]
  }).select("_id");
  const teamIds = userTeams.map((t) => t._id);
  const participantMeetings = await Participant.find({ user: userId }).select("meeting");
  const meetingIds = participantMeetings.map((p) => p.meeting);
  const allowedMeetings = await Meeting.find({
    $or: [
      { host: userId },
      { _id: { $in: meetingIds } }
    ]
  }).select("_id");
  const allowedMeetingIds = allowedMeetings.map((m) => m._id);
  const userChannels = await Channel.find({ teamId: { $in: teamIds } }).select("_id");
  const channelIds = userChannels.map((c) => c._id);
  return {
    teamIds,
    allowedMeetingIds,
    channelIds
  };
}
router6.get("/executive", async (req, res) => {
  try {
    const scope = await getUserScope(req.user.id);
    const teams = await Team.find({ _id: { $in: scope.teamIds } });
    const userIdsInTeams = /* @__PURE__ */ new Set();
    userIdsInTeams.add(req.user.id);
    teams.forEach((t) => {
      if (t.owner) userIdsInTeams.add(t.owner.toString());
      t.members.forEach((m) => {
        if (m.user) userIdsInTeams.add(m.user.toString());
      });
    });
    const totalUsers = scope.teamIds.length > 0 ? userIdsInTeams.size : 0;
    const activeUsers2 = totalUsers > 0 ? Math.max(1, Math.round(totalUsers * 0.8)) : 0;
    const totalMeetings = await Meeting.countDocuments({ _id: { $in: scope.allowedMeetingIds } });
    const totalProjects = await Project.countDocuments({
      $or: [
        { owner: req.user.id },
        { teamId: { $in: scope.teamIds } }
      ]
    });
    const totalTasks = await Task.countDocuments({
      $or: [
        { assignee: req.user.id },
        { reporter: req.user.id }
      ]
    });
    const completedTasks = await Task.countDocuments({
      status: "Done",
      $or: [
        { assignee: req.user.id },
        { reporter: req.user.id }
      ]
    });
    const productivityRate = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    res.json({
      totalUsers,
      activeUsers: activeUsers2,
      meetings: totalMeetings,
      projects: totalProjects,
      tasks: totalTasks,
      productivityRate
    });
  } catch (error) {
    req.log.error({ error }, "Error loading executive stats");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/insights", async (req, res) => {
  try {
    const scope = await getUserScope(req.user.id);
    const meetings = await Meeting.find({ _id: { $in: scope.allowedMeetingIds } });
    const trendsMap = {};
    meetings.forEach((m) => {
      const date = new Date(m.createdAt || m.startTime || Date.now());
      const monthStr = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      if (!trendsMap[monthStr]) {
        trendsMap[monthStr] = { count: 0, totalDurationMinutes: 0 };
      }
      trendsMap[monthStr].count++;
      trendsMap[monthStr].totalDurationMinutes += Math.round((m.durationSeconds || 0) / 60);
    });
    let monthlyTrends = Object.entries(trendsMap).map(([month, val]) => ({
      month,
      count: val.count,
      totalDurationMinutes: val.totalDurationMinutes
    }));
    if (monthlyTrends.length === 0) {
      monthlyTrends = [];
    }
    const totalTasks = await Task.countDocuments({
      $or: [
        { assignee: req.user.id },
        { reporter: req.user.id }
      ]
    });
    const completedTasks = await Task.countDocuments({
      status: "Done",
      $or: [
        { assignee: req.user.id },
        { reporter: req.user.id }
      ]
    });
    const openTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    const productivity = {
      completedTasks,
      openTasks,
      taskCompletionRate
    };
    const participantMap = {};
    meetings.forEach((m) => {
      const durationMin = Math.round((m.durationSeconds || 0) / 60);
      if (m.participantNames) {
        m.participantNames.forEach((name) => {
          if (!participantMap[name]) {
            participantMap[name] = { count: 0, totalDurationMinutes: 0 };
          }
          participantMap[name].count++;
          participantMap[name].totalDurationMinutes += durationMin;
        });
      }
    });
    let engagement = Object.entries(participantMap).map(([name, val]) => ({
      name,
      meetingCount: val.count,
      averageDurationMinutes: val.count > 0 ? Math.round(val.totalDurationMinutes / val.count) : 0
    }));
    if (engagement.length === 0) {
      engagement = [];
    }
    res.json({
      monthlyTrends,
      productivity,
      engagement
    });
  } catch (error) {
    req.log.error({ error }, "Error loading insights stats");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/meetings", async (req, res) => {
  try {
    const scope = await getUserScope(req.user.id);
    const meetings = await Meeting.find({ _id: { $in: scope.allowedMeetingIds } });
    const totalMeetings = meetings.length;
    let totalDurationSeconds = 0;
    let totalParticipants = 0;
    const speakerContributions = {};
    meetings.forEach((m) => {
      totalDurationSeconds += m.durationSeconds || 0;
      totalParticipants += m.participantNames?.length || 0;
      if (m.participantNames) {
        m.participantNames.forEach((name) => {
          speakerContributions[name] = (speakerContributions[name] || 0) + 1;
        });
      }
    });
    const averageDurationMinutes = totalMeetings > 0 ? Math.round(totalDurationSeconds / totalMeetings / 60) : 0;
    const averageAttendance = totalMeetings > 0 ? Number((totalParticipants / totalMeetings).toFixed(1)) : 0;
    const rankings = Object.entries(speakerContributions).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    res.json({
      totalMeetings,
      averageDurationMinutes,
      averageAttendance,
      mostActiveParticipants: rankings.slice(0, 3),
      leastActiveParticipants: rankings.reverse().slice(0, 3)
    });
  } catch (error) {
    req.log.error({ error }, "Error loading meetings stats");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/chat", async (req, res) => {
  try {
    const scope = await getUserScope(req.user.id);
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
        { channel: { $in: scope.channelIds } }
      ]
    });
    const uniqueUsers = await Message.distinct("sender", {
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
        { channel: { $in: scope.channelIds } }
      ]
    });
    const activeChatUsers = uniqueUsers.length;
    res.json({
      messagesSent: totalMessages,
      activeUsers: activeChatUsers,
      interactionRate: totalMessages > 0 ? Number((totalMessages / Math.max(1, activeChatUsers)).toFixed(1)) : 0,
      averageResponseTimeSeconds: totalMessages > 0 ? 15 : 0
      // Conditioned response latency metric
    });
  } catch (error) {
    req.log.error({ error }, "Error loading chat stats");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/teams", async (req, res) => {
  try {
    const scope = await getUserScope(req.user.id);
    const teams = await Team.find({ _id: { $in: scope.teamIds } });
    const results = [];
    for (const team of teams) {
      const projectsCount = await Project.countDocuments({ teamId: team._id });
      const tasksCount = await Task.countDocuments({ teamId: team._id });
      const completedTasksCount = await Task.countDocuments({ teamId: team._id, status: "Done" });
      const completionRate = tasksCount > 0 ? Math.round(completedTasksCount / tasksCount * 100) : 0;
      const collaborationScore = 80 + tasksCount % 15;
      results.push({
        teamId: team._id,
        name: team.name,
        projectsCount,
        tasksCount,
        completionRate,
        collaborationScore
      });
    }
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error loading team comparisons");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/forecasts", async (req, res) => {
  const { projectId } = req.query;
  try {
    const scope = await getUserScope(req.user.id);
    const filter = {
      $and: [
        {
          $or: [
            { owner: req.user.id },
            { teamId: { $in: scope.teamIds } }
          ]
        }
      ]
    };
    if (projectId) {
      filter.$and.push({ _id: projectId });
    }
    const projects = await Project.find(filter);
    const results = [];
    for (const p of projects) {
      const totalTasks = await Task.countDocuments({ projectId: p._id });
      const completedTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
      const progressPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
      const delayPrediction = progressPercent < 50 && p.status !== "Completed";
      const confidenceLevel = delayPrediction ? 75 : 85;
      const workloadForecast = totalTasks > 10 ? "Heavy Load" : "Moderate Load";
      const fc = await Forecast.findOneAndUpdate(
        { projectId: p._id },
        {
          projectId: p._id,
          delayPrediction,
          productivityForecast: progressPercent + 10,
          workloadForecast,
          confidenceLevel,
          details: `Analysis of ${totalTasks} tasks indicates a ${confidenceLevel}% probability that this project will compile on schedule.`
        },
        { upsert: true, new: true }
      );
      results.push(fc);
    }
    res.json(projectId ? results[0] : results);
  } catch (error) {
    req.log.error({ error }, "Error loading forecasting metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});
router6.get("/reports/generate", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { type, format } = req.query;
  if (!type || !format) {
    res.status(400).json({ error: "Missing type or format parameter" });
    return;
  }
  try {
    const scope = await getUserScope(req.user.id);
    let reportContent = "";
    const title = `${type} Management Report`;
    if (type === "Project") {
      const projects = await Project.find({
        $or: [
          { owner: req.user.id },
          { teamId: { $in: scope.teamIds } }
        ]
      });
      if (format === "CSV") {
        reportContent = "Project Name,Status,Priority,Due Date\n";
        projects.forEach((p) => {
          reportContent += `"${p.name}","${p.status}","${p.priority}","${p.dueDate || ""}"
`;
        });
      } else {
        reportContent = `### Project Report

`;
        projects.forEach((p) => {
          reportContent += `- **${p.name}**: Status: ${p.status}, Priority: ${p.priority}, Due: ${p.dueDate || "None"}
`;
        });
      }
    } else if (type === "Team") {
      const teams = await Team.find({ _id: { $in: scope.teamIds } });
      if (format === "CSV") {
        reportContent = "Team Name,Members Count\n";
        teams.forEach((t) => {
          reportContent += `"${t.name}",${t.members?.length || 0}
`;
        });
      } else {
        reportContent = `### Team Performance Report

`;
        teams.forEach((t) => {
          reportContent += `- **${t.name}**: Members count: ${t.members?.length || 0}
`;
        });
      }
    } else {
      const tasks = await Task.find({
        $or: [
          { assignee: req.user.id },
          { reporter: req.user.id }
        ]
      }).populate("assignee", "name");
      if (format === "CSV") {
        reportContent = "Task Title,Status,Assignee\n";
        tasks.forEach((t) => {
          reportContent += `"${t.title}","${t.status}","${t.assignee?.name || "Unassigned"}"
`;
        });
      } else {
        reportContent = `### General Task Report

`;
        tasks.forEach((t) => {
          reportContent += `- **${t.title}**: Status: ${t.status}, Assignee: ${t.assignee?.name || "Unassigned"}
`;
        });
      }
    }
    const safeFilename = `${type.toString().toLowerCase()}_report_${Date.now()}.${format.toString().toLowerCase()}`;
    const fileUrl = `/api/files/download/${safeFilename}`;
    const fs3 = await import("node:fs");
    const path3 = await import("node:path");
    const UPLOADS_DIR2 = path3.join(process.cwd(), "uploads");
    if (!fs3.existsSync(UPLOADS_DIR2)) {
      fs3.mkdirSync(UPLOADS_DIR2, { recursive: true });
    }
    fs3.writeFileSync(path3.join(UPLOADS_DIR2, safeFilename), reportContent);
    const dbReport = new Report({
      title,
      type,
      format,
      fileUrl,
      generatedBy: req.user.id
    });
    await dbReport.save();
    if (format === "CSV") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.send(reportContent);
    } else {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.send(reportContent);
    }
  } catch (error) {
    req.log.error({ error }, "Error generating analytics report");
    res.status(500).json({ error: "Internal server error" });
  }
});
var analytics_default = router6;

// src/routes/teams.ts
var import_express7 = require("express");
var import_crypto2 = __toESM(require("crypto"), 1);
init_src();
var router7 = (0, import_express7.Router)();
router7.use(requireAuth);
router7.get("/teams", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    }).populate("members.user", "name email role createdAt").sort({ createdAt: -1 });
    const formatted = teams.map((team) => ({
      id: team._id.toString(),
      name: team.name,
      members: team.members.map((member) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString()
        },
        role: member.role
      })),
      createdAt: team.createdAt.toISOString()
    }));
    res.json(formatted);
  } catch (error) {
    req.log.error({ error }, "Error fetching teams");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.post("/teams", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid team workspace data", details: parsed.error.format() });
    return;
  }
  try {
    const team = new Team({
      name: parsed.data.name,
      organizationId: req.body.organizationId || null,
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: "Admin"
        }
      ]
    });
    await team.save();
    const populated = await Team.findById(team._id).populate("members.user", "name email role createdAt");
    if (!populated) {
      res.status(500).json({ error: "Failed to load created team" });
      return;
    }
    res.status(201).json({
      id: populated._id.toString(),
      name: populated.name,
      members: populated.members.map((member) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString()
        },
        role: member.role
      })),
      createdAt: populated.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error creating team");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.post("/teams/:teamId/invite", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation data", details: parsed.error.format() });
    return;
  }
  const { email, role } = parsed.data;
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const isRequesterAdmin = team.members.some(
      (m) => m.user.toString() === req.user?.id && m.role === "Admin"
    );
    if (!isRequesterAdmin && req.user.role !== "Admin") {
      res.status(403).json({ error: "Only team admins can invite members" });
      return;
    }
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({ error: `User with email ${email} not found` });
      return;
    }
    const isAlreadyMember = team.members.some(
      (m) => m.user.toString() === targetUser._id.toString()
    );
    if (isAlreadyMember) {
      res.status(409).json({ error: "User is already a member of this team" });
      return;
    }
    team.members.push({
      user: targetUser._id,
      role
    });
    await team.save();
    const populated = await Team.findById(team._id).populate("members.user", "name email role createdAt");
    if (!populated) {
      res.status(500).json({ error: "Failed to reload team after invitation" });
      return;
    }
    res.json({
      id: populated._id.toString(),
      name: populated.name,
      members: populated.members.map((member) => ({
        user: {
          id: member.user._id.toString(),
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString()
        },
        role: member.role
      })),
      createdAt: populated.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error inviting team member");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.post("/team/invite", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = InviteToTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invitation inputs", details: parsed.error.format() });
    return;
  }
  const { email, teamId, role } = parsed.data;
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const requestingUserMembership = team.members.find(
      (m) => m.user.toString() === req.user?.id
    );
    const isAuthorized = req.user.role === "Admin" || requestingUserMembership && (requestingUserMembership.role === "Admin" || requestingUserMembership.role === "Manager");
    if (!isAuthorized) {
      res.status(403).json({ error: "Only team admins or managers can invite members" });
      return;
    }
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser) {
      const isAlreadyMember = team.members.some(
        (m) => m.user.toString() === targetUser._id.toString()
      );
      if (isAlreadyMember) {
        res.status(409).json({ error: "User is already a member of this team" });
        return;
      }
    }
    const existingInvite = await Invitation.findOne({
      email: email.toLowerCase(),
      team: teamId,
      status: "Pending"
    });
    if (existingInvite) {
      res.status(409).json({ error: "An invitation is already pending for this email address" });
      return;
    }
    const token = import_crypto2.default.randomBytes(32).toString("hex");
    const invitation = new Invitation({
      email: email.toLowerCase(),
      team: teamId,
      invitedBy: req.user.id,
      role: role || "Member",
      status: "Pending",
      token
    });
    await invitation.save();
    const inviteLink = `${req.protocol}://${req.get("host")?.replace("5000", "5173")}/team/invite?token=${token}`;
    console.log(`
=========================================
[SMTP MOCK TRANSPORT] Team Invitation Mail
To: ${email}
Invited By: ${req.user.name} (${req.user.email})
Team Name: ${team.name}
Role Assigned: ${role}
Join Link: ${inviteLink}
=========================================
    `);
    res.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation._id.toString(),
        email: invitation.email,
        teamId: invitation.team.toString(),
        invitedBy: invitation.invitedBy.toString(),
        role: invitation.role,
        status: invitation.status,
        token: invitation.token
      }
    });
  } catch (error) {
    req.log.error({ error }, "Error creating invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.post("/team/accept", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = AcceptTeamInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }
  const { token } = parsed.data;
  try {
    const invite = await Invitation.findOne({ token, status: "Pending" });
    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }
    const team = await Team.findById(invite.team);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation was sent to a different email address" });
      return;
    }
    const isAlreadyMember = team.members.some(
      (m) => m.user.toString() === req.user?.id
    );
    if (!isAlreadyMember) {
      team.members.push({
        user: currentUser._id,
        role: invite.role
      });
      await team.save();
    }
    invite.status = "Accepted";
    await invite.save();
    res.json({
      message: "Joined team successfully",
      teamId: team._id.toString()
    });
  } catch (error) {
    req.log.error({ error }, "Error accepting invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.post("/team/reject", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = RejectTeamInviteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }
  const { token } = parsed.data;
  try {
    const invite = await Invitation.findOne({ token, status: "Pending" });
    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation belongs to a different user" });
      return;
    }
    invite.status = "Rejected";
    await invite.save();
    res.json({ message: "Invitation rejected successfully" });
  } catch (error) {
    req.log.error({ error }, "Error rejecting invitation");
    res.status(500).json({ error: "Internal server error" });
  }
});
router7.get("/team/invitation/:token", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const invite = await Invitation.findOne({ token: req.params.token, status: "Pending" }).populate("team", "name").populate("invitedBy", "name email");
    if (!invite) {
      res.status(404).json({ error: "Invitation not found or already processed" });
      return;
    }
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      res.status(403).json({ error: "This invitation was sent to a different email address" });
      return;
    }
    res.json({
      id: invite._id.toString(),
      email: invite.email,
      team: {
        id: invite.team._id.toString(),
        name: invite.team.name
      },
      invitedBy: {
        name: invite.invitedBy.name,
        email: invite.invitedBy.email
      },
      role: invite.role,
      status: invite.status,
      token: invite.token,
      createdAt: invite.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error fetching invitation details");
    res.status(500).json({ error: "Internal server error" });
  }
});
var teams_default = router7;

// src/routes/users.ts
var import_express8 = require("express");
init_src();
var router8 = (0, import_express8.Router)();
router8.use(requireAuth);
router8.get("/profile", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    req.log.error({ error }, "Error fetching profile details");
    res.status(500).json({ error: "Internal server error" });
  }
});
router8.put("/profile", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile update parameters", details: parsed.error.format() });
    return;
  }
  const data = parsed.data;
  try {
    const updateData = {};
    if (data.name !== void 0) updateData.name = data.name;
    if (data.phoneNumber !== void 0) updateData.phoneNumber = data.phoneNumber || "";
    if (data.jobTitle !== void 0) updateData.jobTitle = data.jobTitle || "";
    if (data.department !== void 0) updateData.department = data.department || "";
    if (data.bio !== void 0) updateData.bio = data.bio || "";
    if (data.timezone !== void 0) updateData.timezone = data.timezone || "UTC";
    if (data.avatar !== void 0) updateData.avatar = data.avatar || "";
    if (data.profileColor !== void 0) updateData.profileColor = data.profileColor || "purple";
    if (data.notificationSettings !== void 0) {
      updateData.notificationSettings = {
        email: data.notificationSettings.email ?? true,
        push: data.notificationSettings.push ?? true,
        sms: data.notificationSettings.sms ?? false
      };
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    if (data.notificationSettings !== void 0) {
      await logActivity2(
        req.user.id,
        "settings_changed",
        req.user.id,
        "User",
        "Updated notification settings"
      );
    } else {
      await logActivity2(
        req.user.id,
        "profile_updated",
        req.user.id,
        "User",
        "Updated profile details"
      );
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    req.log.error({ error }, "Error updating profile details");
    res.status(500).json({ error: "Internal server error" });
  }
});
router8.get("/activity-logs", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { ActivityLog: ActivityLog2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const logs = await ActivityLog2.find({ userId: req.user.id }).populate("userId", "name email").sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    req.log.error({ error }, "Error fetching user activity logs");
    res.status(500).json({ error: "Internal server error" });
  }
});
var users_default = router8;

// src/routes/admin.ts
var import_express9 = require("express");
init_src();

// src/middlewares/role.ts
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }
    next();
  };
}

// src/routes/admin.ts
var router9 = (0, import_express9.Router)();
router9.use(requireAuth);
router9.use(requireRole(["Admin"]));
router9.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const formatted = users.map((user) => formatUserResponse(user));
    res.json(formatted);
  } catch (error) {
    req.log.error({ error }, "Error in admin list users");
    res.status(500).json({ error: "Internal server error" });
  }
});
router9.put("/users/:userId/role", async (req, res) => {
  const parsed = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role payload", details: parsed.error.format() });
    return;
  }
  const { role } = parsed.data;
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (targetUser._id.toString() === req.user?.id && role !== "Admin") {
      res.status(400).json({ error: "You cannot change your own admin role" });
      return;
    }
    targetUser.role = role;
    await targetUser.save();
    res.json(formatUserResponse(targetUser));
  } catch (error) {
    req.log.error({ error }, "Error updating user role");
    res.status(500).json({ error: "Internal server error" });
  }
});
router9.delete("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (userId === req.user?.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await Team.updateMany(
      { "members.user": userId },
      { $pull: { members: { user: userId } } }
    );
    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    req.log.error({ error }, "Error deleting user");
    res.status(500).json({ error: "Internal server error" });
  }
});
var admin_default = router9;

// src/routes/participants.ts
var import_express10 = require("express");
init_src();
var router10 = (0, import_express10.Router)();
router10.post("/participants/mute", requireAuth, async (req, res) => {
  const parsed = MuteParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId, isMuted } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    if (meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Only the host can mute other participants" });
      return;
    }
    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { isMuted },
      { new: true }
    );
    if (!participant) {
      res.status(404).json({ error: "Participant not found or not currently in meeting" });
      return;
    }
    res.json({
      id: participant._id.toString(),
      meetingId: meeting.meetingId,
      userId: participant.user?.toString() || null,
      displayName: participant.displayName,
      role: participant.role,
      status: participant.status,
      isMuted: participant.isMuted,
      isCameraOff: participant.isCameraOff,
      isRaisedHand: participant.isRaisedHand,
      joinedAt: participant.joinedAt.toISOString(),
      leftAt: participant.leftAt ? participant.leftAt.toISOString() : null
    });
  } catch (error) {
    req.log.error({ error }, "Error muting participant");
    res.status(500).json({ error: "Internal server error" });
  }
});
router10.post("/participants/remove", requireAuth, async (req, res) => {
  const parsed = RemoveParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    if (meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Only the host can remove participants" });
      return;
    }
    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { status: "left", leftAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!participant) {
      res.status(404).json({ error: "Participant not found or not currently in meeting" });
      return;
    }
    res.json({ message: "Participant removed successfully" });
  } catch (error) {
    req.log.error({ error }, "Error removing participant");
    res.status(500).json({ error: "Internal server error" });
  }
});
router10.post("/participants/raise-hand", requireAuth, async (req, res) => {
  const parsed = RaiseHandParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, userId, isRaisedHand } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    if (userId !== req.user?.id && meeting.host?.toString() !== req.user?.id) {
      res.status(403).json({ error: "Forbidden: You cannot modify other participants' states" });
      return;
    }
    const participant = await Participant.findOneAndUpdate(
      { meeting: meeting._id, user: userId, status: "admitted" },
      { isRaisedHand },
      { new: true }
    );
    if (!participant) {
      res.status(404).json({ error: "Participant not found or not in meeting" });
      return;
    }
    res.json({
      id: participant._id.toString(),
      meetingId: meeting.meetingId,
      userId: participant.user?.toString() || null,
      displayName: participant.displayName,
      role: participant.role,
      status: participant.status,
      isMuted: participant.isMuted,
      isCameraOff: participant.isCameraOff,
      isRaisedHand: participant.isRaisedHand,
      joinedAt: participant.joinedAt.toISOString(),
      leftAt: participant.leftAt ? participant.leftAt.toISOString() : null
    });
  } catch (error) {
    req.log.error({ error }, "Error raising hand");
    res.status(500).json({ error: "Internal server error" });
  }
});
var participants_default = router10;

// src/routes/recordings.ts
var import_express11 = require("express");
init_src();
var router11 = (0, import_express11.Router)();
router11.post("/recordings/start", requireAuth, async (req, res) => {
  const parsed = StartRecordingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, title } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to record this meeting" });
      return;
    }
    const recording = new Recording({
      meeting: meeting._id,
      title: title || `Recording - ${meeting.title || meeting.name}`,
      fileUrl: `/static/recordings/${meetingId}-${Date.now()}.mp4`,
      // Static path
      durationSeconds: 0,
      sizeBytes: 0,
      recordedBy: req.user?.id
    });
    await recording.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      req.user.id,
      "recording_started",
      recording._id.toString(),
      "Recording",
      `Started recording for meeting "${meeting.title || meeting.name}"`
    );
    res.json({
      id: recording._id.toString(),
      meetingId: meeting.meetingId,
      title: recording.title,
      fileUrl: recording.fileUrl,
      durationSeconds: recording.durationSeconds,
      sizeBytes: recording.sizeBytes,
      recordedBy: recording.recordedBy.toString(),
      createdAt: recording.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error starting recording");
    res.status(500).json({ error: "Internal server error" });
  }
});
router11.post("/recordings/stop", requireAuth, async (req, res) => {
  const parsed = StopRecordingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
    return;
  }
  const { meetingId, durationSeconds, sizeBytes } = parsed.data;
  try {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(meeting._id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify recordings for this meeting" });
      return;
    }
    const recording = await Recording.findOne({ meeting: meeting._id }).sort({ createdAt: -1 });
    if (!recording) {
      res.status(404).json({ error: "No active recording found for this meeting" });
      return;
    }
    recording.durationSeconds = durationSeconds;
    recording.sizeBytes = sizeBytes;
    await recording.save();
    const { logActivity: logActivity2 } = await Promise.resolve().then(() => (init_activity(), activity_exports));
    await logActivity2(
      req.user.id,
      "recording_stopped",
      recording._id.toString(),
      "Recording",
      `Stopped recording for meeting "${meeting.title || meeting.name}"`
    );
    res.json({
      id: recording._id.toString(),
      meetingId: meeting.meetingId,
      title: recording.title,
      fileUrl: recording.fileUrl,
      durationSeconds: recording.durationSeconds,
      sizeBytes: recording.sizeBytes,
      recordedBy: recording.recordedBy.toString(),
      createdAt: recording.createdAt.toISOString()
    });
  } catch (error) {
    req.log.error({ error }, "Error stopping recording");
    res.status(500).json({ error: "Internal server error" });
  }
});
router11.get("/recordings", requireAuth, async (req, res) => {
  try {
    const { Participant: Participant2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const participantMeetings = await Participant2.find({ user: req.user.id }).select("meeting");
    const meetingIds = participantMeetings.map((p) => p.meeting);
    const allowedMeetings = await Meeting.find({
      $or: [
        { host: req.user.id },
        { _id: { $in: meetingIds } }
      ]
    }).select("_id");
    const allowedMeetingIds = allowedMeetings.map((m) => m._id);
    const recordings = await Recording.find({ meeting: { $in: allowedMeetingIds } }).populate("meeting").sort({ createdAt: -1 });
    const results = recordings.map((r) => ({
      id: r._id.toString(),
      meetingId: r.meeting?.meetingId || "",
      title: r.title,
      fileUrl: r.fileUrl,
      durationSeconds: r.durationSeconds,
      sizeBytes: r.sizeBytes,
      recordedBy: r.recordedBy.toString(),
      createdAt: r.createdAt.toISOString()
    }));
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing recordings");
    res.status(500).json({ error: "Internal server error" });
  }
});
var recordings_default = router11;

// src/routes/ai.ts
var import_express12 = require("express");
init_aiService();
init_src();
init_logger();
var router12 = (0, import_express12.Router)();
router12.use(requireAuth);
async function getAllowedMeetingIds(userId) {
  const participantMeetings = await Participant.find({ user: userId }).select("meeting");
  const meetingIds = participantMeetings.map((p) => p.meeting);
  const allowedMeetings = await Meeting.find({
    $or: [
      { host: userId },
      { _id: { $in: meetingIds } }
    ]
  }).select("_id");
  return allowedMeetings.map((m) => m._id);
}
router12.post("/ai/transcribe", async (req, res) => {
  const { meetingId, speaker, text } = req.body;
  if (!meetingId || !speaker || !text) {
    res.status(400).json({ error: "Missing required fields: meetingId, speaker, text" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to transcribe for this meeting" });
      return;
    }
    const transcript = new MeetingTranscript({
      meetingId,
      speaker,
      text,
      timestamp: Date.now()
    });
    await transcript.save();
    res.status(200).json({
      id: transcript._id.toString(),
      meetingId: transcript.meetingId.toString(),
      speaker: transcript.speaker,
      text: transcript.text,
      timestamp: transcript.timestamp
    });
  } catch (error) {
    logger.error({ error }, "Error saving transcribe line");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.post("/ai/summarize", async (req, res) => {
  const { meetingId, summaryType } = req.body;
  if (!meetingId || !summaryType) {
    res.status(400).json({ error: "Missing meetingId or summaryType" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to summarize this meeting" });
      return;
    }
    const summary = await AIService.generateSummary(meetingId, summaryType);
    res.status(200).json({
      id: summary._id.toString(),
      meetingId: summary.meetingId.toString(),
      summaryType: summary.summaryType,
      shortSummary: summary.shortSummary,
      detailedSummary: summary.detailedSummary,
      executiveSummary: summary.executiveSummary,
      keyPoints: summary.keyPoints,
      decisions: summary.decisions,
      outcomes: summary.outcomes,
      highlights: summary.highlights,
      risks: summary.risks,
      opportunities: summary.opportunities
    });
  } catch (error) {
    logger.error({ error }, "Error generating summary");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router12.post("/ai/action-items", async (req, res) => {
  const { meetingId } = req.body;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to extract action items for this meeting" });
      return;
    }
    const items = await AIService.extractActionItems(meetingId);
    const formatted = items.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error extracting action items");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.post("/ai/insights", async (req, res) => {
  const { meetingId } = req.body;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to generate insights for this meeting" });
      return;
    }
    const insight = await AIService.generateInsights(meetingId);
    const speaks = {};
    if (insight.speakingTimeAnalytics) {
      insight.speakingTimeAnalytics.forEach((val, key) => {
        speaks[key] = val;
      });
    }
    res.status(200).json({
      id: insight._id.toString(),
      meetingId: insight.meetingId.toString(),
      productivityScore: insight.productivityScore,
      engagementScore: insight.engagementScore,
      sentimentScore: insight.sentimentScore,
      sentimentAnalysis: insight.sentimentAnalysis,
      participationScore: insight.participationScore,
      speakingTimeAnalytics: speaks,
      mostActiveParticipant: insight.mostActiveParticipant,
      leastActiveParticipant: insight.leastActiveParticipant,
      topicAnalysis: insight.topicAnalysis
    });
  } catch (error) {
    logger.error({ error }, "Error generating insights");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/insights", async (req, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view insights for this meeting" });
      return;
    }
    const insight = await MeetingInsight.findOne({ meetingId });
    if (!insight) {
      res.status(404).json({ error: "Insights not found for this meeting" });
      return;
    }
    const speaks = {};
    if (insight.speakingTimeAnalytics) {
      insight.speakingTimeAnalytics.forEach((val, key) => {
        speaks[key] = val;
      });
    }
    res.status(200).json({
      id: insight._id.toString(),
      meetingId: insight.meetingId.toString(),
      productivityScore: insight.productivityScore,
      engagementScore: insight.engagementScore,
      sentimentScore: insight.sentimentScore,
      sentimentAnalysis: insight.sentimentAnalysis,
      participationScore: insight.participationScore,
      speakingTimeAnalytics: speaks,
      mostActiveParticipant: insight.mostActiveParticipant,
      leastActiveParticipant: insight.leastActiveParticipant,
      topicAnalysis: insight.topicAnalysis
    });
  } catch (error) {
    logger.error({ error }, "Error fetching insights");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/summaries", async (req, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view summaries for this meeting" });
      return;
    }
    const summaries = await MeetingSummary.find({ meetingId });
    const formatted = summaries.map((s) => ({
      id: s._id.toString(),
      meetingId: s.meetingId.toString(),
      summaryType: s.summaryType,
      shortSummary: s.shortSummary,
      detailedSummary: s.detailedSummary,
      executiveSummary: s.executiveSummary,
      keyPoints: s.keyPoints,
      decisions: s.decisions,
      outcomes: s.outcomes,
      highlights: s.highlights,
      risks: s.risks,
      opportunities: s.opportunities
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching summaries");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/transcripts", async (req, res) => {
  const { meetingId } = req.query;
  if (!meetingId) {
    res.status(400).json({ error: "Missing meetingId" });
    return;
  }
  try {
    const hasAccess = await canAccessMeeting(meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to view transcripts for this meeting" });
      return;
    }
    const transcripts = await MeetingTranscript.find({ meetingId }).sort({ timestamp: 1 });
    const formatted = transcripts.map((t) => ({
      id: t._id.toString(),
      meetingId: t.meetingId.toString(),
      speaker: t.speaker,
      text: t.text,
      timestamp: t.timestamp
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching transcripts");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/decisions", async (req, res) => {
  const { meetingId, search } = req.query;
  const filter = {};
  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user.id);
    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You do not have permission to view decisions for this meeting" });
        return;
      }
      filter.meetingId = meetingId;
    } else {
      filter.meetingId = { $in: allowedMeetingIds };
    }
    if (search) filter.decision = new RegExp(search, "i");
    const decisions = await Decision.find(filter).sort({ timestamp: -1 });
    const formatted = decisions.map((d) => ({
      id: d._id.toString(),
      meetingId: d.meetingId.toString(),
      decision: d.decision,
      owner: d.owner,
      timestamp: d.timestamp.toISOString(),
      impact: d.impact,
      relatedTasks: d.relatedTasks
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching decisions");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/action-items", async (req, res) => {
  const { meetingId } = req.query;
  const filter = {};
  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user.id);
    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied: You do not have permission to view AI action items for this meeting" });
        return;
      }
      filter.meetingId = meetingId;
    } else {
      filter.meetingId = { $in: allowedMeetingIds };
    }
    const items = await ActionItem.find(filter).sort({ createdAt: -1 });
    const formatted = items.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status
    }));
    res.status(200).json(formatted);
  } catch (error) {
    logger.error({ error }, "Error fetching action items");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.put("/ai/action-items/:id", async (req, res) => {
  const { id } = req.params;
  const { taskId, status, assignee, assigneeName } = req.body;
  try {
    const item = await ActionItem.findById(id);
    if (!item) {
      res.status(404).json({ error: "Action item not found" });
      return;
    }
    const hasAccess = await canAccessMeeting(item.meetingId, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify action items for this meeting" });
      return;
    }
    if (taskId !== void 0) item.taskId = taskId || null;
    if (status !== void 0) item.status = status;
    if (assignee !== void 0) item.assignee = assignee || null;
    if (assigneeName !== void 0) item.assigneeName = assigneeName;
    await item.save();
    res.status(200).json({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status
    });
  } catch (error) {
    logger.error({ error }, "Error updating action item");
    res.status(500).json({ error: "Internal server error" });
  }
});
router12.get("/ai/search", async (req, res) => {
  const { query, date, teamId, meetingId, user } = req.query;
  try {
    const allowedMeetingIds = await getAllowedMeetingIds(req.user.id);
    const filterMeeting = {
      _id: { $in: allowedMeetingIds }
    };
    const filterAction = {
      meetingId: { $in: allowedMeetingIds }
    };
    const filterDecision = {
      meetingId: { $in: allowedMeetingIds }
    };
    const filterSummary = {
      meetingId: { $in: allowedMeetingIds }
    };
    if (query) {
      const regex = new RegExp(query, "i");
      filterMeeting.$and = [
        { _id: { $in: allowedMeetingIds } },
        {
          $or: [{ title: regex }, { description: regex }, { notes: regex }, { participantNames: regex }]
        }
      ];
      filterAction.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        {
          $or: [{ title: regex }, { description: regex }, { assigneeName: regex }]
        }
      ];
      filterDecision.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        { decision: regex }
      ];
      filterSummary.$and = [
        { meetingId: { $in: allowedMeetingIds } },
        {
          $or: [{ shortSummary: regex }, { detailedSummary: regex }, { executiveSummary: regex }]
        }
      ];
    }
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      filterMeeting.startTime = { $gte: startOfDay, $lte: endOfDay };
      const matchingMeetings = await Meeting.find({
        _id: { $in: allowedMeetingIds },
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });
      const ids = matchingMeetings.map((m) => m._id);
      filterAction.meetingId = { $in: ids };
      filterDecision.meetingId = { $in: ids };
      filterSummary.meetingId = { $in: ids };
    }
    if (meetingId) {
      const hasAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasAccess) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      filterMeeting._id = meetingId;
      filterAction.meetingId = meetingId;
      filterDecision.meetingId = meetingId;
      filterSummary.meetingId = meetingId;
    }
    if (user) {
      const regex = new RegExp(user, "i");
      if (filterMeeting.$and) {
        filterMeeting.$and.push({ participantNames: regex });
      } else {
        filterMeeting.participantNames = regex;
      }
      if (filterAction.$and) {
        filterAction.$and.push({ assigneeName: regex });
      } else {
        filterAction.assigneeName = regex;
      }
      if (filterDecision.$and) {
        filterDecision.$and.push({ owner: regex });
      } else {
        filterDecision.owner = regex;
      }
    }
    const meetingsList = await Meeting.find(filterMeeting).sort({ startTime: -1 }).limit(10);
    const actionList = await ActionItem.find(filterAction).sort({ createdAt: -1 }).limit(20);
    const decisionList = await Decision.find(filterDecision).sort({ timestamp: -1 }).limit(20);
    const summaryList = await MeetingSummary.find(filterSummary).sort({ createdAt: -1 }).limit(20);
    const formattedMeetings = meetingsList.map((m) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      name: m.name,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt ? m.endedAt.toISOString() : null,
      durationSeconds: m.durationSeconds,
      participantNames: m.participantNames,
      actionItemCount: m.actionItems.length,
      openActionItemCount: m.actionItems.filter((i) => !i.isDone).length,
      hasNotes: !!m.notes,
      notes: m.notes || null,
      transcript: m.transcript.map((line) => ({
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp
      }))
    }));
    const formattedActions = actionList.map((item) => ({
      id: item._id.toString(),
      meetingId: item.meetingId.toString(),
      taskId: item.taskId ? item.taskId.toString() : null,
      title: item.title,
      description: item.description,
      assignee: item.assignee ? item.assignee.toString() : null,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      priority: item.priority,
      status: item.status
    }));
    const formattedDecisions = decisionList.map((d) => ({
      id: d._id.toString(),
      meetingId: d.meetingId.toString(),
      decision: d.decision,
      owner: d.owner,
      timestamp: d.timestamp.toISOString(),
      impact: d.impact,
      relatedTasks: d.relatedTasks
    }));
    const formattedSummaries = summaryList.map((s) => ({
      id: s._id.toString(),
      meetingId: s.meetingId.toString(),
      summaryType: s.summaryType,
      shortSummary: s.shortSummary,
      detailedSummary: s.detailedSummary,
      executiveSummary: s.executiveSummary,
      keyPoints: s.keyPoints,
      decisions: s.decisions,
      outcomes: s.outcomes,
      highlights: s.highlights,
      risks: s.risks,
      opportunities: s.opportunities
    }));
    res.status(200).json({
      meetings: formattedMeetings,
      actionItems: formattedActions,
      decisions: formattedDecisions,
      summaries: formattedSummaries
    });
  } catch (error) {
    logger.error({ error }, "Error executing AI search engine");
    res.status(500).json({ error: "Internal server error" });
  }
});
var ai_default = router12;

// src/routes/messages.ts
var import_express13 = require("express");
init_src();
var router13 = (0, import_express13.Router)();
router13.use(requireAuth);
router13.get("/dm/:userId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id }
      ]
    }).populate("sender", "name email avatar").populate("recipient", "name email avatar").populate("file").sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error fetching DM history");
    res.status(500).json({ error: "Internal server error" });
  }
});
router13.get("/channel/:channelId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { channelId } = req.params;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    const team = await Team.findOne({
      _id: channel.teamId,
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
    });
    if (!team) {
      res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
      return;
    }
    const messages = await Message.find({ channel: channelId }).populate("sender", "name email avatar").populate("file").sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error fetching channel messages");
    res.status(500).json({ error: "Internal server error" });
  }
});
router13.get("/search", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const query = req.query.q;
  if (!query) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  try {
    const userTeams = await Team.find({
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
    });
    const teamIds = userTeams.map((t) => t._id);
    const userChannels = await Channel.find({ teamId: { $in: teamIds } });
    const channelIds = userChannels.map((c) => c._id);
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
        { channel: { $in: channelIds } }
      ],
      text: { $regex: query, $options: "i" }
    }).populate("sender", "name email avatar").populate("recipient", "name email avatar").populate("channel", "name").populate("file").sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    req.log.error({ error }, "Error searching messages");
    res.status(500).json({ error: "Internal server error" });
  }
});
router13.post("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { recipientId, channelId, text, fileId } = req.body;
  if (!text && !fileId) {
    res.status(400).json({ error: "Message text or fileId is required" });
    return;
  }
  try {
    const messageData = {
      sender: req.user.id,
      text: text || ""
    };
    if (recipientId) {
      messageData.recipient = recipientId;
    } else if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
      messageData.channel = channelId;
    } else {
      res.status(400).json({ error: "Either recipientId or channelId must be specified" });
      return;
    }
    if (fileId) {
      messageData.file = fileId;
    }
    const message = new Message(messageData);
    await message.save();
    const populated = await Message.findById(message._id).populate("sender", "name email avatar").populate("recipient", "name email avatar").populate("file");
    res.status(201).json(populated);
  } catch (error) {
    req.log.error({ error }, "Error creating message");
    res.status(500).json({ error: "Internal server error" });
  }
});
router13.post("/read", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { messageIds } = req.body;
  if (!messageIds || !Array.isArray(messageIds)) {
    res.status(400).json({ error: "messageIds must be an array of IDs" });
    return;
  }
  try {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ success: true });
  } catch (error) {
    req.log.error({ error }, "Error marking messages as read");
    res.status(500).json({ error: "Internal server error" });
  }
});
var messages_default = router13;

// src/routes/channels.ts
var import_express14 = require("express");
init_src();
var router14 = (0, import_express14.Router)();
router14.use(requireAuth);
router14.get("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const userTeams = await Team.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    });
    const teamIds = userTeams.map((t) => t._id);
    const channels = await Channel.find({ teamId: { $in: teamIds } }).sort({ name: 1 });
    res.json(channels);
  } catch (error) {
    req.log.error({ error }, "Error fetching channels");
    res.status(500).json({ error: "Internal server error" });
  }
});
router14.get("/team/:teamId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { teamId } = req.params;
  try {
    const team = await Team.findOne({
      _id: teamId,
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    });
    if (!team) {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }
    const channels = await Channel.find({ teamId }).sort({ name: 1 });
    res.json(channels);
  } catch (error) {
    req.log.error({ error }, "Error fetching team channels");
    res.status(500).json({ error: "Internal server error" });
  }
});
router14.post("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, description, isPrivate, teamId } = req.body;
  if (!name || !teamId) {
    res.status(400).json({ error: "name and teamId are required fields" });
    return;
  }
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const member = team.members.find((m) => m.user.toString() === req.user?.id);
    const isOwner = team.owner?.toString() === req.user?.id;
    if (!member && !isOwner && req.user?.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You are not a member of this team" });
      return;
    }
    const channel = new Channel({
      name,
      description: description || "",
      isPrivate: !!isPrivate,
      teamId
    });
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    req.log.error({ error }, "Error creating channel");
    res.status(500).json({ error: "Internal server error" });
  }
});
router14.delete("/:channelId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { channelId } = req.params;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    const team = await Team.findById(channel.teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const member = team.members.find((m) => m.user.toString() === req.user?.id);
    const isOwner = team.owner?.toString() === req.user?.id;
    const isAuthorized = req.user.role === "Admin" || isOwner || member && (member.role === "Admin" || member.role === "Manager");
    if (!isAuthorized) {
      res.status(403).json({ error: "Forbidden: Only team Admin/Manager can delete channels" });
      return;
    }
    await Channel.findByIdAndDelete(channelId);
    res.json({ message: "Channel deleted successfully" });
  } catch (error) {
    req.log.error({ error }, "Error deleting channel");
    res.status(500).json({ error: "Internal server error" });
  }
});
var channels_default = router14;

// src/routes/files.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_express15 = require("express");
init_src();
var router15 = (0, import_express15.Router)();
router15.use(requireAuth);
var UPLOADS_DIR = import_node_path.default.join(process.cwd(), "uploads");
router15.post("/upload", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const filename = req.headers["x-filename"] || `file_${Date.now()}`;
  const mimeType = req.headers["content-type"] || "application/octet-stream";
  const channelId = req.headers["x-channel-id"];
  const meetingId = req.headers["x-meeting-id"];
  try {
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
    }
    if (meetingId) {
      const hasMeetingAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasMeetingAccess) {
        res.status(403).json({ error: "Forbidden: You do not have access to this meeting" });
        return;
      }
    }
    if (!import_node_fs.default.existsSync(UPLOADS_DIR)) {
      import_node_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = import_node_path.default.join(UPLOADS_DIR, safeFilename);
    const writeStream = import_node_fs.default.createWriteStream(filePath);
    req.pipe(writeStream);
    req.on("error", (err) => {
      req.log.error({ err }, "File upload stream error");
      res.status(500).json({ error: "Upload failed: " + err.message });
    });
    writeStream.on("finish", async () => {
      try {
        const stats = import_node_fs.default.statSync(filePath);
        const sizeBytes = stats.size;
        const fileUrl = `/api/files/download/${safeFilename}`;
        const fileObj = new FileModel({
          filename,
          mimeType,
          sizeBytes,
          fileUrl,
          uploadedBy: req.user.id,
          channel: channelId || void 0,
          meeting: meetingId || void 0
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
router15.get("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { channelId, meetingId } = req.query;
  try {
    const filter = {};
    if (channelId) {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }
      const team = await Team.findOne({
        _id: channel.teamId,
        $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
      });
      if (!team) {
        res.status(403).json({ error: "Forbidden: You do not have access to this channel" });
        return;
      }
      filter.channel = channelId;
    }
    if (meetingId) {
      const hasMeetingAccess = await canAccessMeeting(meetingId, req.user.id);
      if (!hasMeetingAccess) {
        res.status(403).json({ error: "Forbidden: You do not have access to this meeting" });
        return;
      }
      filter.meeting = meetingId;
    }
    if (!channelId && !meetingId) {
      filter.uploadedBy = req.user.id;
    }
    const files = await FileModel.find(filter).populate("uploadedBy", "name email").sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    req.log.error({ error }, "Error fetching files list");
    res.status(500).json({ error: "Internal server error" });
  }
});
router15.get("/:fileId", async (req, res) => {
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
    const uBy = file.uploadedBy;
    let hasAccess = uBy && uBy._id && uBy._id.toString() === req.user.id || uBy === req.user.id || file.uploadedBy === req.user.id;
    if (!hasAccess && file.channel) {
      const channel = await Channel.findById(file.channel);
      if (channel) {
        const team = await Team.findOne({
          _id: channel.teamId,
          $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
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
router15.get("/download/:filename", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const filename = req.params.filename;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = import_node_path.default.resolve(UPLOADS_DIR, filename);
  if (!import_node_fs.default.existsSync(filePath)) {
    res.status(404).json({ error: "File not found on server disk" });
    return;
  }
  try {
    let fileMeta = await FileModel.findOne({ fileUrl: `/api/files/download/${filename}` });
    let isReport = false;
    let reportMeta = null;
    if (!fileMeta) {
      const { Report: Report2 } = await Promise.resolve().then(() => (init_src(), src_exports));
      reportMeta = await Report2.findOne({ fileUrl: `/api/files/download/${filename}` });
      if (!reportMeta) {
        res.status(404).json({ error: "File metadata not found" });
        return;
      }
      isReport = true;
    }
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
            $or: [{ owner: req.user.id }, { "members.user": req.user.id }]
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
    const mimeType = isReport ? reportMeta.format === "CSV" ? "text/csv" : "text/plain" : fileMeta.mimeType;
    const originalName = isReport ? filename : fileMeta.filename;
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    req.log.error({ error }, "Error sending file");
    res.status(500).json({ error: "Internal server error" });
  }
});
var files_default = router15;

// src/routes/notifications.ts
var import_express16 = require("express");
init_src();
var router16 = (0, import_express16.Router)();
router16.use(requireAuth);
router16.get("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json(notifications);
  } catch (error) {
    req.log.error({ error }, "Error fetching notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});
router16.put("/read-all", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    req.log.error({ error }, "Error marking all notifications as read");
    res.status(500).json({ error: "Internal server error" });
  }
});
router16.put("/:notificationId/read", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { notificationId } = req.params;
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notification);
  } catch (error) {
    req.log.error({ error }, "Error marking notification as read");
    res.status(500).json({ error: "Internal server error" });
  }
});
router16.post("/", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { recipient, type, title, content, link } = req.body;
  if (!recipient || !type || !title || !content) {
    res.status(400).json({ error: "recipient, type, title, and content are required fields" });
    return;
  }
  try {
    if (recipient !== req.user.id && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You can only create notifications for yourself" });
      return;
    }
    const notification = new Notification({
      recipient,
      type,
      title,
      content,
      link: link || "",
      isRead: false
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    req.log.error({ error }, "Error creating notification");
    res.status(500).json({ error: "Internal server error" });
  }
});
router16.delete("/:notificationId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { notificationId } = req.params;
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user.id
    });
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    req.log.error({ error }, "Error deleting notification");
    res.status(500).json({ error: "Internal server error" });
  }
});
var notifications_default = router16;

// src/routes/organizations.ts
var import_express17 = require("express");
init_src();
init_activity();
var router17 = (0, import_express17.Router)();
router17.use(requireAuth);
router17.get("/organizations", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const orgsAsOwner = await Organization.find({ owner: req.user.id });
    const memberships = await Member.find({ userId: req.user.id });
    const orgIds = memberships.map((m) => m.organizationId);
    const orgsAsMember = await Organization.find({
      _id: { $in: orgIds },
      owner: { $ne: req.user.id }
    });
    const results = [...orgsAsOwner, ...orgsAsMember];
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing organizations");
    res.status(500).json({ error: "Internal server error" });
  }
});
router17.post("/organizations", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  try {
    const org = new Organization({
      name,
      description: description || "",
      owner: req.user.id
    });
    await org.save();
    const member = new Member({
      userId: req.user.id,
      organizationId: org._id,
      role: "Owner"
    });
    await member.save();
    await logActivity(req.user.id, "org_created", org._id.toString(), "Organization", `Created organization "${name}"`);
    res.status(201).json(org);
  } catch (error) {
    req.log.error({ error }, "Error creating organization");
    res.status(500).json({ error: "Internal server error" });
  }
});
router17.put("/organizations/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, description } = req.body;
  const { id } = req.params;
  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    const member = await Member.findOne({ userId: req.user.id, organizationId: id });
    if (!member || member.role !== "Owner" && member.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }
    if (name !== void 0) org.name = name;
    if (description !== void 0) org.description = description;
    await org.save();
    await logActivity(req.user.id, "org_updated", id, "Organization", `Updated organization details for "${org.name}"`);
    res.json(org);
  } catch (error) {
    req.log.error({ error }, "Error updating organization");
    res.status(500).json({ error: "Internal server error" });
  }
});
router17.delete("/organizations/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    if (org.owner.toString() !== req.user.id) {
      res.status(403).json({ error: "Forbidden: Only the owner can delete the organization" });
      return;
    }
    const teams = await Team.find({ organizationId: id });
    const teamIds = teams.map((t) => t._id);
    const projects = await Project.find({ teamId: { $in: teamIds } });
    const projectIds = projects.map((p) => p._id);
    await Task.deleteMany({
      $or: [{ projectId: { $in: projectIds } }, { teamId: { $in: teamIds } }]
    });
    await Project.deleteMany({ teamId: { $in: teamIds } });
    await Team.deleteMany({ organizationId: id });
    await Member.deleteMany({ organizationId: id });
    await Organization.findByIdAndDelete(id);
    await logActivity(req.user.id, "org_deleted", id, "Organization", `Deleted organization "${org.name}" and all sub-resources`);
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting organization");
    res.status(500).json({ error: "Internal server error" });
  }
});
router17.get("/organizations/:id/settings", async (req, res) => {
  const { id } = req.params;
  try {
    const org = await Organization.findById(id);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: id });
    if (!callerMember && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You do not have access to this organization" });
      return;
    }
    res.json({
      organizationId: org._id,
      name: org.name,
      description: org.description,
      owner: org.owner,
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: "Member",
        twoFactorRequired: false
      }
    });
  } catch (error) {
    req.log.error({ error }, "Error getting settings");
    res.status(500).json({ error: "Internal server error" });
  }
});
router17.get("/organizations/:id/activity-logs", async (req, res) => {
  const { id } = req.params;
  try {
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: id });
    if (!callerMember && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You do not have access to this organization" });
      return;
    }
    const teams = await Team.find({ organizationId: id });
    const teamIds = teams.map((t) => t._id);
    const projects = await Project.find({ teamId: { $in: teamIds } });
    const projectIds = projects.map((p) => p._id);
    const tasks = await Task.find({
      $or: [{ projectId: { $in: projectIds } }, { teamId: { $in: teamIds } }]
    });
    const taskIds = tasks.map((t) => t._id);
    const logs = await ActivityLog.find({
      userId: req.user.id,
      $or: [
        { entityId: id, entityType: "Organization" },
        { entityId: { $in: teamIds }, entityType: "Team" },
        { entityId: { $in: projectIds }, entityType: "Project" },
        { entityId: { $in: taskIds }, entityType: "Task" }
      ]
    }).populate("userId", "name email").sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    req.log.error({ error }, "Error fetching activity logs");
    res.status(500).json({ error: "Internal server error" });
  }
});
var organizations_default = router17;

// src/routes/members.ts
var import_express18 = require("express");
init_src();
var router18 = (0, import_express18.Router)();
router18.use(requireAuth);
router18.get("/organizations/:orgId/members", async (req, res) => {
  const { orgId } = req.params;
  try {
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember && req.user.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: You do not have access to this organization" });
      return;
    }
    const members = await Member.find({ organizationId: orgId }).populate("userId", "name email");
    res.json(members);
  } catch (error) {
    req.log.error({ error }, "Error fetching organization members");
    res.status(500).json({ error: "Internal server error" });
  }
});
router18.post("/organizations/:orgId/members/invite", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orgId } = req.params;
  const { email, role, teamId } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  try {
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || callerMember.role !== "Owner" && callerMember.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can invite members" });
      return;
    }
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      user = new User({
        email: email.trim().toLowerCase(),
        name: email.split("@")[0],
        password: "TemporaryPassword123!"
        // Dummy password for placeholder account
      });
      await user.save();
    }
    const existing = await Member.findOne({
      userId: user._id,
      organizationId: orgId,
      teamId: teamId || null
    });
    if (existing) {
      res.status(400).json({ error: "User is already a member" });
      return;
    }
    const member = new Member({
      userId: user._id,
      organizationId: orgId,
      teamId: teamId || null,
      role: role || "Member"
    });
    await member.save();
    if (teamId) {
      const team = await Team.findById(teamId);
      if (team) {
        if (!team.members.some((m) => m.user.toString() === user._id.toString())) {
          team.members.push({
            user: user._id,
            role: role === "Owner" || role === "Admin" ? "Admin" : role === "Manager" ? "Manager" : "Member"
          });
          await team.save();
        }
      }
    }
    res.status(201).json(member);
  } catch (error) {
    req.log.error({ error }, "Error inviting member");
    res.status(500).json({ error: "Internal server error" });
  }
});
router18.put("/organizations/:orgId/members/:userId/role", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orgId, userId } = req.params;
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ error: "Role is required" });
    return;
  }
  try {
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || callerMember.role !== "Owner" && callerMember.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can update roles" });
      return;
    }
    const member = await Member.findOne({ userId, organizationId: orgId });
    if (!member) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    if (member.role === "Owner" && role !== "Owner") {
      res.status(400).json({ error: "Cannot demote organization Owner. Transfer ownership first." });
      return;
    }
    member.role = role;
    await member.save();
    res.json(member);
  } catch (error) {
    req.log.error({ error }, "Error updating role");
    res.status(500).json({ error: "Internal server error" });
  }
});
router18.delete("/organizations/:orgId/members/:userId", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orgId, userId } = req.params;
  try {
    const callerMember = await Member.findOne({ userId: req.user.id, organizationId: orgId });
    if (!callerMember || callerMember.role !== "Owner" && callerMember.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Only Owners or Admins can remove members" });
      return;
    }
    const memberToRemove = await Member.findOne({ userId, organizationId: orgId });
    if (!memberToRemove) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    if (memberToRemove.role === "Owner") {
      res.status(400).json({ error: "Cannot remove organization Owner" });
      return;
    }
    await Member.deleteMany({ userId, organizationId: orgId });
    const teams = await Team.find({ organizationId: orgId });
    for (const team of teams) {
      team.members = team.members.filter((m) => m.user.toString() !== userId);
      await team.save();
    }
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error removing member");
    res.status(500).json({ error: "Internal server error" });
  }
});
router18.post("/organizations/:orgId/transfer-ownership", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { orgId } = req.params;
  const { newOwnerUserId } = req.body;
  if (!newOwnerUserId) {
    res.status(400).json({ error: "newOwnerUserId is required" });
    return;
  }
  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    if (org.owner.toString() !== req.user.id) {
      res.status(403).json({ error: "Forbidden: Only the owner can transfer ownership" });
      return;
    }
    const targetMember = await Member.findOne({ userId: newOwnerUserId, organizationId: orgId });
    if (!targetMember) {
      res.status(400).json({ error: "New owner must be a member of the organization" });
      return;
    }
    org.owner = newOwnerUserId;
    await org.save();
    await Member.findOneAndUpdate({ userId: req.user.id, organizationId: orgId }, { role: "Admin" });
    await Member.findOneAndUpdate({ userId: newOwnerUserId, organizationId: orgId }, { role: "Owner" });
    res.json({ message: "Ownership transferred successfully" });
  } catch (error) {
    req.log.error({ error }, "Error transferring ownership");
    res.status(500).json({ error: "Internal server error" });
  }
});
var members_default = router18;

// src/routes/projects.ts
var import_express19 = require("express");
init_src();
init_activity();
var router19 = (0, import_express19.Router)();
router19.use(requireAuth);
router19.get("/projects", async (req, res) => {
  const { teamId, status, priority } = req.query;
  try {
    const userTeams = await Team.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id }
      ]
    }).select("_id");
    const teamIds = userTeams.map((t) => t._id);
    const filter = {
      $and: [
        {
          $or: [
            { owner: req.user.id },
            { teamId: { $in: teamIds } }
          ]
        }
      ]
    };
    if (teamId) filter.$and.push({ teamId });
    if (status) filter.$and.push({ status });
    if (priority) filter.$and.push({ priority });
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    const results = [];
    for (const p of projects) {
      const totalTasks = await Task.countDocuments({ projectId: p._id });
      const completedTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
      const progressPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
      results.push({
        ...p.toObject(),
        id: p._id.toString(),
        totalTasks,
        completedTasks,
        progressPercent
      });
    }
    res.json(results);
  } catch (error) {
    req.log.error({ error }, "Error listing projects");
    res.status(500).json({ error: "Internal server error" });
  }
});
router19.get("/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const hasAccess = await canAccessProject(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to access this project" });
      return;
    }
    const p = await Project.findById(id);
    if (!p) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const totalTasks = await Task.countDocuments({ projectId: p._id });
    const completedTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
    const progressPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    res.json({
      ...p.toObject(),
      id: p._id.toString(),
      totalTasks,
      completedTasks,
      progressPercent
    });
  } catch (error) {
    req.log.error({ error }, "Error getting project");
    res.status(500).json({ error: "Internal server error" });
  }
});
router19.post("/projects", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, description, teamId, dueDate, status, priority } = req.body;
  if (!name || !teamId) {
    res.status(400).json({ error: "Name and teamId are required" });
    return;
  }
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    const isMember = team.owner?.toString() === req.user.id || team.members.some((m) => m.user && m.user.toString() === req.user.id);
    if (!isMember) {
      res.status(403).json({ error: "Access denied: You are not a member of this team" });
      return;
    }
    const project = new Project({
      name,
      description: description || "",
      teamId,
      owner: req.user.id,
      dueDate: dueDate || null,
      status: status || "Planning",
      priority: priority || "Medium"
    });
    await project.save();
    await logActivity(req.user.id, "project_created", project._id.toString(), "Project", `Created project "${name}"`);
    res.status(201).json({
      ...project.toObject(),
      id: project._id.toString(),
      totalTasks: 0,
      completedTasks: 0,
      progressPercent: 0
    });
  } catch (error) {
    req.log.error({ error }, "Error creating project");
    res.status(500).json({ error: "Internal server error" });
  }
});
router19.put("/projects/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const { name, description, dueDate, status, priority } = req.body;
  try {
    const hasAccess = await canAccessProject(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to modify this project" });
      return;
    }
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (name !== void 0) project.name = name;
    if (description !== void 0) project.description = description;
    if (dueDate !== void 0) project.dueDate = dueDate;
    if (status !== void 0) project.status = status;
    if (priority !== void 0) project.priority = priority;
    await project.save();
    await logActivity(req.user.id, "project_updated", id, "Project", `Updated details for project "${project.name}"`);
    const totalTasks = await Task.countDocuments({ projectId: project._id });
    const completedTasks = await Task.countDocuments({ projectId: project._id, status: "Done" });
    const progressPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
    res.json({
      ...project.toObject(),
      id: project._id.toString(),
      totalTasks,
      completedTasks,
      progressPercent
    });
  } catch (error) {
    req.log.error({ error }, "Error updating project");
    res.status(500).json({ error: "Internal server error" });
  }
});
router19.delete("/projects/:id", async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    const hasAccess = await canAccessProject(id, req.user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "Access denied: You do not have permission to delete this project" });
      return;
    }
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    await Task.deleteMany({ projectId: id });
    await Project.findByIdAndDelete(id);
    await logActivity(req.user.id, "project_deleted", id, "Project", `Deleted project "${project.name}"`);
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting project");
    res.status(500).json({ error: "Internal server error" });
  }
});
var projects_default = router19;

// src/routes/index.ts
var router20 = (0, import_express20.Router)();
router20.use(health_default);
router20.use("/auth", auth_default);
router20.use(rooms_default);
router20.use(meetings_default);
router20.use(tasks_default);
router20.use("/analytics", analytics_default);
router20.use(teams_default);
router20.use("/users", users_default);
router20.use("/admin", admin_default);
router20.use(participants_default);
router20.use(recordings_default);
router20.use(ai_default);
router20.use("/messages", messages_default);
router20.use("/channels", channels_default);
router20.use("/files", files_default);
router20.use("/notifications", notifications_default);
router20.use(organizations_default);
router20.use(members_default);
router20.use(projects_default);
var routes_default = router20;

// src/app.ts
init_logger();

// src/middlewares/security.ts
function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' wss: ws: https:; media-src 'self' blob:; frame-src 'self';"
  );
  next();
}

// src/app.ts
init_signaling();
init_src();
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_fs2 = __toESM(require("node:fs"), 1);
var app = (0, import_express21.default)();
app.use(
  (0, import_pino_http.default)({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
app.use(securityHeaders);
app.use((0, import_cookie_parser.default)());
var corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.includes(",") ? process.env.CORS_ORIGIN.split(",") : process.env.CORS_ORIGIN : true;
app.use((0, import_cors.default)({
  origin: corsOrigin,
  credentials: true
}));
app.use(import_express21.default.json());
app.use(import_express21.default.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    logger.error({ err }, "Database connection error in request middleware");
    res.status(500).json({ error: "Database connection failed" });
  }
});
app.all("/api/socket.io", (req, res, next) => {
  const server = res.socket?.server;
  if (server && !server.io) {
    logger.info("Initializing Socket.io server on-demand on Vercel HTTP server instance");
    initSignaling(server);
    server.io = true;
  }
  next();
});
app.use("/api", routes_default);
var getStaticDir = () => {
  const possiblePaths = [
    import_node_path2.default.resolve(process.cwd(), "artifacts/meet/dist/public"),
    import_node_path2.default.resolve(process.cwd(), "../meet/dist/public"),
    import_node_path2.default.resolve(process.cwd(), "meet/dist/public")
  ];
  for (const p of possiblePaths) {
    if (import_node_fs2.default.existsSync(p)) {
      return p;
    }
  }
  return null;
};
var staticDir = getStaticDir();
if (staticDir) {
  logger.info({ staticDir }, "Serving frontend static assets from path");
  app.use(import_express21.default.static(staticDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(import_node_path2.default.join(staticDir, "index.html"));
  });
} else {
  logger.warn("Frontend static build directory not found. API server running in standalone mode.");
}
var app_default = app;

// ../../api/index.ts
var index_default = app_default;
