import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  Clock,
  Activity,
  Award,
  AlertCircle,
  ThumbsUp,
  BrainCircuit,
  MessageSquareCode,
} from "lucide-react";

interface AIInsightsDashboardProps {
  insight: {
    productivityScore: number;
    engagementScore: number;
    sentimentScore: number;
    sentimentAnalysis: string;
    participationScore: number;
    speakingTimeAnalytics: Record<string, number>;
    mostActiveParticipant: string;
    leastActiveParticipant: string;
    topicAnalysis: string[];
  } | null;
}

export function AIInsightsDashboard({ insight }: AIInsightsDashboardProps) {
  const speakingData = useMemo(() => {
    if (!insight?.speakingTimeAnalytics) return [];
    return Object.entries(insight.speakingTimeAnalytics).map(([name, pct]) => ({
      name,
      value: pct,
    }));
  }, [insight]);

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

  if (!insight) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card/20">
        <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mb-3 animate-pulse" />
        <p className="text-muted-foreground text-sm font-medium">No meeting insights generated yet.</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Generate AI summary to compile analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/45 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center border border-violet-500/20 shrink-0">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Productivity</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{insight.productivityScore}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/45 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Engagement</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{insight.engagementScore}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/45 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Participation</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{insight.participationScore}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/45 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <ThumbsUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sentiment</p>
              <h3 className="text-xl font-bold text-white mt-0.5">{insight.sentimentScore}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speaking time analytics */}
        <Card className="bg-card/30 border-white/5 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Speaking Distribution
            </CardTitle>
            <CardDescription className="text-xs">Dialogue contribution percentages</CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex flex-col items-center justify-center">
            {speakingData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No speaking distribution logs.</p>
            ) : (
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speakingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {speakingData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text representing dominant speaker */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Dominant</span>
                  <span className="text-[11px] font-bold text-white max-w-[80px] truncate text-center">
                    {insight.mostActiveParticipant}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Speaking bar chart & key contributors */}
        <Card className="bg-card/30 border-white/5 backdrop-blur-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Contributor Contributions
            </CardTitle>
            <CardDescription className="text-xs">Speech chunk counts by team members</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {speakingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No speaking analytics available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speakingData} layout="vertical" margin={{ left: 15, right: 10, top: 10, bottom: 10 }}>
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" name="Speaker %" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topics and Sentiment text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Analysis text */}
        <Card className="bg-card/30 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquareCode className="w-4 h-4 text-amber-400" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription className="text-xs">AI qualitative evaluation of meeting dynamics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "{insight.sentimentAnalysis}"
            </p>
            <div className="flex gap-4 border-t border-white/5 pt-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Most Active</span>
                <p className="font-bold text-white mt-0.5">{insight.mostActiveParticipant || "—"}</p>
              </div>
              <div className="border-l border-white/5 pl-4">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Least Active</span>
                <p className="font-bold text-white mt-0.5">{insight.leastActiveParticipant || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic model checklist */}
        <Card className="bg-card/30 border-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-400" />
              Key Discussion Topics
            </CardTitle>
            <CardDescription className="text-xs">Primary content themes captured by AI</CardDescription>
          </CardHeader>
          <CardContent>
            {insight.topicAnalysis.length === 0 ? (
              <p className="text-xs text-muted-foreground">No topic modeling completed.</p>
            ) : (
              <div className="space-y-2.5">
                {insight.topicAnalysis.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-muted/20 px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                      #{index + 1}
                    </div>
                    <span className="text-xs font-semibold text-white">{topic}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
