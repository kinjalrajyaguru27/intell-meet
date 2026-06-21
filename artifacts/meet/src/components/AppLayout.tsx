import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Search, Bell, Command } from "lucide-react";

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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
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
    <div className="min-h-screen bg-[#09090b] text-foreground flex">
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
        <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between shrink-0">
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
              className="w-9 h-9 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Global Search Command Bar Form */}
            <form onSubmit={handleGlobalSearchSubmit} className="hidden sm:flex items-center relative w-64 md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Global Search Tasks, Projects, Audits..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
              />
              <div className="absolute right-2 top-2 px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-zinc-500 font-bold flex items-center gap-0.5 pointer-events-none">
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
              className="w-9 h-9 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </Button>

            {/* User Avatar */}
            <Avatar
              className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer shrink-0 transition-transform active:scale-95"
              onClick={() => setLocation("/profile")}
              title="View Profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-lg">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
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
