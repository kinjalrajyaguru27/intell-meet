import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  BarChart3, Video, MessageSquare, Brain, Bell, Download,
  TrendingUp, Users, Clock, AlertTriangle, CheckCircle, RefreshCw,
  FileLineChart
} from "lucide-react";

type AnalyticsTab = "executive" | "meetings" | "chat" | "forecast" | "alerts" | "reports";

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("executive");

  // Synchronize activeTab state with URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam) {
      if (["executive", "meetings", "chat", "forecast", "alerts", "reports"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [window.location.search]);

  const handleTabChange = (newTab: AnalyticsTab) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    window.history.pushState(null, "", newUrl);
  };
  const [isCompiling, setIsCompiling] = useState(false);

  // Analytics states
  const [executiveData, setExecutiveData] = useState<any>(null);
  const [meetingsData, setMeetingsData] = useState<any>(null);
  const [chatData, setChatData] = useState<any>(null);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);

  // Selected project for forecasting
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjId, setSelectedProjId] = useState("");

  // Report Export Form states
  const [exportType, setExportType] = useState("Project");
  const [exportFormat, setExportFormat] = useState("CSV");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (token) {
      fetchOverviewData();
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab) {
      if (activeTab === "meetings") fetchMeetingsData();
      if (activeTab === "chat") fetchChatData();
      if (activeTab === "forecast") fetchForecastData();
      if (activeTab === "alerts") fetchSmartAlerts();
    }
  }, [token, activeTab, selectedProjId]);

  const fetchOverviewData = async () => {
    if (!token) return;
    setIsCompiling(true);
    try {
      // 1. Executive
      const execRes = await fetch("/api/analytics/executive", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (execRes.ok) {
        setExecutiveData(await execRes.json());
      }

      // 2. Teams
      const teamsRes = await fetch("/api/analytics/teams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (teamsRes.ok) {
        setTeamData(await teamsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjId(data[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMeetingsData = async () => {
    try {
      const res = await fetch("/api/analytics/meetings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMeetingsData(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatData = async () => {
    try {
      const res = await fetch("/api/analytics/chat", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChatData(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForecastData = async () => {
    const url = selectedProjId
      ? `/api/analytics/forecasts?projectId=${selectedProjId}`
      : "/api/analytics/forecasts";
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setForecasts(Array.isArray(data) ? data : [data]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSmartAlerts = async () => {
    // Generate simulated smart alerts based on projects delay or due dates
    try {
      const logsRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const projs = await logsRes.json();
        const alertsList: any[] = [];
        projs.forEach((p: any) => {
          if (p.status !== "Completed" && p.dueDate) {
            const due = new Date(p.dueDate);
            const today = new Date();
            const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft < 3) {
              alertsList.push({
                id: `a-${p.id}`,
                title: "Critical Project Deadline Risk",
                content: `Project "${p.name}" is due in ${daysLeft} days with ${p.totalTasks - p.completedTasks} pending tasks. High risk of breach!`,
                severity: "Critical",
                date: new Date().toISOString()
              });
            } else if (p.progressPercent < 40 && p.status === "Active") {
              alertsList.push({
                id: `a-${p.id}`,
                title: "AI Workload Delay Prediction",
                content: `Project "${p.name}" progress is lagging at ${p.progressPercent}% completion. AI workload metrics indicate delay probability.`,
                severity: "Warning",
                date: new Date().toISOString()
              });
            }
          }
        });
        setSmartAlerts(alertsList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/analytics/reports/generate?type=${exportType}&format=${exportFormat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportType.toLowerCase()}_report_${Date.now()}.${exportFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary animate-pulse" />
          <h1 className="font-semibold text-lg text-white">Tableau-Grade Executive Analytics</h1>
        </div>
      </div>

      {/* Tab switchers */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px shrink-0">
        <button
          onClick={() => handleTabChange("executive")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "executive" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Executive Overview
        </button>
        <button
          onClick={() => handleTabChange("meetings")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "meetings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" />
          Conferences & Dialogues
        </button>
        <button
          onClick={() => handleTabChange("chat")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat & Collaboration
        </button>
        <button
          onClick={() => handleTabChange("forecast")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "forecast" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Brain className="w-4 h-4" />
          AI Workload Forecasts
        </button>
        <button
          onClick={() => handleTabChange("alerts")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "alerts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4" />
          Smart Alerts
          {smartAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => handleTabChange("reports")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <FileLineChart className="w-4 h-4" />
          Reports Center
        </button>
      </div>

        {/* Tab content container */}
        {isCompiling ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Compiling enterprise analytics dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === "executive" && executiveData && (
              <div className="space-y-6">
                {/* Executive KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-card/40 border-white/10 p-5 relative overflow-hidden">
                    <Users className="w-5 h-5 text-primary absolute top-4 right-4 opacity-30" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Users</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{executiveData.totalUsers}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{executiveData.activeUsers} active session users</p>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/10 p-5 relative overflow-hidden">
                    <Video className="w-5 h-5 text-cyan-400 absolute top-4 right-4 opacity-30" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Conferences Conducted</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{executiveData.meetings}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Aggregate meetings count</p>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/10 p-5 relative overflow-hidden">
                    <Clock className="w-5 h-5 text-violet-400 absolute top-4 right-4 opacity-30" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active projects</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{executiveData.projects}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">In flight execution sprints</p>
                  </Card>

                  <Card className="bg-card/40 border-white/10 p-5 relative overflow-hidden">
                    <CheckCircle className="w-5 h-5 text-emerald-400 absolute top-4 right-4 opacity-30" />
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Productivity Speed</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{executiveData.productivityRate}%</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Completed vs open tasks ratio</p>
                  </Card>
                </div>

                {/* Team Comparisons Chart */}
                <Card className="bg-card/25 border-white/5 p-5">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base text-white font-bold">Team Workspace Velocity Comparison</CardTitle>
                    <CardDescription className="text-xs">Task volume and sprint completion rates by team</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 p-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px" }} />
                        <Legend />
                        <Bar dataKey="tasksCount" name="Total Issues" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: CONFERENCES & DIALOGUES */}
            {activeTab === "meetings" && meetingsData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* KPI Cards */}
                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Call Duration</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{meetingsData.averageDurationMinutes}m</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Calculated per conference</p>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Attendance</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{meetingsData.averageAttendance} users</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Attendance ratio</p>
                  </Card>

                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total conferences logged</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{meetingsData.totalMeetings} calls</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Database record aggregate</p>
                  </Card>
                </div>

                {/* dialogue rankings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card/25 border-white/5 p-5">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-400" />
                        Most Active Speakers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      {meetingsData.mostActiveParticipants?.map((p: any, idx: number) => (
                        <div key={p.name} className="flex justify-between items-center p-3 bg-black/35 rounded-xl text-xs">
                          <span className="font-semibold text-white">{idx + 1}. {p.name}</span>
                          <span className="text-muted-foreground font-bold">{p.count} dialogues</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/25 border-white/5 p-5">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-400" />
                        Least Active Speakers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      {meetingsData.leastActiveParticipants?.map((p: any, idx: number) => (
                        <div key={p.name} className="flex justify-between items-center p-3 bg-black/35 rounded-xl text-xs">
                          <span className="font-semibold text-white">{idx + 1}. {p.name}</span>
                          <span className="text-muted-foreground font-bold">{p.count} dialogues</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 3: CHAT & COLLABORATION */}
            {activeTab === "chat" && chatData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Messages Sent</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{chatData.messagesSent}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Enterprise channels & DMs</p>
                  </Card>
                  
                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Chat Senders</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{chatData.activeUsers} users</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Unique senders count</p>
                  </Card>

                  <Card className="bg-card/40 border-white/10 p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Interaction Ratio</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{chatData.interactionRate} msg/user</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Messages density ratio</p>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 4: AI FORECASTS */}
            {activeTab === "forecast" && (
              <div className="space-y-6">
                {/* Project selector */}
                <div className="bg-card/40 border border-white/10 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Select Target Project for forecasting:</span>
                  </div>
                  <select
                    value={selectedProjId}
                    onChange={(e) => setSelectedProjId(e.target.value)}
                    className="bg-black/45 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {forecasts.map((fc, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Risk KPI card */}
                    <Card className="bg-card/35 border border-white/10 p-5 flex flex-col justify-between items-center text-center">
                      <div>
                        <Brain className="w-8 h-8 text-violet-400 animate-pulse mb-3" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">AI Delay Prediction Index</h4>
                      </div>
                      
                      <div className="py-6">
                        <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-8 ${
                          fc.delayPrediction ? "border-red-500/80 bg-red-500/5 text-red-400" : "border-emerald-500/80 bg-emerald-500/5 text-emerald-400"
                        }`}>
                          <span className="text-base font-extrabold">{fc.confidenceLevel}%</span>
                          <span className="text-[9px] uppercase font-bold mt-0.5">Confidence</span>
                        </div>
                      </div>

                      <Badge variant="outline" className={`text-xs uppercase font-extrabold px-3 py-1 ${
                        fc.delayPrediction ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {fc.delayPrediction ? "At Risk of Delay" : "On Track"}
                      </Badge>
                    </Card>

                    {/* AI analysis text details */}
                    <Card className="md:col-span-2 bg-card/25 border-white/5 p-6 flex flex-col justify-between space-y-4">
                      <div>
                        <CardTitle className="text-base text-white font-bold mb-2">Predictive Project Audit Details</CardTitle>
                        <CardDescription className="text-xs leading-normal">
                          Machine learning workloads analysis assessing Sprint completion velocity parameters, milestones limits, and task allocations.
                        </CardDescription>
                      </div>
                      
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3.5 text-xs text-left">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-semibold">Predicted Productivity Forecast Index:</span>
                          <span className="text-white font-bold">{fc.productivityForecast}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-semibold">Predicted Workload Index:</span>
                          <span className="text-white font-bold">{fc.workloadForecast}</span>
                        </div>
                        <div className="border-t border-white/5 pt-3">
                          <span className="text-muted-foreground font-semibold block mb-1">AI Logic Logs:</span>
                          <p className="text-white/80 leading-relaxed font-sans italic">
                            "{fc.details}"
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: SMART ALERTS */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                {smartAlerts.length === 0 ? (
                  <div className="text-center py-16 bg-card/25 border border-white/5 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mb-4 mx-auto opacity-30" />
                    <h3 className="font-semibold text-sm mb-1 text-white">No Smart Alerts</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      All projects are on track, and no milestone deadlines are breached.
                    </p>
                  </div>
                ) : (
                  smartAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex gap-4 p-4 rounded-xl border items-start text-xs ${
                        alert.severity === "Critical"
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-baseline gap-4 flex-wrap">
                          <span className="font-extrabold text-sm text-white">{alert.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/85 leading-relaxed font-medium">{alert.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: REPORTS CENTER */}
            {activeTab === "reports" && (
              <div className="flex justify-center items-center py-12">
                <Card className="bg-card/25 border-white/10 w-full max-w-md p-6 space-y-6 backdrop-blur-md">
                  <div className="text-center space-y-2">
                    <FileLineChart className="w-10 h-10 text-primary mx-auto animate-pulse" />
                    <CardTitle className="text-lg font-bold text-white">Generate Executive Report</CardTitle>
                    <CardDescription className="text-xs">
                      Export compiled workspaces, sprints, and meeting statistics.
                    </CardDescription>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Report Type</label>
                      <select
                        value={exportType}
                        onChange={(e) => setExportType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        <option value="Project">Project Summary</option>
                        <option value="Team">Team Performance</option>
                        <option value="General">General Tasks</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Export Format</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        <option value="CSV">CSV Spreadsheet</option>
                        <option value="PDF">PDF Report</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleExportReport}
                    disabled={isExporting}
                    className="w-full text-xs font-bold py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition-transform active:scale-[0.98]"
                  >
                    {isExporting ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Report...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        Download Report
                      </span>
                    )}
                  </Button>
                </Card>
              </div>
            )}

          </div>
        )}
    </div>
  );
}
