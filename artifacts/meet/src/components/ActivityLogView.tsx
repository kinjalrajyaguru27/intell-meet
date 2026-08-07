import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, User, Calendar, Search, Shield, Users,
  FolderKanban, CheckSquare, Settings, RefreshCw, Filter, Sparkles
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
      log.userId?.name?.toLowerCase().includes(query) ||
      log.userId?.email?.toLowerCase().includes(query);

    const matchesType = filterType === "all" || log.entityType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Filtering and Search Actions Bar */}
      <div className="bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 p-4 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-primary" />
            Search Audit Logs
          </Label>
          <div className="relative">
            <Input
              placeholder="Search by user name, action, or details..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-xs h-10 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider pl-0.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Filter Entity
          </Label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 h-10 rounded-xl px-3 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold cursor-pointer transition-all"
          >
            <option value="all" className="bg-white dark:bg-zinc-900">All Entities</option>
            <option value="Organization" className="bg-white dark:bg-zinc-900">Organization</option>
            <option value="Team" className="bg-white dark:bg-zinc-900">Team Workspace</option>
            <option value="Project" className="bg-white dark:bg-zinc-900">Project</option>
            <option value="Task" className="bg-white dark:bg-zinc-900">Task Issue</option>
          </select>
        </div>
      </div>

      {/* Logs timeline list */}
      <Card className="bg-white dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase text-slate-600 dark:text-zinc-400 tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Audit Action Trail Logs
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-extrabold text-[11px] ml-1">
              {filteredLogs.length}
            </span>
          </CardTitle>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchLogs}
            disabled={isLoading}
            className="h-8 px-2.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Retrieving workspace audit trail...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No activity records found</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Try clearing filters or search query to view logs</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => {
                const icons = {
                  Organization: <Shield className="w-4 h-4 shrink-0" />,
                  Team: <Users className="w-4 h-4 shrink-0" />,
                  Project: <FolderKanban className="w-4 h-4 shrink-0" />,
                  Task: <CheckSquare className="w-4 h-4 shrink-0" />
                }[log.entityType as "Organization" | "Team" | "Project" | "Task"] || <Settings className="w-4 h-4 shrink-0" />;

                const iconBoxStyles = {
                  Organization: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/50",
                  Team: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/50",
                  Project: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50",
                  Task: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/50"
                }[log.entityType as "Organization" | "Team" | "Project" | "Task"] || "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700";

                const actionRaw = (log.action || "").toLowerCase();
                const isCreate = actionRaw.includes("create");
                const isDelete = actionRaw.includes("delete") || actionRaw.includes("remove");
                
                const actionBadgeStyle = isCreate
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : isDelete
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
                  : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60";

                return (
                  <div key={log._id} className="p-4 flex gap-4 items-start hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBoxStyles}`}>
                      {icons}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {log.userId?.name || "System Automated"}
                          </span>
                          {log.userId?.email && (
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                              ({log.userId.email})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{timeAgo(log.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-md ${actionBadgeStyle}`}>
                          {log.action}
                        </Badge>

                        {log.details && (
                          <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                            {log.details}
                          </span>
                        )}
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
