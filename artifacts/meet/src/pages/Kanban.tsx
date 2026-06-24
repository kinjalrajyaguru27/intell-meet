import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid, Calendar as CalendarIcon, Clock, ShieldAlert,
  Settings, Building2, Users, FolderKanban, Loader2
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import KanbanBoard from "@/components/KanbanBoard";
import TimelineGantt from "@/components/TimelineGantt";
import CalendarView from "@/components/CalendarView";
import ActivityLogView from "@/components/ActivityLogView";

type WorkspaceTab = "board" | "gantt" | "calendar" | "audit";

export default function Kanban() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, token } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("board");

  // Synchronize activeTab state with URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam) {
      if (["board", "gantt", "calendar", "audit"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, [window.location.search]);

  const handleTabChange = (newTab: WorkspaceTab) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    window.history.pushState(null, "", newUrl);
  };

  // Data selections
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  // Load organizations
  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token]);

  // Load teams when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && token) {
      fetchTeams();
    } else {
      setTeams([]);
      setSelectedTeamId("");
    }
  }, [selectedOrgId]);

  // Load projects when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId && token) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProjectId("");
    }
  }, [selectedTeamId]);

  // Setup Socket Connection
  useEffect(() => {
    if (!token) return;
    const socketUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    const s = io(socketUrl, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [token]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
        if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const list = await res.json();
        // Filter those with matching organizationId
        const filtered = list.filter((t: any) => t.organizationId === selectedOrgId);
        setTeams(filtered);
        if (filtered.length > 0 && !selectedTeamId) {
          setSelectedTeamId(filtered[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects?teamId=${selectedTeamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">

      {/* Workspace selector dropdown header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white">Team Workspace Hub</h1>

          <div className="h-5 w-px bg-zinc-200 dark:bg-white/10 hidden sm:block" />

          {/* Quick Scope Selectors Info labels */}
          <div className="flex items-center gap-2 text-xs bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Org:
            </span>
            <span className="text-zinc-900 dark:text-white font-bold">
              {organizations.find(o => o._id === selectedOrgId)?.name || "Not Selected"}
            </span>
            <span className="text-muted-foreground ml-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Team:
            </span>
            <span className="text-zinc-900 dark:text-white font-bold">
              {teams.find(t => t.id === selectedTeamId)?.name || "Not Selected"}
            </span>
            <span className="text-muted-foreground ml-2 flex items-center gap-1">
              <FolderKanban className="w-3.5 h-3.5" /> Project:
            </span>
            <span className="text-zinc-900 dark:text-white font-bold">
              {projects.find(p => p.id === selectedProjectId)?.name || "Not Selected"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/team-management")}
            className="rounded-full px-4 text-xs font-semibold border-zinc-250 dark:border-white/10 text-foreground dark:text-zinc-250 hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Configure Workspace
          </Button>
        </div>
      </div>

      {/* Tab Selection Row */}
      <div className="flex border-b border-zinc-200 dark:border-white/5 overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange("board")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "board"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
            }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Kanban Board
        </button>
        <button
          onClick={() => handleTabChange("gantt")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "gantt"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
            }`}
        >
          <Clock className="w-4 h-4" />
          Gantt Timeline
        </button>
        <button
          onClick={() => handleTabChange("calendar")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
            }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Team Calendar
        </button>
        <button
          onClick={() => handleTabChange("audit")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
            }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading workspace details...</span>
        </div>
      )}

      {/* Views Router */}
      {!isLoading && (
        <div className="space-y-6">

          {activeTab === "board" && (
            selectedProjectId ? (
              <KanbanBoard
                token={token}
                socket={socket}
                selectedProjectId={selectedProjectId}
                selectedTeamId={selectedTeamId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-card/20 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm">
                <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-white">No Project Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs mb-4">
                  Please select or configure an organization, team, and project inside settings.
                </p>
                <Button size="sm" onClick={() => setLocation("/team-management")} className="rounded-full">
                  Configure Workspace
                </Button>
              </div>
            )
          )}

          {activeTab === "gantt" && (
            selectedProjectId ? (
              <TimelineGantt
                token={token}
                selectedProjectId={selectedProjectId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-card/20 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm">
                <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-white">No Project Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs mb-4">
                  Configure your timelines inside settings to inspect project Gantt views.
                </p>
                <Button size="sm" onClick={() => setLocation("/team-management")} className="rounded-full">
                  Configure Workspace
                </Button>
              </div>
            )
          )}

          {activeTab === "calendar" && (
            <CalendarView
              token={token}
              selectedProjectId={selectedProjectId}
            />
          )}

          {activeTab === "audit" && (
            selectedOrgId ? (
              <ActivityLogView
                token={token}
                selectedOrgId={selectedOrgId}
              />
            ) : (
              <div className="text-center py-20 text-xs text-muted-foreground">
                Select an organization scope to view the audit history logs.
              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}
