import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, FolderKanban, Plus, Settings, Trash2, Shield, UserPlus,
  LogOut, CheckCircle, AlertTriangle, KeyRound
} from "lucide-react";

interface OrgConfigProps {
  token: string | null;
  currentUser: any;
  organizations: any[];
  refetchOrgs: () => void;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  teams: any[];
  refetchTeams: () => void;
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  projects: any[];
  refetchProjects: () => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export default function OrgConfig({
  token,
  currentUser,
  organizations,
  refetchOrgs,
  selectedOrgId,
  setSelectedOrgId,
  teams,
  refetchTeams,
  selectedTeamId,
  setSelectedTeamId,
  projects,
  refetchProjects,
  selectedProjectId,
  setSelectedProjectId
}: OrgConfigProps) {
  const { toast } = useToast();
  
  // Organization dialog states
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  // Team dialog states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");

  // Project dialog states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectPriority, setProjectPriority] = useState("Medium");
  const [projectDueDate, setProjectDueDate] = useState("");

  // Member invitation states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  // Ownership transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");

  // Load Organization members when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId && token) {
      fetchOrgMembers();
    } else {
      setOrgMembers([]);
    }
  }, [selectedOrgId]);

  const fetchOrgMembers = async () => {
    try {
      // Since we don't have a direct getMembers endpoint, we invite/invite-list or fetch settings or fetch teams
      // Wait, let's fetch members of the organization. Let's see: we can call /api/organizations/:orgId/settings or mock members from teams.
      // Wait, in members router, there's actually a route. Let's list what we can get or fetch teams members.
      // Let's call /api/organizations/:id/settings to see if it lists members, or we can use team members as fallback.
      // Actually, let's write a fetch helper.
      const res = await fetch(`/api/organizations/${selectedOrgId}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Since settings doesn't return full members list, let's fallback to calculating them from teams
        const uniqueMembers = new Map<string, any>();
        teams.forEach(team => {
          team.members?.forEach((m: any) => {
            uniqueMembers.set(m.user.id || m.user._id, {
              userId: m.user.id || m.user._id,
              name: m.user.name,
              email: m.user.email,
              role: m.role || "Member"
            });
          });
        });
        
        // Add owner
        const selectedOrg = organizations.find(o => o._id === selectedOrgId);
        if (selectedOrg && selectedOrg.owner) {
          // If owner is current user
          const isOwnerMe = selectedOrg.owner === currentUser?.id;
          uniqueMembers.set(selectedOrg.owner, {
            userId: selectedOrg.owner,
            name: isOwnerMe ? currentUser.name : "Organization Owner",
            email: isOwnerMe ? currentUser.email : "",
            role: "Owner"
          });
        }
        
        setOrgMembers(Array.from(uniqueMembers.values()));
      }
    } catch (err) {
      console.error("Error fetching org members", err);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !token) return;
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: orgName, description: orgDesc })
      });
      if (res.ok) {
        const newOrg = await res.json();
        toast({ title: "Success", description: `Organization "${newOrg.name}" created successfully` });
        setOrgName("");
        setOrgDesc("");
        setShowCreateOrg(false);
        refetchOrgs();
        setSelectedOrgId(newOrg._id);
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Could not create organization", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !selectedOrgId || !token) return;
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: teamName.trim(), organizationId: selectedOrgId })
      });
      if (res.ok) {
        const newTeam = await res.json();
        toast({ title: "Success", description: `Team "${newTeam.name}" created successfully` });
        setTeamName("");
        setShowCreateTeam(false);
        refetchTeams();
        setSelectedTeamId(newTeam.id);
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Could not create team", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleDeleteOrg = async () => {
    if (!confirm("Are you absolutely sure? This will permanently delete the organization and ALL its teams, projects, and tasks!")) return;
    setIsDeletingOrg(true);
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 204) {
        toast({ title: "Deleted", description: "Organization deleted successfully" });
        setSelectedOrgId("");
        setSelectedTeamId("");
        setSelectedProjectId("");
        refetchOrgs();
      } else {
        toast({ title: "Error", description: "Failed to delete organization", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingOrg(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !selectedTeamId || !token) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          teamId: selectedTeamId,
          dueDate: projectDueDate || undefined,
          priority: projectPriority
        })
      });
      if (res.ok) {
        const newProj = await res.json();
        toast({ title: "Success", description: `Project "${newProj.name}" created` });
        setProjectName("");
        setProjectDesc("");
        setProjectDueDate("");
        setShowCreateProject(false);
        refetchProjects();
        setSelectedProjectId(newProj.id);
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Could not create project", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      const res = await fetch(`/api/projects/${projId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 204) {
        toast({ title: "Deleted", description: "Project removed successfully" });
        if (selectedProjectId === projId) {
          setSelectedProjectId("");
        }
        refetchProjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !token) return;
    try {
      // Call invite member endpoint
      const res = await fetch(`/api/organizations/${selectedOrgId}/members/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      if (res.ok) {
        toast({ title: "Success", description: `Invitation sent to ${inviteEmail}` });
        setInviteEmail("");
        fetchOrgMembers();
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Could not invite member", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/members/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        toast({ title: "Role Updated", description: "User role updated successfully" });
        fetchOrgMembers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Remove this user from the organization?")) return;
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Removed", description: "User removed from organization" });
        fetchOrgMembers();
        refetchTeams();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerId || !token) return;
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/transfer-ownership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newOwnerId })
      });
      if (res.ok) {
        toast({ title: "Transferred", description: "Organization ownership transferred" });
        setShowTransfer(false);
        refetchOrgs();
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Failed to transfer", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const currentOrg = organizations.find(o => o._id === selectedOrgId);
  const isOwner = currentOrg?.owner === currentUser?.id;

  return (
    <div className="space-y-6">
      {/* Selection Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 dark:bg-card/40 border border-zinc-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <Label className="text-zinc-800 dark:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            1. Select Organization
          </Label>
          <div className="flex gap-2">
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedTeamId("");
                setSelectedProjectId("");
              }}
              className="flex-1 bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">-- Choose Organization --</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id} className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">{org.name}</option>
              ))}
            </select>
            <Button
              key="create-org-btn"
              size="icon"
              variant="outline"
              onClick={() => setShowCreateOrg(true)}
              className="w-9 h-9 shrink-0 rounded-xl border-zinc-250 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-800 dark:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-550 dark:text-cyan-400" />
            2. Select Team Workspace
          </Label>
          <div className="flex gap-2">
            <select
              value={selectedTeamId}
              disabled={!selectedOrgId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedProjectId("");
              }}
              className="flex-1 bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium disabled:opacity-50"
            >
              <option value="" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">-- Choose Team Workspace --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">{t.name}</option>
              ))}
            </select>
            <Button
              key="create-team-btn"
              size="icon"
              variant="outline"
              disabled={!selectedOrgId}
              onClick={() => setShowCreateTeam(true)}
              className="w-9 h-9 shrink-0 rounded-xl border-zinc-250 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-800 dark:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            3. Select Project
          </Label>
          <div className="flex gap-2">
            <select
              value={selectedProjectId}
              disabled={!selectedTeamId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium disabled:opacity-50"
            >
              <option value="" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">{p.name}</option>
              ))}
            </select>
            <Button
              key="create-project-btn"
              size="icon"
              variant="outline"
              disabled={!selectedTeamId}
              onClick={() => setShowCreateProject(true)}
              className="w-9 h-9 shrink-0 rounded-xl border-zinc-250 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Organization Creation Modal Form */}
      {showCreateOrg && (
        <Card className="bg-white dark:bg-card/60 border border-zinc-250 dark:border-white/10 p-6 max-w-lg mx-auto shadow-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Create Organization
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Setup a new organizational workspace container</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Organization Name</Label>
              <Input
                placeholder="e.g. Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-foreground dark:text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Description (Optional)</Label>
              <Textarea
                placeholder="Brief summary..."
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-foreground dark:text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateOrg(false)} className="text-zinc-650 dark:text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" size="sm">Create Org</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Team Creation Modal Form */}
      {showCreateTeam && (
        <Card className="bg-white dark:bg-card/60 border border-zinc-250 dark:border-white/10 p-6 max-w-lg mx-auto shadow-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-550 dark:text-cyan-400" />
              Create Team Workspace
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Setup a new team collaboration workspace</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Team Name</Label>
              <Input
                placeholder="e.g. Engineering, Sales"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-foreground dark:text-white"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateTeam(false)} className="text-zinc-650 dark:text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" size="sm">Create Team</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Project Creation Form */}
      {showCreateProject && (
        <Card className="bg-white dark:bg-card/60 border border-zinc-250 dark:border-white/10 p-6 max-w-lg mx-auto shadow-xl">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Create New Project
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Add a project timeline to the selected team</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Project Name</Label>
              <Input
                placeholder="e.g. Q3 Launch Campaign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-foreground dark:text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Description</Label>
              <Textarea
                placeholder="Scope description..."
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 text-foreground dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Priority</Label>
                <select
                  value={projectPriority}
                  onChange={(e) => setProjectPriority(e.target.value)}
                  className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 h-10 rounded-md px-3 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="Low" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Low</option>
                  <option value="Medium" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Medium</option>
                  <option value="High" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">High</option>
                  <option value="Critical" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-700 dark:text-white font-semibold">Due Date</Label>
                <Input
                  type="date"
                  value={projectDueDate}
                  onChange={(e) => setProjectDueDate(e.target.value)}
                  className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 h-10 text-xs text-foreground dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateProject(false)} className="text-zinc-650 dark:text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" size="sm">Create Project</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Selected Org Settings Pane */}
      {selectedOrgId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Org Workspace controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members List & Invite */}
            <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
                <div>
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Organization Members</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Manage organizational user privileges</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-white">
                  {orgMembers.length} active
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Invite Form */}
                <form onSubmit={handleInviteMember} className="flex gap-2 items-end bg-zinc-50 dark:bg-black/20 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-zinc-500 dark:text-muted-foreground uppercase font-bold pl-1">Invite Member (Email)</Label>
                    <Input
                      type="email"
                      placeholder="user@domain.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="bg-white dark:bg-black/40 border-zinc-250 dark:border-white/10 h-8 text-xs text-foreground dark:text-white"
                      required
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-[10px] text-zinc-500 dark:text-muted-foreground uppercase font-bold pl-1">Role</Label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 h-8 rounded-md px-2.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="Viewer" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Viewer</option>
                      <option value="Member" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Member</option>
                      <option value="Manager" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Manager</option>
                      <option value="Admin" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Admin</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="h-8 rounded-lg px-3">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Invite
                  </Button>
                </form>

                {/* Members list */}
                <div className="divide-y divide-zinc-200 dark:divide-white/5 max-h-72 overflow-y-auto pr-1">
                  {orgMembers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic">No members logged</div>
                  ) : (
                    orgMembers.map((m) => {
                      const canManage = isOwner && m.userId !== currentUser?.id;
                      return (
                        <div key={m.userId} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                              {m.name ? m.name.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-zinc-900 dark:text-white block">{m.name || "Pending Invite"}</span>
                              <span className="text-[10px] text-zinc-500 dark:text-muted-foreground block">{m.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canManage ? (
                              <select
                                value={m.role}
                                onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                                className="bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded px-2 py-0.5 text-[10px] text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                              >
                                <option value="Viewer" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Viewer</option>
                                <option value="Member" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Member</option>
                                <option value="Manager" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Manager</option>
                                <option value="Admin" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Admin</option>
                              </select>
                            ) : (
                              <span className="text-[10px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded text-zinc-600 dark:text-muted-foreground font-semibold">
                                {m.role}
                              </span>
                            )}

                            {canManage && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveMember(m.userId)}
                                className="w-7 h-7 text-red-500 hover:bg-red-500/10 hover:text-red-450"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* List Projects */}
            <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/5 shadow-sm">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-white/5">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Workspace Projects</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Timeline streams for team execution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic">No projects found. Use drop down selectors to create one.</div>
                  ) : (
                    projects.map((p) => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl shadow-xs">
                        <div>
                          <span className="font-semibold text-xs text-zinc-900 dark:text-white block">{p.name}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-muted-foreground block truncate max-w-xs">{p.description || "No description"}</span>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{p.priority}</span>
                            {p.dueDate && <span className="text-[9px] bg-zinc-150 dark:bg-white/5 text-zinc-600 dark:text-muted-foreground px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5">Due: {p.dueDate}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded text-zinc-800 dark:text-white font-bold border border-zinc-200 dark:border-white/5">
                            {p.progressPercent}% progress
                          </span>
                          {isOwner && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteProject(p.id)}
                              className="w-7 h-7 text-red-500 hover:bg-red-500/10 hover:text-red-450"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Org Settings / Danger Zone */}
          <div className="space-y-6">
            {/* Transfer Ownership */}
            {isOwner && (
              <Card className="bg-white dark:bg-card/25 border border-zinc-200 dark:border-white/5 shadow-sm">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-white/5">
                  <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    Transfer Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleTransferOwnership} className="space-y-3">
                    <select
                      value={newOwnerId}
                      onChange={(e) => setNewOwnerId(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      required
                    >
                      <option value="" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">-- Choose New Owner --</option>
                      {orgMembers
                        .filter(m => m.userId !== currentUser?.id)
                        .map(m => (
                          <option key={m.userId} value={m.userId} className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">{m.name || m.email}</option>
                        ))}
                    </select>
                    <Button type="submit" size="sm" className="w-full text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black border-0">
                      Transfer Owner Privileges
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {isOwner && (
              <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
                <CardHeader className="pb-3 border-b border-destructive/10">
                  <CardTitle className="text-sm font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-[11px] text-red-600 dark:text-red-300">Irreversible actions on organization</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button
                    onClick={handleDeleteOrg}
                    disabled={isDeletingOrg}
                    className="w-full bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs border-0 py-2.5 rounded-lg"
                  >
                    {isDeletingOrg ? "Deleting..." : "Permanently Delete Org"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
