import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const tab = queryParams.get("tab") || "";

  // Parse path and tab to output breadcrumb segments
  const getSegments = () => {
    const segments: { label: string; href?: string }[] = [];

    // Dashboard routes
    if (location.startsWith("/dashboard/meeting")) {
      segments.push({ label: "Post-Meeting Dashboard", href: "/dashboard" });
      segments.push({ label: "Meeting Session Analytics" });
      return segments;
    }

    if (location.startsWith("/dashboard")) {
      segments.push({ label: "Dashboard", href: "/dashboard?tab=home" });
      if (tab === "home" || !tab) {
        segments.push({ label: "Overview" });
      } else if (tab === "meetings") {
        segments.push({ label: "Meetings Hub" });
      } else if (tab === "chat") {
        segments.push({ label: "Chat & Collaboration" });
      } else if (tab === "ai") {
        segments.push({ label: "AI Speech Intelligence" });
      } else {
        segments.push({ label: tab.toUpperCase() });
      }
      return segments;
    }

    // Kanban routes
    if (location.startsWith("/kanban")) {
      segments.push({ label: "Workspace Manager", href: "/kanban?tab=board" });
      if (tab === "board" || !tab) {
        segments.push({ label: "Kanban Board" });
      } else if (tab === "gantt") {
        segments.push({ label: "Gantt Timeline" });
      } else if (tab === "calendar") {
        segments.push({ label: "Team Calendar" });
      } else if (tab === "audit") {
        segments.push({ label: "Activity Audit Logs" });
      } else if (tab === "settings") {
        segments.push({ label: "Organization Configuration" });
      }
      return segments;
    }

    // Analytics routes
    if (location.startsWith("/analytics")) {
      segments.push({ label: "BI Analytics", href: "/analytics?tab=executive" });
      if (tab === "executive" || !tab) {
        segments.push({ label: "Executive Dashboard" });
      } else if (tab === "meetings") {
        segments.push({ label: "Meetings Telemetry" });
      } else if (tab === "chat") {
        segments.push({ label: "Collaboration Velocity" });
      } else if (tab === "teams") {
        segments.push({ label: "Team Performance" });
      } else if (tab === "projects") {
        segments.push({ label: "AI Forecasting Delays" });
      } else if (tab === "reports") {
        segments.push({ label: "Export Reports Center" });
      }
      return segments;
    }

    // Profile routes
    if (location.startsWith("/profile/edit")) {
      segments.push({ label: "User Account", href: "/profile" });
      segments.push({ label: "Preferences & Config" });
      return segments;
    }

    if (location.startsWith("/profile")) {
      segments.push({ label: "User Account" });
      return segments;
    }

    // Administration routes
    if (location.startsWith("/admin")) {
      segments.push({ label: "System Console", href: "/admin/users" });
      segments.push({ label: "Administration Control" });
      return segments;
    }

    // Default fallbacks
    const cleanPath = location.replace(/^\//, "");
    if (cleanPath) {
      segments.push({ label: cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1) });
    }

    return segments;
  };

  const items = getSegments();

  return (
    <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-400 select-none pb-4 md:pb-6">
      <Home className="w-3.5 h-3.5 hover:text-white cursor-pointer transition-colors" />
      {items.length > 0 && <ChevronRight className="w-3 h-3 text-zinc-600" />}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-1.5">
            {isLast ? (
              <span className="text-white font-bold">{item.label}</span>
            ) : (
              <span className="hover:text-white cursor-pointer transition-colors">
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 text-zinc-600" />}
          </div>
        );
      })}
    </div>
  );
}
