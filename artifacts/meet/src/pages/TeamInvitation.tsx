import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useListTeams, useInviteToTeam, useAcceptTeamInvite, useRejectTeamInvite } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import {
  Users,
  Mail,
  UserPlus,
  ShieldAlert,
  Check,
  X,
  Plus,
  Clock,
  ArrowRight,
  Shield
} from "lucide-react";

export default function TeamInvitation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [token, setToken] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [simulatedMailLink, setSimulatedMailLink] = useState<string | null>(null);

  const { data: teams, isLoading: isTeamsLoading } = useListTeams();
  const inviteMutation = useInviteToTeam();
  const acceptMutation = useAcceptTeamInvite();
  const rejectMutation = useRejectTeamInvite();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const currentToken = new URLSearchParams(window.location.search).get("token");
      if (currentToken) {
        setLocation(`/login?redirect=/team/invite?token=${currentToken}`);
      } else {
        setLocation("/login");
      }
    }
  }, [isAuthenticated, setLocation]);

  // Parse token and fetch invite details if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken && isAuthenticated) {
      setToken(urlToken);
      fetchInviteDetails(urlToken);
    }
  }, [isAuthenticated]);

  const fetchInviteDetails = async (invToken: string) => {
    setIsDetailsLoading(true);
    try {
      const res = await fetch(`/api/team/invitation/${invToken}`);
      if (res.ok) {
        const data = await res.json();
        setInviteDetails(data);
      } else {
        const err = await res.json();
        toast({
          title: "Invitation Invalid",
          description: err.error || "This invitation is invalid or has already been used.",
          variant: "destructive",
        });
        setToken(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      teamId: "",
      role: "Member" as "Admin" | "Manager" | "Member",
    },
  });

  const onInviteSubmit = (data: any) => {
    inviteMutation.mutate(
      {
        data: {
          email: data.email,
          teamId: data.teamId,
          role: data.role,
        },
      },
      {
        onSuccess: (res: any) => {
          toast({
            title: "Invitation generated",
            description: `Sent invitation to ${data.email}`,
          });
          reset();
          if (res.invitation && res.invitation.token) {
            const link = `${window.location.origin}/team/invite?token=${res.invitation.token}`;
            setSimulatedMailLink(link);
          }
        },
        onError: (err: any) => {
          toast({
            title: "Failed to send invitation",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          toast({
            title: "Welcome aboard!",
            description: `You have successfully joined the team.`,
          });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to join team",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReject = () => {
    if (!token) return;
    rejectMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          toast({
            title: "Invitation Rejected",
            description: "You have declined the team invitation.",
          });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Operation failed",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!isAuthenticated) return null;

  if (token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-550/5 dark:bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

          {isDetailsLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : inviteDetails ? (
            <Card className="w-full max-w-md bg-white dark:bg-card/65 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
              
              <CardHeader className="text-center pt-8 space-y-2">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">Join Team Workspace</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  You have been invited to participate in a team
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <div className="bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-550 dark:text-zinc-400 font-medium">Invited To Join</span>
                    <span className="text-zinc-800 dark:text-white font-bold text-right">{inviteDetails.team?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-550 dark:text-zinc-400 font-medium">Invited By</span>
                    <span className="text-zinc-800 dark:text-white font-bold text-right">
                      {inviteDetails.invitedBy?.name} ({inviteDetails.invitedBy?.email})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-550 dark:text-zinc-400 font-medium">Your Role</span>
                    <span className="text-primary font-bold text-right capitalize">{inviteDetails.role}</span>
                  </div>
                </div>

                <p className="text-[11px] text-center text-zinc-500">
                  Accepting this invitation links your profile `{user?.email}` to this team workspace.
                </p>
              </CardContent>

              <CardFooter className="px-6 pb-8 pt-2 flex gap-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex-1 h-11 border-zinc-250 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-white rounded-xl gap-2 font-semibold text-xs"
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                >
                  <X className="w-4 h-4" />
                  Decline
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1 h-11 rounded-xl gap-2 font-semibold text-xs"
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                >
                  <Check className="w-4 h-4" />
                  Accept & Join
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">Invitation Details Unavailable</div>
          )}
        </main>
      </div>
    );
  }

  // General Portal: Send Invitations
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-zinc-900 dark:text-white font-sans">Workspace Invitations</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invite form: Only visible/usable if user is Admin or Manager */}
          <Card className="bg-white dark:bg-card/50 border border-zinc-200 dark:border-white/10 md:col-span-2 relative shadow-sm">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Invite Team Members
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Only team managers or administrators can issue workspace invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.role === "Member" ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-250 dark:border-white/10 rounded-xl space-y-3 bg-zinc-50 dark:bg-black/20">
                  <ShieldAlert className="w-10 h-10 text-amber-550 dark:text-amber-500" />
                  <h3 className="font-bold text-zinc-800 dark:text-white text-sm">Access Restricted</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                    Your current role is **Team Member**. You must be a **Manager** or **Platform Admin** to generate invitation links.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-zinc-700 dark:text-white text-xs font-semibold">Invitee Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="collaborator@company.com"
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        className="bg-zinc-50 dark:bg-black/40 border-zinc-250 dark:border-white/10 pl-10 text-xs h-10 text-foreground dark:text-white focus-visible:ring-primary"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="teamId" className="text-zinc-700 dark:text-white text-xs font-semibold">Select Team Workspace</Label>
                      {isTeamsLoading ? (
                        <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
                      ) : (
                        <select
                          id="teamId"
                          {...register("teamId", { required: "Please select a team" })}
                          className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg h-10 px-3 text-xs text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
                        >
                          <option value="" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Choose a team...</option>
                          {teams?.map((team) => (
                            <option key={team.id} value={team.id} className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">{team.name}</option>
                          ))}
                        </select>
                      )}
                      {errors.teamId && <p className="text-xs text-destructive mt-0.5">{errors.teamId.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-zinc-700 dark:text-white text-xs font-semibold">Assign Role</Label>
                      <select
                        id="role"
                        {...register("role")}
                        className="w-full bg-white dark:bg-black/40 border border-zinc-250 dark:border-white/10 rounded-lg h-10 px-3 text-xs text-zinc-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
                      >
                        <option value="Member" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Team Member</option>
                        <option value="Manager" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Manager</option>
                        <option value="Admin" className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">Admin</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 mt-2 text-xs font-bold gap-2"
                    disabled={inviteMutation.isPending}
                  >
                    <Plus className="w-4 h-4" />
                    {inviteMutation.isPending ? "Generating invite..." : "Generate Invitation"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Side card info */}
          <Card className="bg-white dark:bg-card/30 border border-zinc-200 dark:border-white/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Invitation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-550 dark:text-zinc-400 space-y-4 leading-relaxed font-medium">
              <p>
                - Invitations generate a secure link that can be visited by the invited user.
              </p>
              <p>
                - Recipients must register or log in using the invited email address to join the workspace.
              </p>
              <p>
                - Pending invitations expire automatically after **7 days** to ensure platform security.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Development Helper: Display mock invite link */}
        {simulatedMailLink && (
          <Card className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              Developer Mail Catch Helper
            </div>
            <p className="text-xs text-zinc-650 dark:text-zinc-350">
              An invitation token was printed in the backend console. You can copy the simulated invite link below to test the acceptance flow locally:
            </p>
            <div className="bg-zinc-50 dark:bg-black/60 p-3 rounded-lg border border-zinc-200 dark:border-white/5 font-mono text-xs text-zinc-800 dark:text-zinc-300 select-all break-all flex items-center justify-between gap-3">
              <span>{simulatedMailLink}</span>
              <a
                href={simulatedMailLink}
                className="text-primary hover:underline shrink-0 flex items-center gap-1 font-sans font-bold"
              >
                Go
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
