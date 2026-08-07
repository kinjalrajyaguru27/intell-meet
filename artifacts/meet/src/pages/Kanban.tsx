import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid, Calendar as CalendarIcon, Clock, ShieldAlert,
  Settings, Building2, Users, FolderKanban, Loader2
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import CalendarView from "@/components/CalendarView";
import ActivityLogView from "@/components/ActivityLogView";

type WorkspaceTab = "calendar" | "audit";

export default function Kanban() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, token } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("calendar");

  // Synchronize activeTab state with URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam) {
      if (["calendar", "audit"].includes(tabParam)) {
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

  const uniqueProjects = useMemo(() => {
    const map = new Map<string, any>();
    projects.forEach((p) => {
      const key = p.id || p._id;
      if (key && !map.has(key)) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
  }, [projects]);

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

  // Load teams and projects when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && token) {
      fetchTeams();
      fetchProjects();
    } else {
      setTeams([]);
      setSelectedTeamId("");
      setProjects([]);
      setSelectedProjectId("");
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
      const url = selectedTeamId ? `/api/projects?teamId=${selectedTeamId}` : `/api/projects`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id || data[0]._id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Team Workspace Hub</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Manage project schedules & track system audit trail logs</p>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block mx-1" />

          {/* Quick Scope Selectors: Interactive Organization & Project Dropdowns */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Select Organization */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-600 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-slate-500 dark:text-zinc-400 font-semibold">Org:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedProjectId("");
                }}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Project */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-600 transition-colors">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-500 dark:text-zinc-400 font-semibold">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Select Project</option>
                {uniqueProjects.map((proj) => (
                  <option key={proj.id || proj._id} value={proj.id || proj._id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation("/team-management")}
            className="rounded-xl px-4 text-xs font-semibold border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-2xs transition-all"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-500 dark:text-zinc-400" />
            Configure Workspace
          </Button>
        </div>
      </div>

      {/* Tab Selection Row */}
      <div className="inline-flex p-1 bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-xl self-start gap-1">
        <button
          onClick={() => handleTabChange("calendar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
            activeTab === "calendar"
              ? "bg-white dark:bg-zinc-800 text-primary shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Team Calendar
        </button>
        <button
          onClick={() => handleTabChange("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-white dark:bg-zinc-800 text-primary shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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

          {activeTab === "calendar" && (
            <CalendarView
              token={token}
              selectedOrgId={selectedOrgId}
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
