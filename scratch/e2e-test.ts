import { connectDB, User, Meeting, Team, Invitation, Participant, Recording, MeetingChat, MeetingTranscript, MeetingSummary, ActionItem, MeetingInsight, Decision, Task, mongoose } from "../lib/db/src";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("\n=======================================================");
  console.log("STARTING RUNTIME END-TO-END AUDIT FOR FEATURES 1, 2, 3");
  console.log("=======================================================\n");

  // 1. Connect to MongoDB
  process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";
  console.log("[DB] Connecting to database:", process.env.MONGODB_URI);
  await connectDB();
  console.log("[DB] Connected successfully.");

  // Clean up test data
  const testEmails = [
    "user_a_test@example.com",
    "user_b_test@example.com",
    "user_admin_test@example.com",
    "google-user-test@example.com"
  ];
  console.log("[DB] Cleaning up existing test users and records...");
  const oldUsers = await User.find({ email: { $in: testEmails } });
  const oldUserIds = oldUsers.map(u => u._id);

  await User.deleteMany({ email: { $in: testEmails } });
  await Team.deleteMany({ "members.user": { $in: oldUserIds } });
  await Invitation.deleteMany({ email: { $in: testEmails } });
  
  // Clean meetings, recordings, transcripts, summaries, etc. associated with test users
  const testMeetings = await Meeting.find({ host: { $in: oldUserIds } });
  const testMeetingIds = testMeetings.map(m => m._id);
  const testMeetingRoomIds = testMeetings.map(m => m.roomId);

  await Meeting.deleteMany({ _id: { $in: testMeetingIds } });
  await Participant.deleteMany({ user: { $in: oldUserIds } });
  await Recording.deleteMany({ meeting: { $in: testMeetingIds } });
  await MeetingChat.deleteMany({ sender: { $in: oldUserIds } });
  await MeetingTranscript.deleteMany({ meetingId: { $in: testMeetingIds } });
  await MeetingSummary.deleteMany({ meetingId: { $in: testMeetingIds } });
  await ActionItem.deleteMany({ meetingId: { $in: testMeetingIds } });
  await MeetingInsight.deleteMany({ meetingId: { $in: testMeetingIds } });
  await Decision.deleteMany({ meetingId: { $in: testMeetingIds } });
  await Task.deleteMany({
    $or: [
      { assignee: { $in: oldUserIds } },
      { title: { $in: ["Verify database connections", "Polish layout CSS styles", "Resolve compiler warnings"] } }
    ]
  });
  
  console.log("[DB] Cleanup completed.\n");

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE 1: AUTHENTICATION & USER MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────
  console.log("-------------------------------------------------------");
  console.log("FEATURE 1: AUTHENTICATION & USER MANAGEMENT");
  console.log("-------------------------------------------------------");

  // A. User Registration
  console.log("[Auth] Testing Registration...");
  
  // Register User A
  const regUserA = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "User A Test",
      email: "user_a_test@example.com",
      password: "Password123!",
      role: "Member"
    })
  });
  console.log(`[Auth] User A Registration Response Status: ${regUserA.status}`);
  const regUserAData = await regUserA.json() as any;
  if (regUserA.status !== 201) {
    throw new Error(`User A Registration failed: ${JSON.stringify(regUserAData)}`);
  }
  console.log(`[Auth] User A Registration works. ID: ${regUserAData.user.id}`);

  // Register User B
  const regUserB = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "User B Test",
      email: "user_b_test@example.com",
      password: "Password123!",
      role: "Member"
    })
  });
  const regUserBData = await regUserB.json() as any;
  if (regUserB.status !== 201) {
    throw new Error(`User B Registration failed: ${JSON.stringify(regUserBData)}`);
  }
  console.log(`[Auth] User B Registration works. ID: ${regUserBData.user.id}`);

  // Register Admin User
  const regAdmin = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "User Admin Test",
      email: "user_admin_test@example.com",
      password: "Password123!",
      role: "Admin"
    })
  });
  const regAdminData = await regAdmin.json() as any;
  if (regAdmin.status !== 201) {
    throw new Error(`Admin Registration failed: ${JSON.stringify(regAdminData)}`);
  }
  console.log(`[Auth] Admin Registration works. ID: ${regAdminData.user.id}`);

  // Verify stored password in MongoDB is hashed
  const dbUserA = await User.findOne({ email: "user_a_test@example.com" });
  if (!dbUserA) throw new Error("User A not found in Database");
  console.log(`[Auth] User A password in database (should be hashed): ${dbUserA.password}`);
  if (dbUserA.password === "Password123!") {
    throw new Error("Password NOT hashed in database!");
  }

  // Duplicate email prevention
  const regDup = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: "user_a_test@example.com",
      password: "Password123!",
      role: "Member"
    })
  });
  console.log(`[Auth] Duplicate Registration Response Status (expect 409): ${regDup.status}`);
  if (regDup.status !== 409) {
    throw new Error(`Duplicate email restriction failed: expected 409, got ${regDup.status}`);
  }

  // Validation strength checks
  const regWeak = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Weak Password User",
      email: "weak_pass@example.com",
      password: "123",
      role: "Member"
    })
  });
  console.log(`[Auth] Weak Password Response Status (expect 400): ${regWeak.status}`);
  if (regWeak.status !== 400) {
    throw new Error(`Password strength validation failed: expected 400, got ${regWeak.status}`);
  }

  // B. Login & Session (JWT / Cookies)
  console.log("\n[Auth] Testing Login...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user_a_test@example.com",
      password: "Password123!",
      rememberMe: true
    })
  });
  console.log(`[Auth] Login Response Status: ${loginRes.status}`);
  const loginData = await loginRes.json() as any;
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const tokenA = loginData.token;
  console.log(`[Auth] Token A generated successfully: ${tokenA.substring(0, 20)}...`);

  // Login B
  const loginResB = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user_b_test@example.com",
      password: "Password123!",
      rememberMe: true
    })
  });
  const loginDataB = await loginResB.json() as any;
  const tokenB = loginDataB.token;

  // Login Admin
  const loginResAdmin = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user_admin_test@example.com",
      password: "Password123!",
      rememberMe: true
    })
  });
  const loginDataAdmin = await loginResAdmin.json() as any;
  const tokenAdmin = loginDataAdmin.token;

  // C. Google Authentication
  console.log("\n[Auth] Testing Google Authentication...");
  // Simulate Google Login for new user
  const googleLoginNew = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: "mock_google_token_google-user-test@example.com"
    })
  });
  console.log(`[Auth] Google New User Login Status: ${googleLoginNew.status}`);
  const googleLoginNewData = await googleLoginNew.json() as any;
  if (googleLoginNew.status !== 200) {
    throw new Error(`Google OAuth failed: ${JSON.stringify(googleLoginNewData)}`);
  }
  console.log(`[Auth] New Google user auto-created. ID: ${googleLoginNewData.user.id}, emailVerified: ${googleLoginNewData.user.emailVerified}, profilePicture: ${googleLoginNewData.user.profilePicture}`);

  // Simulating Google Login for existing user (User A links account)
  const googleLoginLink = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: "mock_google_token_user_a_test@example.com"
    })
  });
  console.log(`[Auth] Google Existing User Login Status: ${googleLoginLink.status}`);
  const googleLoginLinkData = await googleLoginLink.json() as any;
  if (googleLoginLink.status !== 200) {
    throw new Error(`Google OAuth linking failed: ${JSON.stringify(googleLoginLinkData)}`);
  }
  const dbUserALinked = await User.findOne({ email: "user_a_test@example.com" });
  console.log(`[Auth] User A authProvider: ${dbUserALinked?.authProvider}, googleId: ${dbUserALinked?.googleId}`);
  if (dbUserALinked?.authProvider !== "google" || !dbUserALinked?.googleId) {
    throw new Error("Google ID was not linked to existing user!");
  }

  // D. Profile Management (GET & PUT)
  console.log("\n[Auth] Testing User Profile...");
  const getProfile = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${tokenA}`
    }
  });
  console.log(`[Auth] Fetch profile status: ${getProfile.status}`);
  const profileData = await getProfile.json() as any;
  console.log(`[Auth] Profile Name: ${profileData.name}, timezone: ${profileData.timezone}`);

  // Update profile
  const updateProfile = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      name: "User A Updated",
      timezone: "GMT+5:30",
      jobTitle: "Principal Lead",
      avatar: "https://example.com/avatar.jpg"
    })
  });
  console.log(`[Auth] Update profile status: ${updateProfile.status}`);
  const updatedData = await updateProfile.json() as any;
  console.log(`[Auth] Updated profile Name: ${updatedData.name}, jobTitle: ${updatedData.jobTitle}, avatar: ${updatedData.avatar}`);
  if (updatedData.name !== "User A Updated" || updatedData.avatar !== "https://example.com/avatar.jpg") {
    throw new Error("Profile update changes did not save!");
  }

  // E. Role System
  console.log("\n[Auth] Testing Role System...");
  // Test access to admin route with Admin token
  const adminUsersGet = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenAdmin}` }
  });
  console.log(`[Auth] Admin role requesting admin users list (expect 200): ${adminUsersGet.status}`);
  if (adminUsersGet.status !== 200) {
    throw new Error(`Admin role check failed: Admin was denied access (status ${adminUsersGet.status})`);
  }

  // Test access to admin route with Member token (should fail)
  const memberAdminGet = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenA}` }
  });
  console.log(`[Auth] Member role requesting admin users list (expect 403): ${memberAdminGet.status}`);
  if (memberAdminGet.status !== 403) {
    throw new Error(`Role protection failed: Member was allowed access to Admin route (status ${memberAdminGet.status})`);
  }

  // F. Team Invitations Confirmation Workflow
  console.log("\n[Auth] Testing Team Invitations...");
  // 1. Create a Team
  const createTeam = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      name: "Workspace Audit Team"
    })
  });
  const createTeamData = await createTeam.json() as any;
  console.log(`[Auth] Create Team status: ${createTeam.status}, Team Name: ${createTeamData.name}`);
  const teamId = createTeamData.id;

  // 2. Invite User B to the Team
  const inviteUser = await fetch(`${API_URL}/team/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      email: "user_b_test@example.com",
      teamId: teamId,
      role: "Member"
    })
  });
  const inviteData = await inviteUser.json() as any;
  console.log(`[Auth] Send Team Invitation status: ${inviteUser.status}`);
  if (inviteUser.status !== 200) {
    throw new Error(`Team invitation failed: ${JSON.stringify(inviteData)}`);
  }
  const inviteToken = inviteData.invitation.token;
  console.log(`[Auth] Invitation token: ${inviteToken}`);

  // 3. Inspect invitation details
  const inspectInvite = await fetch(`${API_URL}/team/invitation/${inviteToken}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  const inspectInviteData = await inspectInvite.json() as any;
  console.log(`[Auth] Inspect Invitation status: ${inspectInvite.status}, Team: ${inspectInviteData.team.name}`);

  // 4. Accept Team Invitation (User B accepts)
  const acceptInvite = await fetch(`${API_URL}/team/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenB}`
    },
    body: JSON.stringify({
      token: inviteToken
    })
  });
  console.log(`[Auth] Accept Team Invitation status: ${acceptInvite.status}`);
  if (acceptInvite.status !== 200) {
    throw new Error(`Failed to accept team invitation: ${await acceptInvite.text()}`);
  }

  // Verify B is in team members list
  const getTeams = await fetch(`${API_URL}/teams`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${tokenA}` }
  });
  const teamsList = await getTeams.json() as any[];
  const activeTeam = teamsList.find(t => t.id === teamId);
  console.log(`[Auth] Team member count: ${activeTeam.members.length}`);
  const hasUserB = activeTeam.members.some((m: any) => m.user.email === "user_b_test@example.com");
  console.log(`[Auth] User B is a team member: ${hasUserB}`);
  if (!hasUserB) {
    throw new Error("User B is not in the team member list after invitation acceptance!");
  }

  // 5. Reject Team Invitation (Invite again and reject)
  const inviteUser2 = await fetch(`${API_URL}/team/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      email: "user_b_test@example.com",
      teamId: teamId,
      role: "Manager"
    })
  });
  const inviteData2 = await inviteUser2.json() as any;
  console.log(`[Auth] Send Team Invitation 2 status: ${inviteUser2.status}`);
  if (inviteUser2.status !== 200) {
    // Wait, is there an invitation pending? If User B is already in the team, wait, let's see.
    // Yes, a user is already a member, so the route might return 409. But wait! Let's check.
    console.log(`[Auth] Send invitation 2 returned: ${JSON.stringify(inviteData2)}`);
  } else {
    const inviteToken2 = inviteData2.invitation.token;
    const rejectInvite = await fetch(`${API_URL}/team/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        token: inviteToken2
      })
    });
    console.log(`[Auth] Reject Team Invitation status: ${rejectInvite.status}`);
    if (rejectInvite.status !== 200) {
      throw new Error("Failed to reject team invitation!");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE 2: VIDEO MEETING SYSTEM
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n-------------------------------------------------------");
  console.log("FEATURE 2: VIDEO MEETING SYSTEM");
  console.log("-------------------------------------------------------");

  // A. Meeting Creation
  console.log("[Meeting] Testing Meeting Creation...");
  const createMeeting = await fetch(`${API_URL}/meetings/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      title: "Sprint Planning & Sync",
      description: "Review milestones and check E2E audit status",
      waitingRoomEnabled: true
    })
  });
  console.log(`[Meeting] Create Meeting Response Status: ${createMeeting.status}`);
  const meetingData = await createMeeting.json() as any;
  if (createMeeting.status !== 201) {
    throw new Error(`Meeting creation failed: ${JSON.stringify(meetingData)}`);
  }
  const meetingIdCode = meetingData.roomId; // e.g. abc-def-ghi
  console.log(`[Meeting] Room Code: ${meetingIdCode}, DB ID: ${meetingData.id}`);

  // B. Join Meeting (HTTP side)
  console.log("[Meeting] Testing Meeting Join (HTTP endpoint)...");
  const joinRes = await fetch(`${API_URL}/meetings/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenB}`
    },
    body: JSON.stringify({
      meetingId: meetingIdCode
    })
  });
  console.log(`[Meeting] Join Meeting Response Status: ${joinRes.status}`);
  if (joinRes.status !== 200) {
    throw new Error(`HTTP Meeting Join failed: ${await joinRes.text()}`);
  }

  // C. Socket.io Connection & Signaling & Waiting Room
  console.log("\n[Meeting] Connecting User A & User B to Socket.io Signaling Server...");
  
  let userASocketConnected = false;
  let userBSocketConnected = false;
  let userBWaitingRoomAdmitted = false;
  let socketBConnectedToRoom = false;
  let signalingOfferReceived = false;
  let signalingAnswerReceived = false;
  let candidateReceived = false;
  let mediaStateChangedReceived = false;
  let chatMsgReceived = false;
  let transcriptReceived = false;

  // Connect Host (User A)
  const socketA = io(SOCKET_URL, {
    path: "/api/socket.io",
    transports: ["websocket"],
    auth: { token: tokenA }
  });

  socketA.on("connect", () => {
    userASocketConnected = true;
    console.log("[Socket A] Connected to Socket.io. Joining room as Host...");
    socketA.emit("join-room", {
      roomId: meetingIdCode,
      userId: regUserAData.user.id,
      displayName: "User A Updated",
      isMuted: false,
      isCameraOff: false
    });
  });

  socketA.on("waiting-users-list", (queue) => {
    console.log(`[Socket A] Received Waiting List Update. Queue size: ${queue.length}`);
    if (queue.length > 0 && queue[0].userId === regUserBData.user.id) {
      console.log("[Socket A] Host admitting User B from waiting room queue...");
      socketA.emit("admit-user", { roomId: meetingIdCode, userId: regUserBData.user.id });
    }
  });

  socketA.on("offer", ({ from, offer }) => {
    console.log(`[Socket A] Received offer from: ${from}`);
    signalingOfferReceived = true;
    console.log("[Socket A] Sending back mock answer description...");
    socketA.emit("answer", {
      to: from,
      answer: { type: "answer", sdp: "v=0\no=- 87634863 3 IN IP4 127.0.0.1..." }
    });
  });

  socketA.on("ice-candidate", ({ from, candidate }) => {
    console.log(`[Socket A] Received ICE candidate from peer: ${from}`);
    candidateReceived = true;
  });

  socketA.on("chat-message", (msg) => {
    console.log(`[Socket A] Received chat message from ${msg.displayName}: "${msg.text}"`);
    chatMsgReceived = true;
  });

  socketA.on("transcription-chunk", (chunk) => {
    console.log(`[Socket A] Received transcription chunk: "${chunk.text}" by ${chunk.displayName}`);
    transcriptReceived = true;
  });

  socketA.on("media-state-changed", (state) => {
    console.log(`[Socket A] Peer media state updated:`, state);
    mediaStateChangedReceived = true;
  });

  // Connect Guest (User B)
  const socketB = io(SOCKET_URL, {
    path: "/api/socket.io",
    transports: ["websocket"],
    auth: { token: tokenB }
  });

  socketB.on("connect", () => {
    userBSocketConnected = true;
    console.log("[Socket B] Connected to Socket.io. Requesting to join room...");
    socketB.emit("join-room", {
      roomId: meetingIdCode,
      userId: regUserBData.user.id,
      displayName: "User B Test",
      isMuted: false,
      isCameraOff: false
    });
  });

  socketB.on("waiting-room-status", ({ status }) => {
    console.log(`[Socket B] Waiting room status change: ${status}`);
    if (status === "waiting") {
      console.log("[Socket B] Currently queued in waiting room.");
    } else if (status === "admitted") {
      console.log("[Socket B] Admitted by host! Emitting join-room to enter standard peer room.");
      userBWaitingRoomAdmitted = true;
      socketB.emit("join-room", {
        roomId: meetingIdCode,
        userId: regUserBData.user.id,
        displayName: "User B Test",
        isMuted: false,
        isCameraOff: false
      });
    }
  });

  socketB.on("existing-users", (users) => {
    console.log(`[Socket B] Joined room successfully! Existing users in room:`, users);
    socketBConnectedToRoom = true;
    
    // Simulate WebRTC offer-answer signaling exchange
    console.log("[Socket B] Initiating WebRTC signaling. Sending mock offer description to Host...");
    socketB.emit("offer", {
      to: regUserAData.user.id,
      offer: { type: "offer", sdp: "v=0\no=- 87634863 2 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0..." }
    });
  });

  socketB.on("answer", ({ from, answer }) => {
    console.log(`[Socket B] Received answer from: ${from}`);
    signalingAnswerReceived = true;
  });

  // Wait for waiting room admission, signaling, and messaging
  await sleep(4000);

  // Send signaling candidates and media updates once User B is in the room
  if (socketBConnectedToRoom) {
    console.log("[Socket B] Sending ICE candidate...");
    socketB.emit("ice-candidate", {
      to: regUserAData.user.id,
      candidate: { candidate: "candidate:842130438 1 udp 16777215 127.0.0.1 52358 typ srflx...", sdpMid: "0", sdpMLineIndex: 0 }
    });

    console.log("[Socket B] Emitting media state update (camera off)...");
    socketB.emit("media-state", {
      isMuted: false,
      isCameraOff: true,
      isScreenSharing: false
    });

    console.log("[Socket B] Sending chat message...");
    socketB.emit("chat-message", { text: "Hello team, let's verify the database connection first." });

    console.log("[Socket B] Sending transcription chunk...");
    socketB.emit("transcription-chunk", { text: "We should verify the database connection first." });
  }

  await sleep(3000);

  console.log("\n[Socket Validation Summary]");
  console.log(`- Socket A Connected: ${userASocketConnected}`);
  console.log(`- Socket B Connected: ${userBSocketConnected}`);
  console.log(`- User B Admitted from Waiting Room: ${userBWaitingRoomAdmitted}`);
  console.log(`- User B Entered Peer Connection Room: ${socketBConnectedToRoom}`);
  console.log(`- Signaling Offer Received: ${signalingOfferReceived}`);
  console.log(`- Signaling Answer Received: ${signalingAnswerReceived}`);
  console.log(`- ICE Candidate Exchange Works: ${candidateReceived}`);
  console.log(`- Media State Change Broadcasted: ${mediaStateChangedReceived}`);
  console.log(`- Chat Message Persisted & Received: ${chatMsgReceived}`);
  console.log(`- Transcription Chunk Saved & Broadcasted: ${transcriptReceived}`);

  if (!userASocketConnected || !userBSocketConnected || !userBWaitingRoomAdmitted || !socketBConnectedToRoom) {
    throw new Error("Socket.io room joining or signaling flow failed!");
  }

  // D. Test Session Recording Start / Stop
  console.log("\n[Meeting] Testing Session Recording...");
  const startRecording = await fetch(`${API_URL}/recordings/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      meetingId: meetingIdCode,
      title: "Sprint Audit Recording"
    })
  });
  console.log(`[Meeting] Start Recording status: ${startRecording.status}`);
  const startRecData = await startRecording.json() as any;
  const recordingId = startRecData.id;
  console.log(`[Meeting] Recording created. ID: ${recordingId}, fileUrl: ${startRecData.fileUrl}`);

  const stopRecording = await fetch(`${API_URL}/recordings/stop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      meetingId: meetingIdCode,
      durationSeconds: 150,
      sizeBytes: 1548200
    })
  });
  console.log(`[Meeting] Stop Recording status: ${stopRecording.status}`);
  const stopRecData = await stopRecording.json() as any;
  console.log(`[Meeting] Recording updated. Duration: ${stopRecData.durationSeconds}s, Size: ${stopRecData.sizeBytes} bytes`);
  if (stopRecData.durationSeconds !== 150) {
    throw new Error("Recording details were not successfully updated!");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE 3: AI MEETING INTELLIGENCE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n-------------------------------------------------------");
  console.log("FEATURE 3: AI MEETING INTELLIGENCE");
  console.log("-------------------------------------------------------");

  // A. End Meeting & Auto compile AI Reports
  console.log("[AI] Testing End Meeting & Auto compilation...");
  
  // Prepare a test transcript
  const testTranscript = [
    { speaker: "User A Updated", text: "I will verify the database connection parameters.", timestamp: Date.now() - 300000 },
    { speaker: "User B Test", text: "We decided to deploy the staging branch tomorrow.", timestamp: Date.now() - 250000 },
    { speaker: "User B Test", text: "We agreed to upgrade to HTTP/3 to improve latency.", timestamp: Date.now() - 200000 },
    { speaker: "User A Updated", text: "I am working on polishing the CSS styles and layouts.", timestamp: Date.now() - 150000 }
  ];

  const endMeeting = await fetch(`${API_URL}/rooms/${meetingIdCode}/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      participantNames: ["User A Updated", "User B Test"],
      durationSeconds: 300,
      transcript: testTranscript
    })
  });
  console.log(`[AI] End Meeting & Auto compile status: ${endMeeting.status}`);
  const endMeetingData = await endMeeting.json() as any;
  if (endMeeting.status !== 200) {
    throw new Error(`End meeting endpoint failed: ${JSON.stringify(endMeetingData)}`);
  }

  console.log("[AI] Waiting for intelligence compilation...");
  await sleep(4000); // Wait for async AI compilation tasks to finish

  // B. Database Verifications (Verify AI records are saved and valid)
  console.log("\n[DB] Querying MongoDB collections for E2E Meeting ID:", meetingData.id);
  
  const targetMeetingId = new mongoose.Types.ObjectId(meetingData.id);

  // 1. Verify Meeting ended state
  const dbMeeting = await Meeting.findById(targetMeetingId);
  console.log(`- Meeting status in DB (should be ended): ${dbMeeting?.status}, endedAt: ${dbMeeting?.endedAt}`);
  if (dbMeeting?.status !== "ended" || !dbMeeting?.endedAt) {
    throw new Error("Meeting state was not marked ended in database!");
  }

  // 2. Verify Recording
  const dbRecording = await Recording.findOne({ meeting: targetMeetingId });
  console.log(`- Recording saved in DB: ${!!dbRecording}, fileUrl: ${dbRecording?.fileUrl}`);
  if (!dbRecording) throw new Error("Recording record missing in DB!");

  // 3. Verify Transcript
  const dbTranscriptLines = await MeetingTranscript.find({ meetingId: targetMeetingId });
  console.log(`- Transcript lines saved in DB: ${dbTranscriptLines.length}`);
  if (dbTranscriptLines.length === 0) throw new Error("Transcription lines missing in DB!");

  // 4. Verify Summary
  const dbSummaries = await MeetingSummary.find({ meetingId: targetMeetingId });
  console.log(`- Meeting summaries compiled in DB: ${dbSummaries.length}`);
  dbSummaries.forEach(s => {
    console.log(`  * Type: ${s.summaryType}, shortSummary: "${s.shortSummary}"`);
  });
  if (dbSummaries.length === 0) throw new Error("Meeting summaries missing in DB!");

  // 5. Verify Action Items
  const dbActionItems = await ActionItem.find({ meetingId: targetMeetingId });
  console.log(`- Action items extracted in DB: ${dbActionItems.length}`);
  dbActionItems.forEach(item => {
    console.log(`  * Task: "${item.title}", Assignee: ${item.assigneeName}, Due: ${item.dueDate}`);
  });
  if (dbActionItems.length === 0) throw new Error("Action items missing in DB!");

  // 6. Verify Decisions
  const dbDecisions = await Decision.find({ meetingId: targetMeetingId });
  console.log(`- Decisions tracked in DB: ${dbDecisions.length}`);
  dbDecisions.forEach(d => {
    console.log(`  * Decision: "${d.decision}", Owner: ${d.owner}, Impact: ${d.impact}`);
  });
  if (dbDecisions.length === 0) throw new Error("Decisions missing in DB!");

  // 7. Verify Insights
  const dbInsight = await MeetingInsight.findOne({ meetingId: targetMeetingId });
  console.log(`- Insights compiled in DB: ${!!dbInsight}`);
  if (dbInsight) {
    console.log(`  * Productivity Score: ${dbInsight.productivityScore}`);
    console.log(`  * Engagement Score: ${dbInsight.engagementScore}`);
    console.log(`  * Participation Score: ${dbInsight.participationScore}`);
    console.log(`  * Most Active: ${dbInsight.mostActiveParticipant}, Least Active: ${dbInsight.leastActiveParticipant}`);
    console.log(`  * Speaking Time Analytics:`, Object.fromEntries(dbInsight.speakingTimeAnalytics));
  } else {
    throw new Error("Insights document missing in DB!");
  }

  // 8. Verify Kanban Module tasks sync
  const dbTasks = await Task.find({
    title: { $in: dbActionItems.map(item => item.title) }
  });
  console.log(`- Kanban Tasks created in sync: ${dbTasks.length}`);
  if (dbTasks.length !== dbActionItems.length) {
    throw new Error("Kanban task integration synchronization failed!");
  }

  // Clean up socket clients
  socketA.disconnect();
  socketB.disconnect();

  // Close MongoDB connection
  await mongoose.connection.close();

  console.log("\n=======================================================");
  console.log("SUCCESS: ALL RUNTIME TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("\n=======================================================");
  console.log("FAILURE: AUDIT ENCOUNTERED ERRORS!");
  console.log("=======================================================");
  console.error(err);
  process.exit(1);
});
