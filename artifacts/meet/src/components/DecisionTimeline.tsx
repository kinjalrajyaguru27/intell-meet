import { Calendar, User, ShieldAlert, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIDecision {
  id: string;
  meetingId: string;
  decision: string;
  owner: string;
  timestamp: string;
  impact: string;
  relatedTasks: string[];
}

interface DecisionTimelineProps {
  decisions: AIDecision[];
}

function formatDecisionTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DecisionTimeline({ decisions }: DecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/20">
        <Award className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm font-medium">No meeting decisions tracked yet.</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Generate AI summary to capture critical choices.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
      {decisions.map((item) => {
        const isHigh = item.impact === "High";
        const isLow = item.impact === "Low";
        const badgeColor = isHigh
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : isLow
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20";

        return (
          <div key={item.id} className="relative group">
            {/* Timeline bullet node */}
            <div
              className={`absolute -left-[28px] top-1.5 w-3 h-3 rounded-full border bg-[#09090b] transition-all group-hover:scale-125 ${
                isHigh
                  ? "border-red-500 shadow-sm shadow-red-500/30"
                  : isLow
                  ? "border-blue-500 shadow-sm shadow-blue-500/30"
                  : "border-amber-500 shadow-sm shadow-amber-500/30"
              }`}
            />

            {/* Decision content card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3.5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h4 className="text-sm font-semibold text-white leading-relaxed flex-1">
                  {item.decision}
                </h4>
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold leading-none shrink-0 ${badgeColor}`}>
                  {item.impact} Impact
                </Badge>
              </div>

              {/* Meta details footer */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-3 border-t border-white/5">
                <span className="flex items-center gap-1.5 font-medium text-white/90">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {item.owner || "All Teams"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDecisionTime(item.timestamp)}
                </span>
                {item.relatedTasks && item.relatedTasks.length > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {item.relatedTasks.length} linked tasks
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
