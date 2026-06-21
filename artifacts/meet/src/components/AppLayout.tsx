import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Search, Bell, Command } from "lucide-react";
import { COLOR_MAP } from "@/pages/EditProfile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // Sidebar state settings
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    
    // Command bar search redirects: E.g. search pages or search in dashboards
    if (globalSearch.toLowerCase().includes("kanban") || globalSearch.toLowerCase().includes("task")) {
      setLocation(`/kanban?tab=board&search=${encodeURIComponent(globalSearch)}`);
    } else if (globalSearch.toLowerCase().includes("analytic") || globalSearch.toLowerCase().includes("report")) {
      setLocation(`/analytics?tab=executive`);
    } else {
      setLocation(`/dashboard?tab=home&search=${encodeURIComponent(globalSearch)}`);
    }
    setGlobalSearch("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Universal Responsive Sidebar Drawer */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Primary Layout Viewport Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        {/* Top Command and Header Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle (For both mobile drawer and desktop collapse) */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="w-9 h-9 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Global Search Command Bar Form */}
            <form onSubmit={handleGlobalSearchSubmit} className="hidden sm:flex items-center relative w-64 md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Global Search Tasks, Projects, Audits..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
              />
              <div className="absolute right-2 top-2 px-1 py-0.5 rounded bg-muted border border-border text-[9px] text-muted-foreground font-bold flex items-center gap-0.5 pointer-events-none">
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </form>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/notifications")}
              className="w-9 h-9 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </Button>

            {/* User Avatar */}
            <Avatar
              className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0 transition-transform active:scale-95 overflow-hidden flex items-center justify-center"
              onClick={() => setLocation("/profile")}
              title="View Profile"
            >
              {user?.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div 
                  className="w-full h-full text-white font-bold text-xs flex items-center justify-center rounded-lg"
                  style={{ background: COLOR_MAP[user?.profileColor || "purple"] || COLOR_MAP.purple }}
                >
                  {getInitials(user?.name || "")}
                </div>
              )}
            </Avatar>
          </div>
        </header>

        {/* Viewport page container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col min-h-0">
          {/* Breadcrumb Navigation Trail */}
          <Breadcrumb />

          {/* Main page children */}
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
