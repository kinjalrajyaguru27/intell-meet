import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useLogin, useSignup, useOauthLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Video, KeyRound, Mail, UserPlus, LogIn } from "lucide-react";

export default function Auth() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [, setLocation] = useLocation();
  const { login: setAuthSession } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const oauthMutation = useOauthLogin();

  const [oauthSimulation, setOauthSimulation] = useState<"google" | "github" | null>(null);
  const [customOauthName, setCustomOauthName] = useState("");
  const [customOauthEmail, setCustomOauthEmail] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Member" as "Admin" | "Member",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = (data: any) => {
    if (isLoginMode) {
      loginMutation.mutate(
        { data: { email: data.email, password: data.password } },
        {
          onSuccess: (res) => {
            setAuthSession(res.token, res.user as any);
            toast({ title: "Welcome back!", description: `Logged in as ${res.user.name}` });
            setLocation("/");
          },
          onError: (err: any) => {
            toast({
              title: "Login failed",
              description: err.message || "Invalid email or password",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      signupMutation.mutate(
        { data: { name: data.name, email: data.email, password: data.password, role: data.role } },
        {
          onSuccess: (res) => {
            setAuthSession(res.token, res.user as any);
            toast({ title: "Welcome to Intell Meet!", description: "Account created successfully" });
            setLocation("/");
          },
          onError: (err: any) => {
            toast({
              title: "Signup failed",
              description: err.message || "Email might already be taken",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const startOauthSimulation = (provider: "google" | "github") => {
    setCustomOauthName("");
    setCustomOauthEmail("");
    setOauthSimulation(provider);
  };

  const handleOauthSubmit = (name: string, email: string) => {
    if (!name || !email || !oauthSimulation) return;
    oauthMutation.mutate(
      {
        data: {
          provider: oauthSimulation,
          email,
          name,
        },
      },
      {
        onSuccess: (res) => {
          setOauthSimulation(null);
          setAuthSession(res.token, res.user as any);
          toast({ title: "Welcome!", description: `Logged in via OAuth2 as ${res.user.name}` });
          setLocation("/");
        },
        onError: (err: any) => {
          toast({
            title: "OAuth2 authentication failed",
            description: err.message || "Something went wrong during OAuth2 sign-in",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] relative overflow-hidden px-4">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
        
        <CardHeader className="space-y-3 pt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {isLoginMode ? "Sign in to Intell Meet" : "Create your account"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isLoginMode 
              ? "Enter your credentials to access your meeting workspaces"
              : "Register to organize calls, summaries, and Kanban project tasks"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLoginMode && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white text-xs font-semibold">Full Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    {...register("name", { required: !isLoginMode })}
                    className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-11"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", { required: true })}
                  className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white text-xs font-semibold">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password", { required: true, minLength: 6 })}
                  className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-white text-xs font-semibold">Workspace Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val: any) => setValue("role", val)}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 h-11 text-sm text-left text-white">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#09090b] border-white/10 text-white">
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 mt-6 gap-2"
              disabled={loginMutation.isPending || signupMutation.isPending}
            >
              {isLoginMode ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {loginMutation.isPending || signupMutation.isPending
                ? "Processing..."
                : isLoginMode
                  ? "Sign In"
                  : "Create Account"}
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121214] px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-black/20 border-white/10 hover:bg-white/5 h-11 text-xs text-white"
                onClick={() => startOauthSimulation("google")}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-black/20 border-white/10 hover:bg-white/5 h-11 text-xs text-white"
                onClick={() => startOauthSimulation("github")}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center pb-8 pt-2">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs text-muted-foreground hover:text-white transition-colors underline underline-offset-4"
          >
            {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardFooter>
      </Card>

      {oauthSimulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <Card className="w-full max-w-sm bg-[#09090b] border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
            <CardHeader className="text-center pt-8">
              <div className="mx-auto w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                {oauthSimulation === "google" ? (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-white capitalize">
                Sign in with {oauthSimulation}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                to continue to <span className="text-white font-medium">Intell Meet</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Select account</p>
                
                <button
                  type="button"
                  onClick={() => handleOauthSubmit("Kinjal", "rajyagurukinjal27@gmail.com")}
                  className="w-full flex items-center p-3 rounded-xl border border-white/5 hover:border-primary/50 bg-white/5 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold mr-3">
                    K
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">Kinjal</p>
                    <p className="text-[10px] text-muted-foreground">rajyagurukinjal27@gmail.com</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOauthSubmit("Test Admin", "admin@intellmeet.com")}
                  className="w-full flex items-center p-3 rounded-xl border border-white/5 hover:border-primary/50 bg-white/5 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6] text-xs font-bold mr-3">
                    TA
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">Test Admin</p>
                    <p className="text-[10px] text-muted-foreground">admin@intellmeet.com</p>
                  </div>
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase">Or use custom</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Full Name"
                  value={customOauthName}
                  onChange={(e) => setCustomOauthName(e.target.value)}
                  className="bg-black/40 border-white/10 text-xs h-9 text-white"
                />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={customOauthEmail}
                  onChange={(e) => setCustomOauthEmail(e.target.value)}
                  className="bg-black/40 border-white/10 text-xs h-9 text-white"
                />
                <Button
                  type="button"
                  onClick={() => handleOauthSubmit(customOauthName, customOauthEmail)}
                  disabled={!customOauthName || !customOauthEmail}
                  className="w-full text-xs h-9"
                >
                  Sign in
                </Button>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOauthSimulation(null)}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
