import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Settings as SettingsIcon, Palette, BellRing, Lock, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type SettingsTab = "general" | "theme" | "notifications" | "security";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  // General state toggles
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(false);

  // Theme states
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light" | "system">(() => {
    return (localStorage.getItem("theme") as any) || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", selectedTheme);
    const root = window.document.documentElement;
    if (selectedTheme === "dark") {
      root.classList.add("dark");
    } else if (selectedTheme === "light") {
      root.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [selectedTheme]);

  // Notification presets
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your configurations have been successfully updated.",
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg text-foreground dark:text-white font-sans">Settings Panel</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side Tab Navigation */}
        <div className="w-full lg:w-60 bg-white dark:bg-card border border-zinc-200 dark:border-border p-2 rounded-2xl space-y-0.5 shrink-0 shadow-sm">
          {([
            { value: "general", label: "General Settings", icon: Cog },
            { value: "theme", label: "Theme Options", icon: Palette },
            { value: "notifications", label: "Notifications Presets", icon: BellRing },
            { value: "security", label: "Security & Credentials", icon: Lock }
          ] as const).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Side Settings View */}
        <div className="flex-1 w-full bg-white dark:bg-card border border-zinc-200 dark:border-border rounded-2xl p-6 shadow-sm">
          <div className="space-y-6 min-h-[300px]">
            
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="border-b border-zinc-150 dark:border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-foreground dark:text-white">General Configurations</h3>
                  <p className="text-xs text-muted-foreground">Adjust productivity tracking and workspace options.</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics-opt" className="text-xs text-zinc-700 dark:text-zinc-300">Share anonymous diagnostic insights</Label>
                    <Switch id="analytics-opt" checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="offline-opt" className="text-xs text-zinc-700 dark:text-zinc-300">Enable offline caching features</Label>
                    <Switch id="offline-opt" checked={offlineSync} onCheckedChange={setOfflineSync} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-bold text-foreground">Visual Appearance</h3>
                  <p className="text-xs text-muted-foreground">Select a skin or synchronize with your operating system.</p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {(["dark", "light", "system"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTheme(t)}
                      className={`p-4 rounded-xl border text-center text-xs font-bold capitalize transition-all cursor-pointer ${
                        selectedTheme === t
                           ? "border-primary bg-primary/10 text-primary"
                           : "border-border bg-muted hover:bg-accent text-muted-foreground"
                       }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <div className="border-b border-zinc-150 dark:border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-foreground dark:text-white">Notifications Channels</h3>
                  <p className="text-xs text-muted-foreground">Configure where and how you receive alerts.</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-opt" className="text-xs text-zinc-700 dark:text-zinc-300">Deliver email digests weekly</Label>
                    <Switch id="email-opt" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-opt" className="text-xs text-zinc-700 dark:text-zinc-300">Display browser push notifications</Label>
                    <Switch id="push-opt" checked={pushAlerts} onCheckedChange={setPushAlerts} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mention-opt" className="text-xs text-zinc-700 dark:text-zinc-300">Alert on workspace mentions</Label>
                    <Switch id="mention-opt" checked={mentionAlerts} onCheckedChange={setMentionAlerts} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="border-b border-zinc-150 dark:border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-foreground dark:text-white">Security Credentials</h3>
                  <p className="text-xs text-muted-foreground">Manage password specifications and credentials integrity.</p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-4">
                    Security settings can be accessed and modified in detail inside your profile edit screen.
                  </p>
                  <Button size="sm" onClick={() => setLocation("/profile/edit?tab=security")} className="rounded-full text-xs font-semibold">
                    Go to Security Tab
                  </Button>
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end border-t border-zinc-200 dark:border-white/5 mt-6 pt-4">
            <Button size="sm" onClick={handleSave} className="rounded-full font-bold px-6 text-xs">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
