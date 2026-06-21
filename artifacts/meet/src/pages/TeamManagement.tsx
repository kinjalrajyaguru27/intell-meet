import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Users, Building2, ShieldAlert } from "lucide-react";
import OrgConfig from "@/components/OrgConfig";

export default function TeamManagement() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, token } = useAuth();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [isLoading, setIsLoading] = useState(false);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-white font-sans">Team & Workspace Management</h1>
          
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          
          <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Org:
            </span>
            <span className="text-white font-bold">
              {organizations.find(o => o._id === selectedOrgId)?.name || "Not Selected"}
            </span>
          </div>
        </div>
      </div>

      {/* Main configuration container */}
      <div className="flex-1 bg-card border border-white/5 rounded-2xl p-6 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading organization settings...</span>
          </div>
        ) : (
          <OrgConfig
            token={token}
            currentUser={user}
            organizations={organizations}
            refetchOrgs={fetchOrganizations}
            selectedOrgId={selectedOrgId}
            setSelectedOrgId={setSelectedOrgId}
            teams={teams}
            refetchTeams={fetchTeams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            projects={projects}
            refetchProjects={fetchProjects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        )}
      </div>
    </div>
  );
}
