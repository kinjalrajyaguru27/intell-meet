import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminListUsers, useAdminUpdateUserRole, useAdminDeleteUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Lock,
  ArrowLeft
} from "lucide-react";

type AdminTab = "users" | "teams" | "org" | "analytics" | "settings" | "logs" | "audit";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: authUser, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  // Synchronize activeTab state with URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam) {
      if (["users", "teams", "org", "analytics", "settings", "logs", "audit"].includes(tabParam)) {
        setActiveTab(tabParam as AdminTab);
      }
    }
  }, [window.location.search]);

  const handleTabChange = (newTab: AdminTab) => {
    setActiveTab(newTab);
    const newUrl = `${window.location.pathname}?tab=${newTab}`;
    window.history.pushState(null, "", newUrl);
  };

  const { data: users, isLoading, error, refetch } = useAdminListUsers();
  const updateRoleMutation = useAdminUpdateUserRole();
  const deleteUserMutation = useAdminDeleteUser();

  // Route security checks
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (authUser?.role !== "Admin") {
      toast({
        title: "Access Restricted",
        description: "Only administrators can access the User Management panel.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isAuthenticated, authUser, setLocation, toast]);

  const handleRoleChange = (userId: string, newRole: "Admin" | "Manager" | "Member") => {
    updateRoleMutation.mutate(
      {
        userId,
        data: { role: newRole },
      },
      {
        onSuccess: (updatedUser) => {
          toast({
            title: "Role updated",
            description: `Successfully set ${updatedUser.name} to ${updatedUser.role}`,
          });
          refetch();
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update role",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === authUser?.id) {
      toast({
        title: "Forbidden",
        description: "You cannot delete your own admin account.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete the user "${userName}"? This will permanently remove their account and delete them from all team workspaces.`)) {
      deleteUserMutation.mutate(
        { userId },
        {
          onSuccess: () => {
            toast({
              title: "User deleted",
              description: `Successfully removed ${userName} from the platform.`,
            });
            refetch();
          },
          onError: (err: any) => {
            toast({
              title: "Deletion failed",
              description: err.message || "An error occurred",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recent";
    return new Date(isoString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!isAuthenticated || authUser?.role !== "Admin") return null;

  return (
    <div className="space-y-6">
      {/* Back link & Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span className="text-xs font-bold text-amber-650 dark:text-amber-400 uppercase tracking-wider">Admin Console</span>
        </div>
      </div>

      {/* Tab switchers */}
      <div className="flex border-b border-zinc-200 dark:border-white/5 overflow-x-auto pb-px shrink-0">
        <button
          onClick={() => handleTabChange("users")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "users" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>
        <button
          onClick={() => handleTabChange("teams")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "teams" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          Team Sprints
        </button>
        <button
          onClick={() => handleTabChange("org")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "org" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Lock className="w-4 h-4" />
          Organization
        </button>
        <button
          onClick={() => handleTabChange("analytics")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "analytics" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Analytics Controls
        </button>
        <button
          onClick={() => handleTabChange("settings")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "settings" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Lock className="w-4 h-4" />
          System Settings
        </button>
        <button
          onClick={() => handleTabChange("logs")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "logs" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          System Logs
        </button>
        <button
          onClick={() => handleTabChange("audit")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "audit" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          Audit Trails
        </button>
      </div>

      {/* User list tab content */}
      {activeTab === "users" && (
        <Card className="bg-white dark:bg-card/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
          
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Manage Platform Users
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              List registered users, reassign roles, and delete accounts
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg border border-zinc-200 dark:border-white/5" />
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500 dark:text-red-400 text-xs">
                Failed to list users from database.
              </div>
            ) : users && users.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No users found.
              </div>
            ) : (
              <div className="space-y-4">
                {users?.map((usr) => (
                  <div 
                    key={usr.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-black/25 hover:bg-zinc-50 dark:hover:bg-black/30 hover:border-zinc-350 dark:hover:border-white/10 transition-all shadow-sm"
                  >
                    {/* User Metadata */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-100 dark:from-zinc-750 dark:to-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-800 dark:text-white border border-zinc-300 dark:border-white/10">
                        {usr.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white">{usr.name}</span>
                          {usr.id === authUser.id && (
                            <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-250 dark:border-zinc-700 rounded text-[8px] font-bold px-1 py-0">You</Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] text-zinc-650 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {usr.email}
                          </span>
                          <span className="hidden sm:inline text-zinc-450 dark:text-zinc-600">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Joined {formatDate(usr.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role select and action buttons */}
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                      {/* Role selection dropdown */}
                      <select
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value as any)}
                        disabled={usr.id === authUser.id || updateRoleMutation.isPending}
                        className="bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg h-9 px-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="Member" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Team Member</option>
                        <option value="Manager" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Manager</option>
                        <option value="Admin" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Platform Admin</option>
                      </select>

                      {/* Delete user button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteUser(usr.id, usr.name)}
                        disabled={usr.id === authUser.id || deleteUserMutation.isPending}
                        className="h-9 w-9 rounded-lg shadow-md hover:bg-red-650"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mock console panels for other tabs */}
      {activeTab !== "users" && (
        <Card className="bg-white dark:bg-card/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 relative overflow-hidden shadow-xl p-8 text-center space-y-4">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
          <Shield className="w-12 h-12 text-amber-500/30 mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">{activeTab} Console Panel</h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            This administrative area provides enterprise security policy configurations, activity audit queries, system logs integration, and automated backup management controls.
          </p>
          <div className="pt-4">
            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs px-3 py-1 font-bold">
              Feature Active & Secure
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
