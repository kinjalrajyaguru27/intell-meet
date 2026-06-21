import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIInsightsDashboard } from "@/components/AIInsightsDashboard";
import { DecisionTimeline } from "@/components/DecisionTimeline";
import { FollowUpGenerator } from "@/components/FollowUpGenerator";
import {
  Brain,
  Video,
  Clock,
  Users,
  Calendar,
  Sparkles,
  FileText,
  TrendingUp,
  MessageSquare,
  Award,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function AIInsights() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, token } = useAuth();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Loaded meeting data
  const [meetingDetail, setMeetingDetail] = useState<any | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token]);

  useEffect(() => {
    if (selectedMeetingId && token) {
      loadMeetingData(selectedMeetingId);
    } else {
      setMeetingDetail(null);
      setInsights(null);
      setDecisions([]);
      setTranscripts([]);
      setSummaries([]);
    }
  }, [selectedMeetingId]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter past/ended meetings that might have summaries
        const ended = data.filter((m: any) => m.endedAt);
        setMeetings(ended);
        if (ended.length > 0) {
          setSelectedMeetingId(ended[0].id || ended[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMeetingData = async (meetingId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch meeting details
      const meetingRes = await fetch(`/api/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let mData = null;
      if (meetingRes.ok) {
        mData = await meetingRes.json();
        setMeetingDetail(mData);
      }

      // 2. Fetch insights
      const insightsRes = await fetch(`/api/ai/insights?meetingId=${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (insightsRes.ok) {
        setInsights(await insightsRes.json());
      } else {
        setInsights(null);
      }

      // 3. Fetch decisions
      const decisionsRes = await fetch(`/api/ai/decisions?meetingId=${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (decisionsRes.ok) {
        setDecisions(await decisionsRes.json());
      } else {
        setDecisions([]);
      }

      // 4. Fetch transcripts
      const transcriptsRes = await fetch(`/api/ai/transcripts?meetingId=${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (transcriptsRes.ok) {
        setTranscripts(await transcriptsRes.json());
      } else {
        setTranscripts([]);
      }

      // 5. Fetch summaries
      const summariesRes = await fetch(`/api/ai/summaries?meetingId=${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summariesRes.ok) {
        setSummaries(await summariesRes.json());
      } else {
        setSummaries([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-violet-400 animate-pulse" />
          <h1 className="font-semibold text-lg text-white font-sans">AI Meeting Intelligence</h1>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-zinc-500" />
          <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
            <SelectTrigger className="w-64 bg-black/40 border-white/10 h-9 text-xs">
              <SelectValue placeholder="Select a past meeting" />
            </SelectTrigger>
            <SelectContent>
              {meetings.map((m) => (
                <SelectItem key={m.id || m._id} value={m.id || m._id}>
                  {m.title || m.name} ({formatDate(m.startedAt)})
                </SelectItem>
              ))}
              {meetings.length === 0 && (
                <SelectItem value="none" disabled>
                  No past meetings available.
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Parsing AI models...</span>
        </div>
      ) : !meetingDetail ? (
        <div className="py-20 text-center bg-card/20 border border-white/5 rounded-2xl flex flex-col items-center">
          <Brain className="w-12 h-12 text-zinc-700/50 mb-4 animate-pulse" />
          <h3 className="font-semibold text-sm mb-1 text-white">No Meeting Selected</h3>
          <p className="text-xs text-zinc-500 max-w-xs">
            Please choose a completed session from the dropdown to run AI analytics.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick meeting stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card border border-white/5 p-4 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Meeting Name</span>
              <span className="text-xs font-bold text-white block truncate">{meetingDetail.title || meetingDetail.name}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Date & Time</span>
              <span className="text-xs font-bold text-zinc-300 block">{formatDate(meetingDetail.startedAt)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Duration</span>
              <span className="text-xs font-bold text-zinc-300 block">{formatDuration(meetingDetail.durationSeconds)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Participants</span>
              <span className="text-xs font-bold text-zinc-300 block truncate">
                {meetingDetail.participantNames?.join(", ") || "None"}
              </span>
            </div>
          </div>

          {/* Tabs switch panel */}
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/20 border border-white/5 rounded-xl h-10 p-1">
              <TabsTrigger value="insights" className="text-xs font-semibold">Insights Dashboard</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs font-semibold">AI Summaries</TabsTrigger>
              <TabsTrigger value="decisions" className="text-xs font-semibold">Decisions</TabsTrigger>
              <TabsTrigger value="transcripts" className="text-xs font-semibold">Transcripts</TabsTrigger>
              <TabsTrigger value="followups" className="text-xs font-semibold">Follow-up Recap</TabsTrigger>
            </TabsList>

            {/* Tab 1: Insights Dashboard */}
            <TabsContent value="insights" className="pt-4">
              <AIInsightsDashboard insight={insights} />
            </TabsContent>

            {/* Tab 2: AI Summaries */}
            <TabsContent value="summary" className="pt-4 space-y-4">
              {summaries.length === 0 ? (
                <div className="text-center py-16 text-xs text-zinc-500">
                  No AI summaries generated for this meeting.
                </div>
              ) : (
                summaries.map((s) => (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main short/detailed summaries */}
                    <div className="md:col-span-2 space-y-4">
                      <Card className="bg-card border-white/5 rounded-2xl">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs leading-relaxed text-zinc-300 space-y-3 font-sans">
                          <p className="italic">"{s.shortSummary}"</p>
                          <div className="h-px bg-white/5" />
                          <p className="whitespace-pre-wrap">{s.executiveSummary || s.detailedSummary}</p>
                        </CardContent>
                      </Card>

                      {s.keyPoints && s.keyPoints.length > 0 && (
                        <Card className="bg-card border-white/5 rounded-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-white">Key Discussion Points</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc pl-4 text-xs space-y-1.5 text-zinc-300">
                              {s.keyPoints.map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Side card containing outcomes, risks, opportunities */}
                    <div className="space-y-4">
                      <Card className="bg-card border-white/5 rounded-2xl">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            Meeting Outcomes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-zinc-300">
                          {s.outcomes && s.outcomes.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1.5">
                              {s.outcomes.map((ot: string, i: number) => <li key={i}>{ot}</li>)}
                            </ul>
                          ) : (
                            <span className="italic text-zinc-500">None logged</span>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-white/5 rounded-2xl">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-bold text-white flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            Identified Risks & Roadblocks
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-zinc-300">
                          {s.risks && s.risks.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1.5">
                              {s.risks.map((rk: string, i: number) => <li key={i}>{rk}</li>)}
                            </ul>
                          ) : (
                            <span className="italic text-zinc-500">None detected</span>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Decisions */}
            <TabsContent value="decisions" className="pt-4">
              <DecisionTimeline decisions={decisions} />
            </TabsContent>

            {/* Tab 4: Transcripts */}
            <TabsContent value="transcripts" className="pt-4">
              <Card className="bg-card border-white/5 rounded-2xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    Full Meeting Transcript Logs
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/5 text-zinc-400">
                    {transcripts.length} dialogue lines
                  </Badge>
                </CardHeader>
                <CardContent className="max-h-[450px] overflow-y-auto space-y-4 pt-2 font-sans">
                  {transcripts.map((t) => (
                    <div key={t.id} className="flex gap-3 text-xs items-start">
                      <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 font-bold flex items-center justify-center shrink-0">
                        {t.speaker?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                          <span className="font-bold text-zinc-300">{t.speaker}</span>
                          <span>•</span>
                          <span>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ""}</span>
                        </div>
                        <p className="text-white/85 bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">{t.text}</p>
                      </div>
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 italic">No transcript recorded for this session.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Followups recap */}
            <TabsContent value="followups" className="pt-4">
              {/* Prepare data for FollowUpGenerator */}
              {(() => {
                const meetData = {
                  name: meetingDetail.title || meetingDetail.name,
                  startedAt: meetingDetail.startedAt,
                  durationSeconds: meetingDetail.durationSeconds,
                  participantNames: meetingDetail.participantNames || [],
                  notes: summaries.length > 0 ? summaries[0].shortSummary : "",
                  actionItems: meetingDetail.actionItems?.map((ai: any) => ({
                    text: ai.text || ai.title,
                    assigneeName: ai.assigneeName,
                    dueDate: ai.dueDate,
                    isDone: ai.isDone || false,
                  })) || [],
                };
                const decData = decisions.map((d) => ({
                  decision: d.decision,
                  owner: d.owner,
                  impact: d.impact,
                }));

                return <FollowUpGenerator meeting={meetData} decisions={decData} />;
              })()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
