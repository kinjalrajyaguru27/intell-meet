import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  Sparkles,
  Brain,
  FolderKanban,
  Zap,
  ArrowRight,
  BarChart3,
  LogIn,
  UserPlus,
  LayoutGrid,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";

export default function LandingHome() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Default theme is light mode
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme === "dark" || savedTheme === "light") ? savedTheme : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleStartInstantMeeting = () => {
    if (isAuthenticated) {
      setLocation("/meetings");
    } else {
      setLocation("/register");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic SEO JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Intelmeet",
            "operatingSystem": "Web Browser",
            "applicationCategory": "BusinessApplication",
            "description": "AI-powered video conferencing platform with real-time speech transcription, automated meeting summaries, and workspace collaboration.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
          }),
        }}
      />

      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-8">
          <a
            href="/"
            className="flex items-center gap-2.5 text-lg font-extrabold group"
            title="Intell Meet - AI Video Conferencing"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold tracking-wider uppercase text-slate-900 dark:text-white text-base sm:text-lg">
              Intell Meet
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
              How It Works
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Header Theme Switcher Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            id="header-theme-toggle-btn"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-slate-600 dark:text-slate-400">
                Hi, <strong className="text-slate-900 dark:text-slate-200">{user?.name || "User"}</strong>
              </span>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full px-4 h-9 gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setLocation("/login")}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full px-4 h-9 gap-1.5"
                id="header-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
              <Button
                onClick={() => setLocation("/register")}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full px-4 h-9 gap-1.5 shadow-md shadow-indigo-500/25 border border-indigo-400/20"
                id="header-register-btn"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register Free
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        {/* 2. Hero Section (Above the Fold) */}
        <section className="relative overflow-hidden pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/15 to-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Next-Gen WebRTC Video Calls + AI Insights</span>
          </div>

          {/* H1 Primary Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Smarter Video Meetings with Real-Time{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 dark:from-violet-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
              AI Insights & Collaboration
            </span>
          </h1>

          {/* Subtext Paragraph */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Host HD zero-latency WebRTC video conferences with automated AI speech transcription,
            smart meeting summaries, and integrated Kanban task management.
          </p>


          {/* Interactive Hero Product Preview Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/70 shadow-2xl overflow-hidden backdrop-blur-md p-3 sm:p-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">intelmeet://live-room-preview</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-0.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  LIVE REC + AI TRANSCRIPT
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Video Grid Mockup */}
              <div className="lg:col-span-2 space-y-3">
                <div className="relative aspect-video rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
                  <div className="w-20 h-20 rounded-full bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                    K
                  </div>
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                    <span className="text-xs font-semibold text-white bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-white/10">
                      Kinjal (Product Lead)
                    </span>
                    <Badge className="bg-indigo-600 text-[10px] text-white py-0.5">Host</Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-slate-300 font-mono">1080p HD</span>
                  </div>
                </div>

                {/* Speaker tiles */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                    Sarah M.
                  </div>
                  <div className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                    Alex K.
                  </div>
                  <div className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400">
                    Team Screen
                  </div>
                </div>
              </div>

              {/* Real-time AI Transcript Panel Mockup */}
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Live AI Transcript
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Auto-Detecting</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-0.5 shadow-sm dark:shadow-none">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">Kinjal • 10:14 AM</span>
                      <p className="text-slate-700 dark:text-slate-300">"Let me showcase the new sprint goals and real-time AI summary tools."</p>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 space-y-0.5">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-cyan-300">AI Assistant Highlight</span>
                      <p className="text-slate-800 dark:text-slate-200">✨ Action Item Detected: Schedule Q3 architecture review on Kanban board.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Captions Active</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">99.4% Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Social Proof Bar */}
        <section className="border-y border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/40 py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Trusted by modern product teams, engineers & global organizations
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">99.99%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Uptime SLA</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Encrypted WebRTC</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core Features Showcase Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30">
              Powerful Capabilities
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything You Need for High-Impact Collaboration
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Built from the ground up for modern teams who require fast video calls, clear AI documentation, and task execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-md dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Real-Time AI Transcripts & Summaries</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatically transcribe live speech into searchable text, capture key discussion takeaways, and generate executive summaries.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-md dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Instant & Scheduled Video Rooms</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Start zero-install HD WebRTC meetings with 1-click room codes, host lobby controls, screen sharing, and recording.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-md dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-cyan-100 dark:bg-cyan-600/20 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Integrated Kanban Task Board</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Turn meeting action items directly into trackable tasks on Kanban boards and personal Todo lists without switching apps.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-300 shadow-md dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10">
              <CardContent className="p-6 space-y-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Team Management & Analytics</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Organize team spaces, monitor meeting usage analytics, manage organization roles, and log collaboration events securely.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. "How It Works" 3-Step Process */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/10">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30">
              Simple Workflow
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              3 Simple Steps to Smarter Meetings
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Get started in under 30 seconds with no complex software installation required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 relative shadow-md dark:shadow-none">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create or Join a Room</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate a unique meeting room link or enter a room code instantly. Customize waiting room preferences and invites.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 relative shadow-md dark:shadow-none">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Host with AI Assistance</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Conduct HD video conferences with live captions, real-time speech transcription, and interactive screen sharing.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 relative shadow-md dark:shadow-none">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automate Tasks & Summaries</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Review automated meeting notes, export AI insights, and assign action items directly onto your team's Kanban board.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Bottom CTA Banner */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 dark:from-violet-900 dark:via-indigo-900 dark:to-slate-900 border border-indigo-400/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl space-y-6">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight relative z-10">
              Ready to Experience Smarter AI Video Meetings?
            </h2>
            <p className="text-indigo-100 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto relative z-10">
              Join thousands of professionals using Intelmeet for seamless WebRTC video conferencing, live transcription, and action item tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative z-10">
              <Button
                onClick={() => setLocation("/register")}
                className="w-full sm:w-auto h-12 rounded-full px-8 text-sm font-extrabold bg-white text-indigo-950 hover:bg-slate-100 shadow-xl gap-2 border-0"
                id="cta-register-btn"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="w-full sm:w-auto h-12 rounded-full px-8 text-sm font-bold border-white/30 text-white hover:bg-white/10"
                id="cta-login-btn"
              >
                Sign In to Workspace
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer (<footer>) */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-white">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-extrabold tracking-wider uppercase">Intell Meet</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm text-xs leading-relaxed">
              Intelligent video conferencing, real-time AI transcription, automated meeting notes, and workspace task collaboration.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  Video Rooms
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  Kanban Board
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              <li>
                <a href="/login" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  Sign In
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  Register Account
                </a>
              </li>
              <li>
                <a href="/forgot-password" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
                  Reset Password
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Intelmeet. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              WebRTC Encrypted
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
