import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetUserProfile, useGoogleDisconnect, useGoogleLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { COLOR_MAP } from "./EditProfile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Globe,
  Bell,
  Calendar,
  Shield,
  Edit,
  ArrowLeft
} from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useGetUserProfile();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "connected">("profile");
  const [gsiLoaded, setGsiLoaded] = useState(true);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam === "connected") {
      setActiveTab("connected");
    } else {
      setActiveTab("profile");
    }
  }, [window.location.search]);

  const disconnectMutation = useGoogleDisconnect();
  const googleLoginMutation = useGoogleLogin();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "335439563229-placeholder.apps.googleusercontent.com";

  // Handle redirect callback (Google implicit flow fallback for linking)
  useEffect(() => {
    let idToken = sessionStorage.getItem("google_id_token");
    if (idToken) {
      sessionStorage.removeItem("google_id_token");
    } else {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        idToken = params.get("id_token");
        if (idToken) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }

    if (idToken) {
      googleLoginMutation.mutate(
        { data: { idToken } },
        {
          onSuccess: (res) => {
            toast({
              title: "Account Linked",
              description: "Google account successfully linked.",
            });
            queryClient.invalidateQueries({ queryKey: ["/users/profile"] });
          },
          onError: (err: any) => {
            toast({
              title: "Account linking failed",
              description: err.message || "Something went wrong.",
              variant: "destructive",
            });
          },
        }
      );
    }
  }, [googleLoginMutation, toast, queryClient]);

  useEffect(() => {
    let checkInterval: any = null;
    if (profile && !profile.googleId) {
      const initializeGoogleLink = () => {
        if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
          try {
            const isDark = document.documentElement.classList.contains("dark");
            (window as any).google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (response: any) => {
                const idToken = response.credential;
                googleLoginMutation.mutate(
                  { data: { idToken } },
                  {
                    onSuccess: (res) => {
                      toast({
                        title: "Account Linked",
                        description: "Google account successfully linked.",
                      });
                      queryClient.invalidateQueries({ queryKey: ["/users/profile"] });
                    },
                    onError: (err: any) => {
                      toast({
                        title: "Account linking failed",
                        description: err.message || "Something went wrong.",
                        variant: "destructive",
                      });
                    },
                  }
                );
              },
            });

            const btnEl = document.getElementById("google-link-btn");
            if (btnEl) {
              (window as any).google.accounts.id.renderButton(btnEl, {
                theme: isDark ? "dark" : "outline",
                size: "medium",
                text: "signup_with",
                shape: "rectangular",
              });

              // Successfully rendered, check if iframe actually loads
              setTimeout(() => {
                if (!btnEl.querySelector("iframe")) {
                  setGsiLoaded(false);
                }
              }, 1500);
            }
          } catch (e) {
            console.error("Failed to initialize Google linking", e);
            setGsiLoaded(false);
          }
        }
      };

      let attempts = 0;
      if ((window as any).google?.accounts?.id) {
        initializeGoogleLink();
      } else {
        checkInterval = setInterval(() => {
          attempts++;
          if ((window as any).google?.accounts?.id) {
            initializeGoogleLink();
            clearInterval(checkInterval);
          } else if (attempts > 10) { // After 5 seconds, fallback
            setGsiLoaded(false);
            clearInterval(checkInterval);
          }
        }, 500);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [profile, googleClientId, googleLoginMutation, toast, queryClient]);

  const handleGoogleRedirectLink = () => {
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const redirectUri = encodeURIComponent(`${window.location.origin}`);
    const state = encodeURIComponent('/profile?tab=connected');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}&state=${state}`;
    window.location.href = googleAuthUrl;
  };

  const handleDisconnectGoogle = () => {
    if (!profile?.hasPassword) {
      toast({
        title: "Cannot Disconnect",
        description: "You must set a local password first before disconnecting your Google account.",
        variant: "destructive",
      });
      return;
    }

    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Account Disconnected",
          description: "Google account disconnected successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/users/profile"] });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to disconnect",
          description: err.message || "Something went wrong.",
          variant: "destructive",
        });
      },
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recent Member";
    return new Date(isoString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to load profile</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Make sure you are logged in and connected to the database before viewing.
        </p>
        <Button onClick={() => setLocation("/")} size="sm">
          Go back Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back and Edit Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <Button
          size="sm"
          onClick={() => setLocation("/profile/edit")}
          className="gap-1.5 rounded-full px-4 text-xs font-semibold shadow-md shadow-primary/10 hover:scale-[1.02] transition-transform duration-200"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit Profile
        </Button>
      </div>

      {activeTab === "profile" && (
        <>
          {/* Profile Card Main */}
          <Card className="bg-white dark:bg-card/50 border border-zinc-200 dark:border-white/10 overflow-hidden relative shadow-2xl animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
            
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Large Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="w-24 h-24 rounded-full border-4 border-primary/20 shadow-xl overflow-hidden flex items-center justify-center">
                    {profile.avatar && (profile.avatar.startsWith("http") || profile.avatar.startsWith("/")) ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div 
                        className="w-full h-full text-white font-bold text-3xl flex items-center justify-center"
                        style={{ background: COLOR_MAP[(profile as any).profileColor || "purple"] || COLOR_MAP.purple }}
                      >
                        {getInitials(profile.name)}
                      </div>
                    )}
                  </Avatar>
                </div>

                {/* Basic metadata */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground dark:text-white">{profile.name}</h1>
                    <div className="flex justify-center md:justify-start">
                      <Badge className="bg-primary/15 text-primary border-primary/20 rounded-full text-[10px] font-bold px-2.5 py-0.5 capitalize shrink-0">
                        {profile.role}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-550 dark:text-zinc-400 font-medium">
                    {profile.jobTitle || "No Job Title Defined"} 
                    {profile.department && <span className="text-zinc-400 dark:text-zinc-600"> • </span>} 
                    <span className="text-primary font-semibold">{profile.department || ""}</span>
                  </p>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed italic">
                    "{profile.bio || "This user hasn't written a biography yet."}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed details cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile metadata */}
            <Card className="bg-white dark:bg-card/30 border border-zinc-200 dark:border-white/5 shadow-sm">
              <CardHeader className="border-b border-zinc-100 dark:border-white/5 pb-3">
                <CardTitle className="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2 font-medium">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Email Address
                  </span>
                  <span className="text-foreground dark:text-white font-semibold">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2 font-medium">
                    <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Phone Number
                  </span>
                  <span className="text-foreground dark:text-white font-semibold">{profile.phoneNumber || "Not Specified"}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2 font-medium">
                    <Globe className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Timezone
                  </span>
                  <span className="text-foreground dark:text-white font-semibold">{profile.timezone || "UTC"}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    Date Joined
                  </span>
                  <span className="text-foreground dark:text-white font-semibold">{formatDate(profile.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Preferences and settings */}
            <Card className="bg-white dark:bg-card/30 border border-zinc-200 dark:border-white/5 shadow-sm">
              <CardHeader className="border-b border-zinc-100 dark:border-white/5 pb-3">
                <CardTitle className="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notification Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-550 dark:text-zinc-400 font-medium">Email Alerts</span>
                  <Badge variant={profile.notificationSettings?.email ? "default" : "secondary"} className="rounded-full text-[9px] px-1.5 font-bold">
                    {profile.notificationSettings?.email ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-550 dark:text-zinc-400 font-medium">Push Notifications</span>
                  <Badge variant={profile.notificationSettings?.push ? "default" : "secondary"} className="rounded-full text-[9px] px-1.5 font-bold">
                    {profile.notificationSettings?.push ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-550 dark:text-zinc-400 font-medium">SMS Notifications</span>
                  <Badge variant={profile.notificationSettings?.sms ? "default" : "secondary"} className="rounded-full text-[9px] px-1.5 font-bold">
                    {profile.notificationSettings?.sms ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Security & Connected Accounts */}
      {(activeTab === "profile" || activeTab === "connected") && (
        <Card className="bg-white dark:bg-card/30 border border-zinc-200 dark:border-white/5 shadow-sm">
          <CardHeader className="border-b border-zinc-100 dark:border-white/5 pb-3">
            <CardTitle className="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Connected Accounts & Security
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-450">
              Manage your connected login providers and authentication settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center border border-zinc-200 dark:border-white/10 shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-white">Google Authentication</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {profile.googleId 
                      ? "Connected via Google Auth"
                      : "Not connected to a Google account"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile.googleId ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={disconnectMutation.isPending}
                    onClick={handleDisconnectGoogle}
                    className="text-xs h-9 px-4 rounded-xl"
                  >
                    {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Google"}
                  </Button>
                ) : (
                  <div className="relative">
                    {!gsiLoaded ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleRedirectLink}
                        className="h-9 flex items-center justify-center gap-2 bg-white dark:bg-[#1e1e20] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/10 font-bold px-4 rounded-xl transition-all duration-200"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Connect Google Account
                      </Button>
                    ) : (
                      <div id="google-link-btn" className="min-h-[40px]" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center border border-zinc-200 dark:border-white/10 shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-white">Standard Login</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {profile.hasPassword 
                      ? "Password set. You can sign in using your email and password."
                      : "No password set. Sign in exclusively using Google OAuth."}
                  </p>
                </div>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/profile/edit")}
                  className="text-xs border-zinc-250 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-foreground dark:text-white h-9 px-4 rounded-xl font-semibold"
                >
                  {profile.hasPassword ? "Change Password" : "Set Local Password"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
