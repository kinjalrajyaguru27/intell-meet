import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useRegister, useGoogleLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Video, KeyRound, Mail, UserPlus, Eye, EyeOff, ShieldCheck, Check, X, Loader2 } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthSession, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false,
  });

  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "335439563229-placeholder.apps.googleusercontent.com";

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Google GSI script integration for Registration
  useEffect(() => {
    const btnEl = document.getElementById("google-signup-btn");
    if (!btnEl) return;

    const initializeGoogle = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: any) => {
              const idToken = response.credential;
              setIsGoogleLoading(true);
              googleLoginMutation.mutate(
                { data: { idToken } },
                {
                  onSuccess: (res) => {
                    setAuthSession(res.token, res.user as any);
                    toast({
                      title: "Welcome to Intell Meet!",
                      description: `Logged in via Google as ${res.user.name}`,
                    });
                    setLocation("/");
                  },
                  onError: (err: any) => {
                    toast({
                      title: "Google authentication failed",
                      description: err.message || "Something went wrong during Google sign-up",
                      variant: "destructive",
                    });
                  },
                  onSettled: () => {
                    setIsGoogleLoading(false);
                  }
                }
              );
            },
          });

          (window as any).google.accounts.id.renderButton(btnEl, {
            theme: "dark",
            size: "large",
            width: 382,
            text: "signup_with",
            shape: "rectangular",
          });
        } catch (e) {
          console.error("Failed to initialize Google Sign Up", e);
        }
      }
    };

    let checkInterval = setInterval(() => {
      if ((window as any).google) {
        initializeGoogle();
        clearInterval(checkInterval);
      }
    }, 300);

    return () => {
      clearInterval(checkInterval);
    };
  }, [googleClientId, setAuthSession, setLocation, toast]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Member" as "Admin" | "Manager" | "Member",
    },
  });

  const passwordValue = watch("password");

  // Track password strength dynamically
  useEffect(() => {
    if (!passwordValue) {
      setPasswordStrength({
        score: 0,
        hasLength: false,
        hasUpper: false,
        hasLower: false,
        hasDigit: false,
        hasSpecial: false,
      });
      return;
    }

    const hasLength = passwordValue.length >= 8;
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasDigit = /[0-9]/.test(passwordValue);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;

    setPasswordStrength({
      score,
      hasLength,
      hasUpper,
      hasLower,
      hasDigit,
      hasSpecial,
    });
  }, [passwordValue]);

  const onSubmit = (data: any) => {
    if (passwordStrength.score < 5) {
      toast({
        title: "Weak password",
        description: "Please fulfill all password requirements before registering.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(
      { data: { name: data.name, email: data.email, password: data.password, role: data.role } },
      {
        onSuccess: (res) => {
          setAuthSession(res.token, res.user as any);
          toast({
            title: "Welcome to Intell Meet!",
            description: `Account created successfully. Registered as ${res.user.role}.`,
          });
          setLocation("/");
        },
        onError: (err: any) => {
          toast({
            title: "Registration failed",
            description: err.message || "Something went wrong. Email might already be taken.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0: return "bg-zinc-800";
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-blue-500";
      case 5: return "bg-emerald-500";
      default: return "bg-zinc-800";
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength.score) {
      case 0: return "None";
      case 1: return "Very Weak";
      case 2: return "Weak";
      case 3: return "Fair";
      case 4: return "Good";
      case 5: return "Strong";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-10 px-4">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <Card className="w-full max-w-md bg-white dark:bg-card/65 border border-zinc-200 dark:border-white/10 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
        
        {/* Loading overlay for Google authentication */}
        {(isGoogleLoading || googleLoginMutation.isPending) && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-zinc-350 font-semibold uppercase tracking-wider">Verifying with Google...</p>
          </div>
        )}
        
        <CardHeader className="space-y-2 pt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            Create your account
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sign up to organize video calls, transcriptions, and tasks
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground dark:text-white text-xs font-semibold">Full Name</Label>
              <div className="relative">
                <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register("name", { required: "Full name is required" })}
                  className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-foreground dark:text-white"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground dark:text-white text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-foreground dark:text-white"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground dark:text-white text-xs font-semibold">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 pr-10 text-sm focus-visible:ring-primary h-11 text-foreground dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>}

              {/* Password Strength Meter */}
              {passwordValue && (
                <div className="space-y-2 mt-2 bg-zinc-50 dark:bg-black/25 p-3 rounded-lg border border-zinc-200 dark:border-white/5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-450 dark:text-zinc-400 font-semibold uppercase tracking-wider">Password Strength</span>
                    <span className={`font-bold uppercase ${
                      passwordStrength.score >= 4 ? "text-emerald-500" : passwordStrength.score >= 2 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasLength ? <Check className="w-3 h-3 text-emerald-500 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-450 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasLength ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>8+ Characters</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasUpper ? <Check className="w-3 h-3 text-emerald-500 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-450 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasUpper ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>Uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasLower ? <Check className="w-3 h-3 text-emerald-500 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-450 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasLower ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>Lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasDigit ? <Check className="w-3 h-3 text-emerald-500 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-450 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasDigit ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>Digit (0-9)</span>
                    </div>
                    <div className="flex items-center text-[10px] col-span-2">
                      {passwordStrength.hasSpecial ? <Check className="w-3 h-3 text-emerald-500 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-450 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasSpecial ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>Special Character (!@#$%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-foreground dark:text-white text-xs font-semibold">Workspace Role</Label>
              <Select
                defaultValue="Member"
                onValueChange={(val: any) => setValue("role", val)}
              >
                <SelectTrigger className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 h-11 text-sm text-left text-foreground dark:text-white">
                  <SelectValue placeholder="Select workspace role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#09090b] border-zinc-200 dark:border-white/10 text-foreground dark:text-white">
                  <SelectItem value="Member">Team Member</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 mt-6 gap-2 shadow-lg shadow-primary/20 transition-all duration-200 font-bold"
              disabled={registerMutation.isPending}
            >
              <UserPlus className="w-4 h-4" />
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white dark:bg-[#121214] px-3 text-zinc-500 font-semibold tracking-wider">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-up button wrapper */}
          <div className="flex justify-center w-full">
            <div 
              id="google-signup-btn" 
              className="w-full flex justify-center min-h-[40px] [&_iframe]:!w-full [&_iframe]:!max-w-none" 
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center pb-8 pt-2">
          <button
            onClick={() => setLocation("/login")}
            className="text-xs text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors underline underline-offset-4 font-semibold"
          >
            Already have an account? Sign in
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
