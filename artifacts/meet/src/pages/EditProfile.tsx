import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useGetUserProfile, useUpdateUserProfile, useChangePassword } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  Briefcase,
  Building,
  Globe,
  Bell,
  Lock,
  ArrowLeft,
  Save,
  Check
} from "lucide-react";

// Curated avatar background gradients
const AVATAR_PRESETS = [
  "linear-gradient(to right, #8b5cf6, #6366f1)", // violet-indigo
  "linear-gradient(to right, #10b981, #14b8a6)", // emerald-teal
  "linear-gradient(to right, #ec4899, #f43f5e)", // pink-rose
  "linear-gradient(to right, #06b6d4, #3b82f6)", // cyan-blue
  "linear-gradient(to right, #d946ef, #a21caf)", // fuchsia-purple
  "linear-gradient(to right, #f59e0b, #ef4444)", // amber-red
];

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser: updateAuthSession } = useAuth();
  
  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const changePasswordMutation = useChangePassword();

  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"edit" | "avatar" | "security" | "password" | "sessions">("edit");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    if (tabParam === "avatar") {
      setActiveTab("avatar");
    } else if (tabParam === "security" || tabParam === "password") {
      setActiveTab("security");
      setIsPasswordOpen(true);
    } else if (tabParam === "sessions") {
      setActiveTab("sessions");
    } else {
      setActiveTab("edit");
    }
  }, [window.location.search]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      phoneNumber: "",
      jobTitle: "",
      department: "",
      bio: "",
      timezone: "UTC",
      notifyEmail: true,
      notifyPush: true,
      notifySMS: false,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    }
  });

  // Prepopulate form on profile load
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        phoneNumber: profile.phoneNumber || "",
        jobTitle: profile.jobTitle || "",
        department: profile.department || "",
        bio: profile.bio || "",
        timezone: profile.timezone || "UTC",
        notifyEmail: profile.notificationSettings?.email ?? true,
        notifyPush: profile.notificationSettings?.push ?? true,
        notifySMS: profile.notificationSettings?.sms ?? false,
      });
      setSelectedAvatar(profile.avatar || AVATAR_PRESETS[0]);
    }
  }, [profile, reset]);

  const onProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(
      {
        data: {
          name: data.name,
          phoneNumber: data.phoneNumber,
          jobTitle: data.jobTitle,
          department: data.department,
          bio: data.bio,
          timezone: data.timezone,
          avatar: selectedAvatar,
          notificationSettings: {
            email: data.notifyEmail,
            push: data.notifyPush,
            sms: data.notifySMS,
          },
        },
      },
      {
        onSuccess: (updated) => {
          updateAuthSession(updated as any);
          toast({
            title: "Profile saved",
            description: "Your details have been updated successfully.",
          });
          setLocation("/profile");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to save profile",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onPasswordSubmit = (data: any) => {
    if (data.newPassword !== data.confirmNewPassword) {
      toast({
        title: "Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(
      {
        data: {
          oldPassword: data.oldPassword || "",
          newPassword: data.newPassword,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Password updated",
            description: "Your password has been updated.",
          });
          setIsPasswordOpen(false);
          resetPassword();
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.message || "Failed to update password",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <button
            onClick={() => setLocation("/profile")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPasswordOpen(true)}
            className="gap-1.5 rounded-full px-4 text-xs font-semibold border-white/10 hover:bg-white/5 text-white"
          >
            <Lock className="w-3.5 h-3.5" />
            {profile?.hasPassword ? "Change Password" : "Set Password"}
          </Button>
        </div>

        {/* Edit Form */}
        {activeTab !== "sessions" && (
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-xl border border-white/10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
            
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Edit Profile Details</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Manage your public metadata and settings on the platform
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Avatar Preset Picker */}
              <div className="space-y-2">
                <Label className="text-white text-xs font-semibold">Profile Color Identity</Label>
                <div className="flex items-center gap-4 py-2">
                  <div 
                    className="w-16 h-16 rounded-full border-2 border-primary shrink-0 transition-all shadow-lg overflow-hidden flex items-center justify-center"
                    style={{ background: selectedAvatar.startsWith("http") ? "transparent" : selectedAvatar }}
                  >
                    {selectedAvatar.startsWith("http") ? (
                      <img src={selectedAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {profile?.name ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedAvatar(preset)}
                        className="w-9 h-9 rounded-full border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center relative"
                        style={{ background: preset }}
                      >
                        {selectedAvatar === preset && (
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                    
                    {profile?.profilePicture && (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(profile.profilePicture!)}
                        className="w-9 h-9 rounded-full border-2 border-dashed border-primary/40 overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center relative"
                      >
                        <img src={profile.profilePicture} alt="Google Profile" className="w-full h-full object-cover" />
                        {selectedAvatar === profile.profilePicture && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-white text-xs font-semibold">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-10 text-white"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber" className="text-white text-xs font-semibold">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      placeholder="+1 (555) 000-0000"
                      {...register("phoneNumber")}
                      className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle" className="text-white text-xs font-semibold">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="jobTitle"
                      placeholder="Senior Project Manager"
                      {...register("jobTitle")}
                      className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-white text-xs font-semibold">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="Engineering"
                      {...register("department")}
                      className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="bio" className="text-white text-xs font-semibold">Biography</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    {...register("bio")}
                    className="bg-black/40 border-white/10 text-sm focus-visible:ring-primary min-h-[80px] text-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="timezone" className="text-white text-xs font-semibold">Timezone</Label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      id="timezone"
                      {...register("timezone")}
                      className="w-full bg-black/40 border border-white/10 rounded-lg h-10 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="America/New_York">Eastern Time (EST, GMT-5)</option>
                      <option value="America/Chicago">Central Time (CST, GMT-6)</option>
                      <option value="America/Denver">Mountain Time (MST, GMT-7)</option>
                      <option value="America/Los_Angeles">Pacific Time (PST, GMT-8)</option>
                      <option value="Europe/London">London (GMT+0 / GMT+1)</option>
                      <option value="Europe/Paris">Paris (GMT+1 / GMT+2)</option>
                      <option value="Asia/Kolkata">India Standard Time (IST, GMT+5:30)</option>
                      <option value="Asia/Tokyo">Japan Standard Time (JST, GMT+9)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <Label className="text-white text-xs font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notifications Channels
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/25 p-4 rounded-xl border border-white/5">
                  <label className="flex items-center space-x-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("notifyEmail")}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary accent-primary"
                    />
                    <span>Email Alerts</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("notifyPush")}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary accent-primary"
                    />
                    <span>Push Notifications</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("notifySMS")}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary accent-primary"
                    />
                    <span>SMS Alerts</span>
                  </label>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-white/5 px-6 py-4 flex justify-end gap-3 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/profile")}
                className="text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5 rounded-full px-5 text-xs font-semibold shadow-md shadow-primary/10"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-3.5 h-3.5" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {activeTab === "sessions" && (
        <Card className="bg-card/50 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Active Browser Sessions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Review and sign out of other active browser sessions on this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/25 border border-white/5 text-xs">
              <div>
                <p className="font-bold text-white">Google Chrome • Windows 10</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">Current Session • 192.168.1.100</p>
              </div>
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full text-[9px]">Active Now</Badge>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/25 border border-white/5 text-xs">
              <div>
                <p className="font-bold text-white">Apple Safari • iOS 16.5</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">Last active 2 hours ago • Paris, FR</p>
              </div>
              <Button variant="ghost" className="h-7 text-[10px] text-rose-450 hover:text-rose-400 hover:bg-rose-500/5 px-2.5 rounded-lg border border-rose-500/10 font-bold">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#09090b] border border-white/10 text-white rounded-2xl">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                {profile?.hasPassword ? "Change Password" : "Set Password"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              {profile?.hasPassword && (
                <div className="space-y-1.5">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...registerPassword("oldPassword", { required: true })}
                    className="bg-black/40 border-white/10 text-xs h-9 text-white focus-visible:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword", { required: true, minLength: 8 })}
                  className="bg-black/40 border-white/10 text-xs h-9 text-white focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  {...registerPassword("confirmNewPassword", { required: true })}
                  className="bg-black/40 border-white/10 text-xs h-9 text-white focus-visible:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordOpen(false)}
                className="border-white/10 hover:bg-white/5 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
