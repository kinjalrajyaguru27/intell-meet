import { connectDB, User, Meeting, Team, Invitation, Participant, Recording, MeetingChat, MeetingTranscript, MeetingSummary, ActionItem, MeetingInsight, Decision, Task, Message, Channel, Notification, FileModel, MeetingNotesVersion, mongoose } from "../lib/db/src";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("\n=================================================================");
  console.log("STARTING COMPLETE RUNTIME E2E VERIFICATION FOR FEATURES 4 & 5");
  console.log("=================================================================\n");

  // 1. Connect to Database
  process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";
  console.log("[DB] Connecting to database:", process.env.MONGODB_URI);
  await connectDB();
  console.log("[DB] Connected successfully.");

  // Clean up previous test data
  const testEmails = [
    "user_a_e2e@example.com",
    "user_b_e2e@example.com",
    "user_c_e2e@example.com",
  ];
  console.log("[DB] Cleaning up previous E2E test data...");
  const oldUsers = await User.find({ email: { $in: testEmails } });
  const oldUserIds = oldUsers.map((u) => u._id);

  await User.deleteMany({ email: { $in: testEmails } });
  await Team.deleteMany({ "members.user": { $in: oldUserIds } });
  await Invitation.deleteMany({ email: { $in: testEmails } });
  await Message.deleteMany({ sender: { $in: oldUserIds } });
  await Channel.deleteMany({});
  await Notification.deleteMany({ recipient: { $in: oldUserIds } });
  await FileModel.deleteMany({ uploadedBy: { $in: oldUserIds } });
  await MeetingNotesVersion.deleteMany({ author: { $in: oldUserIds } });

  const oldMeetings = await Meeting.find({ host: { $in: oldUserIds } });
  const oldMeetingIds = oldMeetings.map((m) => m._id);
  await Meeting.deleteMany({ _id: { $in: oldMeetingIds } });
  await Participant.deleteMany({ user: { $in: oldUserIds } });
  await Recording.deleteMany({ meeting: { $in: oldMeetingIds } });
  await MeetingChat.deleteMany({ sender: { $in: oldUserIds } });
  await MeetingTranscript.deleteMany({ meetingId: { $in: oldMeetingIds } });
  await MeetingSummary.deleteMany({ meetingId: { $in: oldMeetingIds } });
  await ActionItem.deleteMany({ meetingId: { $in: oldMeetingIds } });
  await MeetingInsight.deleteMany({ meetingId: { $in: oldMeetingIds } });
  await Decision.deleteMany({ meetingId: { $in: oldMeetingIds } });
  await Task.deleteMany({ assignee: { $in: oldUserIds } });

  console.log("[DB] Cleanup completed.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: REGISTER & AUTHENTICATE 3 USERS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Auth] Registering User A, User B, and User C...");

  const registerUser = async (name: string, email: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: "Password123!", role: "Member" }),
    });
    if (!res.ok) throw new Error(`Registration failed for ${email}`);
    return await res.json();
  };

  const loginUser = async (email: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Password123!" }),
    });
    if (!res.ok) throw new Error(`Login failed for ${email}`);
    return await res.json();
  };

  const userA = await registerUser("User A", "user_a_e2e@example.com");
  const userB = await registerUser("User B", "user_b_e2e@example.com");
  const userC = await registerUser("User C", "user_c_e2e@example.com");

  const authA = await loginUser("user_a_e2e@example.com");
  const authB = await loginUser("user_b_e2e@example.com");
  const authC = await loginUser("user_c_e2e@example.com");

  console.log("[Auth] Registration & Authentications verified successfully.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: ONLINE PRESENCE & SOCKET CONNECTIONS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Presence] Testing real-time online presence mappings...");

  const connectSocket = (token: string) => {
    return io(SOCKET_URL, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });
  };

  const socketA = connectSocket(authA.token);
  const socketB = connectSocket(authB.token);
  const socketC = connectSocket(authC.token);

  await sleep(1000); // Wait for socket connection triggers

  // Set User C to "away" presence
  let presenceChangedReceived = false;
  socketA.on("presence-changed", (data: any) => {
    if (data.userId === userC.user.id && data.status === "away") {
      presenceChangedReceived = true;
    }
  });

  socketC.emit("update-presence", { status: "away" });
  await sleep(1000);

  if (!presenceChangedReceived) {
    throw new Error("Socket.io presence change broadcast was not received!");
  }
  console.log("[Presence] User status updates & presence broadcasts work!\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3: DIRECT MESSAGING & TYPING & READ RECEIPTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Chat] Testing 1-on-1 private Direct Messages...");

  let dmReceivedText = "";
  let typingIndicatorReceived = false;
  let readUpdateReceived = false;
  let testMsgId = "";

  socketB.on("direct-message", (msg: any) => {
    dmReceivedText = msg.text;
    testMsgId = msg._id;
  });

  socketB.on("typing-indicator", (data: any) => {
    if (data.userId === userA.user.id && data.isTyping === true) {
      typingIndicatorReceived = true;
    }
  });

  socketA.on("messages-read-update", (data: any) => {
    if (data.messageIds.includes(testMsgId) && data.readBy === userB.user.id) {
      readUpdateReceived = true;
    }
  });

  // A typing indicator
  socketA.emit("typing-indicator", { recipientId: userB.user.id, isTyping: true });
  await sleep(500);

  // A sends DM
  socketA.emit("send-direct-message", { recipientId: userB.user.id, text: "Hello User B! Let's schedule the sync." });
  await sleep(1000);

  if (dmReceivedText !== "Hello User B! Let's schedule the sync.") {
    throw new Error("Direct Message was not routed to recipient!");
  }
  if (!typingIndicatorReceived) {
    throw new Error("Typing indicators are not working!");
  }

  // B reads message
  socketB.emit("message-read", { messageIds: [testMsgId], senderId: userA.user.id });
  await sleep(1000);

  if (!readUpdateReceived) {
    throw new Error("Message read receipt updates are not working!");
  }

  console.log("[Chat] DM routing, typing, and read receipts passed.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: WORKSPACE TEAMS & COLLABORATIVE CHANNELS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Workspace] Testing teams setup & channels invitation flow...");

  // A creates Team
  const teamRes = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ name: "E2E Dev Team" }),
  });
  const teamData = await teamRes.json();
  if (teamRes.status !== 201) throw new Error("Team creation failed!");

  // A invites B to team (confirmation workflow)
  const inviteRes = await fetch(`${API_URL}/team/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ email: "user_b_e2e@example.com", teamId: teamData.id, role: "Member" }),
  });
  const inviteData = await inviteRes.json();
  if (inviteRes.status !== 200) throw new Error("Team invite dispatch failed!");

  // B accepts invite
  const acceptRes = await fetch(`${API_URL}/team/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authB.token}`,
    },
    body: JSON.stringify({ token: inviteData.invitation.token }),
  });
  if (acceptRes.status !== 200) throw new Error("Team invite accept failed!");

  // A creates channel in Team
  const chanRes = await fetch(`${API_URL}/channels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ name: "development", description: "Tech stack code reviews", teamId: teamData.id }),
  });
  const chanData = await chanRes.json();
  if (chanRes.status !== 201) throw new Error("Channel creation failed!");

  // Users join channel room on sockets
  socketA.emit("join-channel", { channelId: chanData._id });
  socketB.emit("join-channel", { channelId: chanData._id });

  let channelMsgText = "";
  socketB.on("channel-message", (msg: any) => {
    channelMsgText = msg.text;
  });

  socketA.emit("send-channel-message", { channelId: chanData._id, text: "Welcome to #development channel!" });
  await sleep(1000);

  if (channelMsgText !== "Welcome to #development channel!") {
    throw new Error("Channel group messaging not routed correctly!");
  }
  console.log("[Workspace] Teams creation, invitation confirmation, and channels work.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: FILE STREAM UPLOAD & DOWNLOAD
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[File] Testing local multipart-free streaming file uploads & downloads...");

  // B uploads a mock PDF file
  const mockFileContent = "Sample mock PDF document contents for E2E file sharing verification.";
  const fileUploadRes = await fetch(`${API_URL}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authB.token}`,
      "Content-Type": "application/pdf",
      "x-filename": "report.pdf",
      "x-channel-id": chanData._id,
    },
    body: mockFileContent,
  });
  const fileObj = await fileUploadRes.json();
  if (fileUploadRes.status !== 201) throw new Error("File upload failed!");
  console.log(`- Uploaded metadata in DB: ${fileObj.filename}, mime: ${fileObj.mimeType}, size: ${fileObj.sizeBytes} bytes`);

  // A downloads file
  const downloadRes = await fetch(`${SOCKET_URL}${fileObj.fileUrl}`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const downloadedText = await downloadRes.text();
  if (downloadedText !== mockFileContent) {
    throw new Error("Downloaded file contents do not match uploaded data!");
  }
  console.log("- Download file verified successfully.");

  // Test directory traversal prevention safety
  const badDownload = await fetch(`${API_URL}/files/download/..%2F..%2Fpackage.json`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  console.log(`- Path traversal download status (should be 400): ${badDownload.status}`);
  if (badDownload.status !== 400) {
    throw new Error("Arbitrary file download safety protection failed!");
  }
  console.log("[File] File streaming and security policies validation passed.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: LOBBY WAITLIST & RTC PEER SIGNALING
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Meeting] Testing waitlist-guarded meeting and signaling...");

  // Host A creates meeting with waitlist
  const meetingRes = await fetch(`${API_URL}/meetings/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({
      title: "Quarterly Review",
      description: "Sprint velocity audit",
      waitingRoomEnabled: true,
    }),
  });
  const meetingData = await meetingRes.json();
  if (meetingRes.status !== 201) throw new Error("Meeting creation failed!");

  // Host A joins
  socketA.emit("join-room", {
    roomId: meetingData.roomId,
    userId: userA.user.id,
    displayName: userA.user.name,
  });

  // Guest B joins (should wait)
  let statusB = "";
  socketB.on("waiting-room-status", ({ status }: any) => {
    statusB = status;
    if (status === "admitted") {
      socketB.emit("join-room", {
        roomId: meetingData.roomId,
        userId: userB.user.id,
        displayName: userB.user.name,
      });
    }
  });

  socketB.emit("join-room", {
    roomId: meetingData.roomId,
    userId: userB.user.id,
    displayName: userB.user.name,
  });

  await sleep(1000);
  if (statusB !== "waiting") {
    throw new Error("Guest B was not placed in waiting room lobby!");
  }
  console.log("- Guest B placed in lobby successfully.");

  // Guest C joins (should wait)
  let statusC = "";
  socketC.on("waiting-room-status", ({ status }: any) => {
    statusC = status;
  });

  socketC.emit("join-room", {
    roomId: meetingData.roomId,
    userId: userC.user.id,
    displayName: userC.user.name,
  });

  await sleep(1000);

  // Host A admits Guest B
  socketA.emit("admit-user", { roomId: meetingData.roomId, userId: userB.user.id });
  await sleep(1000);

  if (statusB !== "admitted") {
    throw new Error("Host failed to admit Guest B!");
  }
  console.log("- Guest B successfully admitted to room.");

  // Host A rejects Guest C
  socketA.emit("reject-user", { roomId: meetingData.roomId, userId: userC.user.id });
  await sleep(1000);

  if (statusC !== "rejected") {
    throw new Error("Host failed to reject Guest C!");
  }
  console.log("- Guest C successfully rejected from room.");

  // Users A & B exchange WebRTC signaling events
  let offerReceived = false;
  socketB.on("offer", ({ offer }: any) => {
    if (offer.sdp === "mock-sdp-offer") {
      offerReceived = true;
    }
  });

  socketA.emit("offer", { to: userB.user.id, offer: { type: "offer", sdp: "mock-sdp-offer" } });
  await sleep(1000);

  if (!offerReceived) {
    throw new Error("WebRTC signaling offer routing failed!");
  }

  // Transcripts exchange
  socketB.emit("transcription-chunk", { text: "We need to verify the database connection parameters" });
  socketA.emit("transcription-chunk", { text: "I will polish the CSS layouts" });
  await sleep(1000);

  console.log("[Meeting] Waitlist lobby, WebRTC signaling, and speech logging verified.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 7: SHARED NOTES MULTI-VERSION EDITS & RESTORE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Notes] Testing collaborative notes checkpoint versioning...");

  const updateNotes = async (content: string) => {
    const res = await fetch(`${API_URL}/meetings/${meetingData.id}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authA.token}`,
      },
      body: JSON.stringify({ content }),
    });
    return await res.json();
  };

  // Edit notes version 1
  await updateNotes("Version 1 draft - items checklist");
  await sleep(500);

  // Edit notes version 2
  await updateNotes("Version 2 copy - final review");
  await sleep(500);

  // Fetch version checkpoints
  const verRes = await fetch(`${API_URL}/meetings/${meetingData.id}/notes/versions`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const versions = await verRes.json();
  console.log(`- Notes versions compiled in database: ${versions.length}`);
  if (versions.length < 2) {
    throw new Error("Notes version checkpoints were not persisted!");
  }

  // Restore notes to version 1
  const restoreRes = await fetch(`${API_URL}/meetings/${meetingData.id}/notes/restore`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ versionId: versions[1]._id }), // Second element in desc sort is v1
  });
  const restoredObj = await restoreRes.json();
  if (restoredObj.content !== "Version 1 draft - items checklist") {
    throw new Error(`Notes restoration failed! Content is: "${restoredObj.content}"`);
  }
  console.log("- Reverted/restored notes checkpoint version successfully.");
  console.log("[Notes] Shared notes checkpoints & rollback restore verified.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 8: COMPILING POST-MEETING AI REPORTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[AI] Compiling post-meeting intelligence summaries...");

  // Host A starts recording
  await fetch(`${API_URL}/recordings/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ meetingId: meetingData.roomId, title: "Quarterly Session" }),
  });
  await sleep(500);

  // Host A stops recording
  await fetch(`${API_URL}/recordings/stop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({ meetingId: meetingData.roomId, durationSeconds: 60, sizeBytes: 1500000 }),
  });

  // End meeting
  const endMeetingRes = await fetch(`${API_URL}/rooms/${meetingData.roomId}/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authA.token}`,
    },
    body: JSON.stringify({
      participantNames: ["User A", "User B"],
      durationSeconds: 120,
    }),
  });
  if (endMeetingRes.status !== 200) throw new Error("End meeting request failed!");

  console.log("- Waiting for background AI generation compilation...");
  await sleep(4000); // Allow async AI compile tasks to execute

  // Query DB collections to assert AI insights
  const meetingObjectId = new mongoose.Types.ObjectId(meetingData.id);
  const dbRecording = await Recording.findOne({ meeting: meetingObjectId });
  if (!dbRecording) throw new Error("Recording record missing in DB!");
  console.log("- Verified recording document exists in MongoDB.");

  const dbSummaries = await MeetingSummary.find({ meetingId: meetingObjectId });
  if (dbSummaries.length === 0) throw new Error("Meeting summaries missing in DB!");
  console.log(`- Verified ${dbSummaries.length} AI summaries generated in MongoDB.`);

  const dbActionItems = await ActionItem.find({ meetingId: meetingObjectId });
  if (dbActionItems.length === 0) throw new Error("Action items missing in DB!");
  console.log(`- Verified ${dbActionItems.length} AI action items extracted.`);

  const dbDecisions = await Decision.find({ meetingId: meetingObjectId });
  if (dbDecisions.length === 0) throw new Error("Decisions missing in DB!");
  console.log(`- Verified ${dbDecisions.length} Decisions extracted.`);

  const dbTasks = await Task.find({ assignee: userB.user.id });
  console.log(`- Synced Kanban Tasks found in database: ${dbTasks.length}`);
  if (dbTasks.length === 0) throw new Error("Kanban Board tasks sync failed!");

  // Verify task assignment notification was created in DB for user B
  const dbNotifs = await Notification.find({ recipient: userB.user.id, type: "task_assignment" });
  console.log(`- Real-time Notifications dispatched for task assignments: ${dbNotifs.length}`);
  if (dbNotifs.length === 0) throw new Error("Real-time notifications logs missing!");

  console.log("[AI] Post-meeting analysis successfully compiled.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 9: DASHBOARD REST QUERIES
  // ──────────────────────────────────────────────────────────────────────────
  console.log("[Dashboard] Querying dashboard REST endpoints...");

  // Search meetings
  const searchMeetingsRes = await fetch(`${API_URL}/meetings`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const searchMeetings = await searchMeetingsRes.json();
  if (searchMeetings.length === 0) throw new Error("Conferences search history empty!");
  console.log(`- Search history returned ${searchMeetings.length} meetings.`);

  // Analytics Insights
  const analyticsRes = await fetch(`${API_URL}/analytics/insights`, {
    headers: { Authorization: `Bearer ${authA.token}` },
  });
  const analytics = await analyticsRes.json();
  console.log("- Analytics insights returned:", JSON.stringify(analytics));
  if (!analytics.productivity || !analytics.engagement) {
    throw new Error("Analytics insights schema missing components!");
  }

  console.log("[Dashboard] REST queries verified successfully.\n");

  // Cleanup sockets
  socketA.disconnect();
  socketB.disconnect();
  socketC.disconnect();

  // Close DB
  await mongoose.connection.close();

  console.log("=================================================================");
  console.log("SUCCESS: ALL RUNTIME END-TO-END VERIFICATION PASSES COMPLETED!");
  console.log("=================================================================\n");
}

main().catch((err) => {
  console.error("\n=================================================================");
  console.log("FAILURE: VERIFICATION ENCOUNTERED ERRORS!");
  console.log("=================================================================");
  console.error(err);
  process.exit(1);
});
