import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Video,
  ShieldCheck,
  Brain,
  MessageSquare,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  Zap,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  // Initialize theme from localStorage or document element
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
      return window.document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const coreFeatures = [
    {
      title: "User Authentication & Profiles",
      description: "Secure, credential-based and Google OAuth2 registration, customized multi-role access levels, and granular profile personalization.",
      icon: ShieldCheck,
      color: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/20",
      textLight: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Video Meetings",
      description: "High-definition video rooms with instant workspace synchronization, calendar scheduling, screen-sharing, and waiting room controls.",
      icon: Video,
      color: "from-cyan-500 to-blue-500",
      bgLight: "bg-cyan-50 dark:bg-cyan-950/20",
      textLight: "text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "AI Meeting Intelligence",
      description: "Harness AI to transcribe recordings, extract action items, detect main conversation themes, and construct structured summaries.",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      bgLight: "bg-purple-50 dark:bg-purple-950/20",
      textLight: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Real-Time Chat & Collaboration",
      description: "Contextual group threads, direct messages, and instantaneous file uploads connected alongside scheduled calls.",
      icon: MessageSquare,
      color: "from-teal-500 to-emerald-500",
      bgLight: "bg-teal-50 dark:bg-teal-950/20",
      textLight: "text-teal-600 dark:text-teal-400"
    },
    {
      title: "Post-Meeting Dashboard",
      description: "A specialized archive for transcript timelines, recording playback, follow-up builders, and automatically generated todo lists.",
      icon: LayoutDashboard,
      color: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50 dark:bg-amber-950/20",
      textLight: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Team & Project Management",
      description: "Manage milestones, task boards, and member schedules through drag-and-drop Kanban frameworks and automatic team invitations.",
      icon: FolderKanban,
      color: "from-violet-500 to-purple-500",
      bgLight: "bg-violet-50 dark:bg-violet-950/20",
      textLight: "text-violet-600 dark:text-violet-400"
    },
    {
      title: "Analytics & Insights",
      description: "Interactive visual logs tracking productivity levels, meeting durations, task completion speed, and team engagement.",
      icon: BarChart3,
      color: "from-rose-500 to-red-500",
      bgLight: "bg-rose-50 dark:bg-rose-950/20",
      textLight: "text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden font-sans">
      
      {/* Decorative Top Background Blur Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-10 w-[40rem] h-[40rem] rounded-full bg-primary/10 dark:bg-primary/5 blur-[128px]" />
        <div className="absolute top-10 right-10 w-[35rem] h-[35rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[128px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-350 bg-clip-text text-transparent uppercase">
            Intell Meet
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Light/Dark Toggle Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setLocation("/login")}
            className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground px-3 sm:px-4"
          >
            Login
          </Button>

          <Button
            onClick={() => setLocation("/register")}
            className="text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-5 rounded-full shadow-md shadow-primary/10"
          >
            Register
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Empowering Modern Teams with AI
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] max-w-4xl mx-auto">
            Intell Meet – Intelligent Meetings &{" "}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Team Collaboration
            </span>{" "}
            Platform
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Conduct meetings, collaborate with teams, manage projects, generate AI insights, and track productivity in one platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-4">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="w-full sm:w-auto h-12 rounded-full px-8 font-bold text-sm bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white gap-2 shadow-xl shadow-primary/15 transition-all active:scale-98"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setLocation("/login")}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 rounded-full px-8 font-bold text-sm border-border hover:bg-accent text-foreground transition-all active:scale-98"
            >
              Login
            </Button>
          </div>

          {/* Simulated Application Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-16 max-w-5xl mx-auto relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-indigo-500/10 rounded-2xl blur-3xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="border border-border/80 dark:border-white/10 rounded-2xl p-2 bg-zinc-150/40 dark:bg-card/45 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border dark:border-white/5 bg-zinc-100/55 dark:bg-black/20 rounded-t-xl shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-[10px] text-muted-foreground font-mono ml-4">https://app.intellmeet.com/dashboard</span>
              </div>
              <div className="bg-white dark:bg-black/60 aspect-[16/9] rounded-b-xl flex flex-col justify-center items-center p-8 relative overflow-hidden group">
                {/* Decorative Elements Inside Preview */}
                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
                
                <div className="relative z-10 text-center max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-white">Workspace Meetings & Analytics Dashboard</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Access transcription timelines, review project task lists on the Kanban board, trigger video rooms instantly, and organize follow-up details dynamically.
                  </p>
                  <Button onClick={() => setLocation("/register")} className="rounded-full font-bold text-xs h-9 px-6 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 border-0 shadow">
                    Launch Platform Free
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-zinc-50/50 dark:bg-card/30 border-y border-border py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Core Modules</h2>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 dark:text-white">
              7 Core Features Driving Productivity
            </p>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Explore the functional sections crafted to modernize virtual coordination, task prioritization, and document processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group bg-white dark:bg-card border border-border hover:border-primary/25 dark:hover:border-primary/45 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${feat.bgLight} border border-primary/5 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-5 h-5 ${feat.textLight}`} />
                    </div>
                    <div className="space-y-2 text-left">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white group-hover:text-primary transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Intell Meet Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Value Proposition</h2>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 dark:text-white leading-tight">
              Why Teams Choose Intell Meet Over Traditional Apps
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Traditional video calls focus exclusively on the conversation, forcing you to take notes, write tickets, and manually coordinate follow-ups elsewhere. Intell Meet brings the entire flow under one smart container.
            </p>
            
            <div className="space-y-4 pt-2">
              {[
                { title: "Saves Hours with Automatic AI Summaries", desc: "No more spending hours writing meeting minutes. Let AI extract highlights instantly." },
                { title: "Integrated Kanban boards", desc: "Convert meeting decisions to action items directly inside the app, assign roles, and track completions." },
                { title: "Rich productivity metrics", desc: "Understand team capacity, identify bottlenecks, and keep milestones organized in real-time." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 text-left">
                  <div className="shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Visual Graphic Element */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-3xl blur-3xl opacity-50" />
            <div className="bg-white dark:bg-card border border-border p-8 rounded-3xl relative z-10 w-full max-w-md shadow-xl text-left space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-bold">Automation Performance</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">+28% Efficiency</span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "AI Summarization Speed", val: "Instant (Sub-Second)", width: "w-full" },
                  { label: "Action Item Accuracy", val: "98% Detection", width: "w-[95%]" },
                  { label: "Collaboration Sync Lag", val: "< 50ms Realtime", width: "w-[98%]" }
                ].map((stat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-zinc-650 dark:text-zinc-400">{stat.label}</span>
                      <span className="text-zinc-900 dark:text-white">{stat.val}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 ${stat.width}`} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2">
                <Button onClick={() => setLocation("/register")} className="w-full text-xs font-bold py-5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-50 border-0 shadow">
                  Experience High-Performance Synergy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-white dark:bg-black/40 py-12 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border">
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Video className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-zinc-900 to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent uppercase">
                Intell Meet
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conduct meetings, collaborate with teams, manage projects, generate AI insights, and track productivity in one platform.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">About</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Press</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">Features</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">HD Meetings</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">AI Transcript Summaries</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Kanban Todo Boards</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">Contact</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Sales</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Security Details</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 Intell Meet. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
