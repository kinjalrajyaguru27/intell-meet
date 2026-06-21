import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText, User, Calendar, Search, Shield, Users,
  FolderKanban, CheckSquare, Settings
} from "lucide-react";

interface ActivityLogViewProps {
  token: string | null;
  selectedOrgId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityLogView({ token, selectedOrgId }: ActivityLogViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchVal, setSearchVal] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedOrgId) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [selectedOrgId]);

  const fetchLogs = async () => {
    if (!token || !selectedOrgId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchVal.toLowerCase();
    const matchesSearch =
      log.action?.toLowerCase().includes(query) ||
      log.details?.toLowerCase().includes(query) ||
      log.userId?.name?.toLowerCase().includes(query);

    const matchesType = filterType === "all" || log.entityType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filtering and Search Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card/40 border border-white/10 p-4 rounded-xl items-end">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold pl-1">Search Audit Logs</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search user, detail description, action..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-xs h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold pl-1">Filter Entity</Label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-black/40 border border-white/10 h-9 rounded-md px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="all">All Entities</option>
            <option value="Organization">Organization</option>
            <option value="Team">Team Workspace</option>
            <option value="Project">Project</option>
            <option value="Task">Task Issue</option>
          </select>
        </div>
      </div>

      {/* Logs timeline list */}
      <Card className="bg-card/20 border-white/5 backdrop-blur-md">
        <CardHeader className="py-4 border-b border-white/5">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            Audit Action Trail Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Retrieving workspace audit history...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No audit logs captured for the current scope.
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const icons = {
                  Organization: <Shield className="w-4 h-4 text-primary shrink-0" />,
                  Team: <Users className="w-4 h-4 text-cyan-400 shrink-0" />,
                  Project: <FolderKanban className="w-4 h-4 text-emerald-400 shrink-0" />,
                  Task: <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                }[log.entityType as "Organization" | "Team" | "Project" | "Task"] || <Settings className="w-4 h-4 text-zinc-400 shrink-0" />;

                const actionSuffix = (log.action?.split("_")[1] || "update") as "create" | "update" | "delete";
                const actionStyle = {
                  create: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  update: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  delete: "bg-red-500/10 text-red-400 border-red-500/20",
                }[actionSuffix] || "bg-white/5 text-muted-foreground";

                return (
                  <div key={log._id} className="flex gap-4 items-start text-xs border-b border-white/5 pb-3.5 last:border-b-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {icons}
                    </div>
                    <div className="flex-1 space-y-1 text-left">
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {log.userId?.name || "System Automated"}
                          </span>
                          <span className="text-muted-foreground">({log.userId?.email || "api"})</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          {timeAgo(log.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] font-extrabold uppercase py-0.5 px-2.5 ${actionStyle}`}>
                          {log.action}
                        </Badge>
                        <span className="text-white/90 font-medium">
                          {log.details}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
