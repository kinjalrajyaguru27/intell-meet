import { 
  connectDB, 
  User, 
  Meeting, 
  Team, 
  Invitation, 
  Participant, 
  Recording, 
  MeetingChat, 
  MeetingTranscript, 
  MeetingSummary, 
  ActionItem, 
  MeetingInsight, 
  Decision,
  Organization,
  Member,
  Project,
  Task,
  Subtask,
  Comment,
  Attachment,
  Milestone,
  ActivityLog,
  Analytics,
  Report,
  Forecast,
  mongoose 
} from "../lib/db/src";

const API_URL = "http://localhost:5000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runApiTest(
  name: string,
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any,
  token?: string
): Promise<{ success: boolean; status: number; data?: any; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (res.ok) {
      return { success: true, status: res.status, data };
    } else {
      return { success: false, status: res.status, error: typeof data === "string" ? data : JSON.stringify(data) };
    }
  } catch (err: any) {
    return { success: false, status: 0, error: err.message };
  }
}

async function main() {
  console.log("\n=================================================================");
  console.log("STARTING COMPLETE PLATFORM RUNTIME VERIFICATION");
  console.log("=================================================================\n");

  // 1. Connect to Database
  process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intell_meet";
  console.log("[DB] Connecting to database:", process.env.MONGODB_URI);
  await connectDB();
  console.log("[DB] Connected successfully.\n");

  // 2. Collection Auditing
  console.log("---------------------------------------------");
  console.log("1. DATABASE RECORD COUNTS");
  console.log("---------------------------------------------");

  const models: Record<string, any> = {
    User,
    Meeting,
    Team,
    Invitation,
    Participant,
    Recording,
    MeetingChat,
    MeetingTranscript,
    MeetingSummary,
    ActionItem,
    MeetingInsight,
    Decision,
    Organization,
    Member,
    Project,
    Task,
    Subtask,
    Comment,
    Attachment,
    Milestone,
    ActivityLog,
    Analytics,
    Report,
    Forecast
  };

  const dbCounts: Record<string, number> = {};

  for (const [name, model] of Object.entries(models)) {
    try {
      const count = await model.countDocuments();
      dbCounts[name] = count;
      console.log(`- Collection "${model.collection.name}" (${name}): ${count} records`);
    } catch (err) {
      console.error(`Error counting ${name}:`, err);
    }
  }

  // 3. API Route Auditing
  console.log("\n---------------------------------------------");
  console.log("2. API ENDPOINTS RUNTIME AUDITING");
  console.log("---------------------------------------------");

  // Clear or make sure we have a clean test user email
  const auditEmail = "audit_runner@example.com";
  await User.deleteMany({ email: auditEmail });

  let successCount = 0;
  let failedCount = 0;
  const brokenEndpoints: string[] = [];

  const recordResult = (endpoint: string, success: boolean, status: number, details?: string) => {
    if (success) {
      successCount++;
      console.log(`✓ [SUCCESS] ${endpoint} (Status: ${status})`);
    } else {
      failedCount++;
      brokenEndpoints.push(endpoint);
      console.log(`✗ [FAILED] ${endpoint} (Status: ${status}) -> Error: ${details}`);
    }
  };

  // Test 1: User Registration
  const regTest = await runApiTest(
    "Register User",
    `${API_URL}/auth/register`,
    "POST",
    {
      name: "Audit Runner",
      email: auditEmail,
      password: "Password123!",
      role: "Admin"
    }
  );
  recordResult("POST /auth/register", regTest.success, regTest.status, regTest.error);

  // Test 2: User Login
  const loginTest = await runApiTest(
    "Login User",
    `${API_URL}/auth/login`,
    "POST",
    {
      email: auditEmail,
      password: "Password123!"
    }
  );
  recordResult("POST /auth/login", loginTest.success, loginTest.status, loginTest.error);

  const token = loginTest.data?.token;

  // Test 3: Get User Profile
  const profileTest = await runApiTest(
    "Get Profile",
    `${API_URL}/users/profile`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /users/profile", profileTest.success, profileTest.status, profileTest.error);

  // Test 4: Update Profile
  const updateProfileTest = await runApiTest(
    "Update Profile",
    `${API_URL}/users/profile`,
    "PUT",
    {
      jobTitle: "Security Auditor",
      department: "QA & Verification"
    },
    token
  );
  recordResult("PUT /users/profile", updateProfileTest.success, updateProfileTest.status, updateProfileTest.error);

  // Test 5: Get Meetings List
  const listMeetingsTest = await runApiTest(
    "Get Meetings",
    `${API_URL}/meetings`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /meetings", listMeetingsTest.success, listMeetingsTest.status, listMeetingsTest.error);

  // Test 6: Create Meeting
  const createMeetingTest = await runApiTest(
    "Create Meeting",
    `${API_URL}/meetings/create`,
    "POST",
    {
      title: "Audit Review Meeting",
      description: "Verifying security bounds and sidebar routing",
      waitingRoomEnabled: false
    },
    token
  );
  recordResult("POST /meetings/create", createMeetingTest.success, createMeetingTest.status, createMeetingTest.error);

  // Test 7: Get Teams List
  const listTeamsTest = await runApiTest(
    "Get Teams",
    `${API_URL}/teams`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /teams", listTeamsTest.success, listTeamsTest.status, listTeamsTest.error);

  // Test 8: Get Channels List
  const listChannelsTest = await runApiTest(
    "Get Channels",
    `${API_URL}/channels`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /channels", listChannelsTest.success, listChannelsTest.status, listChannelsTest.error);

  // Test 9: Get Organizations
  const listOrgsTest = await runApiTest(
    "Get Organizations",
    `${API_URL}/organizations`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /organizations", listOrgsTest.success, listOrgsTest.status, listOrgsTest.error);

  // Test 10: Get Projects
  const listProjectsTest = await runApiTest(
    "Get Projects",
    `${API_URL}/projects`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /projects", listProjectsTest.success, listProjectsTest.status, listProjectsTest.error);

  // Test 11: Get Tasks
  const listTasksTest = await runApiTest(
    "Get Tasks",
    `${API_URL}/tasks`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /tasks", listTasksTest.success, listTasksTest.status, listTasksTest.error);

  // Test 12: Get Executive Analytics
  const execAnalyticsTest = await runApiTest(
    "Get Executive Analytics",
    `${API_URL}/analytics/executive`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /analytics/executive", execAnalyticsTest.success, execAnalyticsTest.status, execAnalyticsTest.error);

  // Test 13: Get Teams Analytics
  const teamsAnalyticsTest = await runApiTest(
    "Get Teams Analytics",
    `${API_URL}/analytics/teams`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /analytics/teams", teamsAnalyticsTest.success, teamsAnalyticsTest.status, teamsAnalyticsTest.error);

  // Test 14: Get Meetings Analytics
  const meetingsAnalyticsTest = await runApiTest(
    "Get Meetings Analytics",
    `${API_URL}/analytics/meetings`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /analytics/meetings", meetingsAnalyticsTest.success, meetingsAnalyticsTest.status, meetingsAnalyticsTest.error);

  // Test 15: Get Chat Analytics
  const chatAnalyticsTest = await runApiTest(
    "Get Chat Analytics",
    `${API_URL}/analytics/chat`,
    "GET",
    undefined,
    token
  );
  recordResult("GET /analytics/chat", chatAnalyticsTest.success, chatAnalyticsTest.status, chatAnalyticsTest.error);

  // Clean up audit user
  await User.deleteMany({ email: auditEmail });

  console.log("\n---------------------------------------------");
  console.log("3. API AUDIT SUMMARY");
  console.log("---------------------------------------------");
  console.log(`- Success Count: ${successCount}`);
  console.log(`- Failed Count: ${failedCount}`);
  if (brokenEndpoints.length > 0) {
    console.log("- Broken Endpoints:", brokenEndpoints);
  } else {
    console.log("- Broken Endpoints: None");
  }

  // Close MongoDB Connection
  await mongoose.connection.close();
  console.log("\nPlatform audit completed successfully.\n");
}

main().catch((err) => {
  console.error("Audit encountered error:", err);
  process.exit(1);
});
