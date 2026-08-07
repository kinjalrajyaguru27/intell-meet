import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Video, MessageSquare, Download,
  Users, RefreshCw, FileLineChart
} from "lucide-react";

type AnalyticsTab = "meetings" | "chat" | "reports";

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("meetings");

  // Synchronize activeTab state with URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam && ["meetings", "chat", "reports"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [window.location.search]);

  const handleTabChange = (newTab: AnalyticsTab) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    window.history.pushState(null, "", newUrl);
  };

  const [isCompiling, setIsCompiling] = useState(false);

  // Analytics states
  const [meetingsData, setMeetingsData] = useState<any>(null);
  const [chatData, setChatData] = useState<any>(null);

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
    if (token && activeTab) {
      if (activeTab === "meetings") fetchMeetingsData();
      if (activeTab === "chat") fetchChatData();
    }
  }, [token, activeTab]);

  const fetchMeetingsData = async () => {
    setIsCompiling(true);
    try {
      const res = await fetch("/api/analytics/meetings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMeetingsData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const fetchChatData = async () => {
    setIsCompiling(true);
    try {
      const res = await fetch("/api/analytics/chat", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChatData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">Analysis</h1>
        </div>
      </div>

      {/* Tab switchers */}
      <div className="flex border-b border-zinc-200 dark:border-white/5 overflow-x-auto pb-px shrink-0">
        <button
          onClick={() => handleTabChange("meetings")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "meetings" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <Video className="w-4 h-4" />
          Conferences & Dialogues
        </button>

        <button
          onClick={() => handleTabChange("chat")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat & Collaboration
        </button>

        <button
          onClick={() => handleTabChange("reports")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-zinc-800 dark:hover:text-white"
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
          <p className="text-xs text-muted-foreground">Compiling analytics dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: CONFERENCES & DIALOGUES */}
          {activeTab === "meetings" && meetingsData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Call Duration</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{meetingsData.averageDurationMinutes}m</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Calculated per conference</p>
                </Card>
                
                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average Attendance</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{meetingsData.averageAttendance} users</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Attendance ratio</p>
                </Card>

                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total conferences logged</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{meetingsData.totalMeetings} calls</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Database record aggregate</p>
                </Card>
              </div>

              {/* dialogue rankings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/5 p-5 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      Most Active Speakers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {!meetingsData.mostActiveParticipants || meetingsData.mostActiveParticipants.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No speech data recorded yet.
                      </div>
                    ) : (
                      meetingsData.mostActiveParticipants.map((p: any, idx: number) => (
                        <div key={p.name} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-black/35 rounded-xl text-xs border border-zinc-200/50 dark:border-transparent">
                          <span className="font-semibold text-zinc-800 dark:text-white">{idx + 1}. {p.name}</span>
                          <span className="text-zinc-500 dark:text-muted-foreground font-bold">{p.count} dialogues</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/5 p-5 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      Least Active Speakers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {!meetingsData.leastActiveParticipants || meetingsData.leastActiveParticipants.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No speech data recorded yet.
                      </div>
                    ) : (
                      meetingsData.leastActiveParticipants.map((p: any, idx: number) => (
                        <div key={p.name} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-black/35 rounded-xl text-xs border border-zinc-200/50 dark:border-transparent">
                          <span className="font-semibold text-zinc-800 dark:text-white">{idx + 1}. {p.name}</span>
                          <span className="text-zinc-500 dark:text-muted-foreground font-bold">{p.count} dialogues</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: CHAT & COLLABORATION */}
          {activeTab === "chat" && chatData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Messages Sent</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{chatData.messagesSent}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Enterprise channels & DMs</p>
                </Card>
                
                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Chat Senders</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{chatData.activeUsers} users</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Unique senders count</p>
                </Card>

                <Card className="bg-white dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Interaction Ratio</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{chatData.interactionRate} msg/user</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Messages density ratio</p>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS CENTER */}
          {activeTab === "reports" && (
            <div className="flex justify-center items-center py-12">
              <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/10 w-full max-w-md p-6 space-y-6 shadow-xl">
                <div className="text-center space-y-2">
                  <FileLineChart className="w-10 h-10 text-primary mx-auto" />
                  <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Generate Executive Report</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Export compiled workspaces, sprints, and meeting statistics.
                  </CardDescription>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Report Type</label>
                    <select
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="Project" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Project Summary</option>
                      <option value="Team" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Team Performance</option>
                      <option value="General" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">General Tasks</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="CSV" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">CSV Spreadsheet</option>
                      <option value="PDF" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">PDF Report</option>
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
