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
  const [gsiLoaded, setGsiLoaded] = useState(true);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "335439563229-placeholder.apps.googleusercontent.com";

  // Handle redirect callback (Google implicit flow fallback)
  useEffect(() => {
    let idToken = sessionStorage.getItem("google_id_token");
    if (idToken) {
      sessionStorage.removeItem("google_id_token");
    } else {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        idToken = params.get("id_token");
        if (idToken) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }

    if (idToken) {
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
    }
  }, [googleLoginMutation, setAuthSession, setLocation, toast]);

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
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          const isDark = document.documentElement.classList.contains("dark");
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
            theme: isDark ? "dark" : "outline",
            size: "large",
            width: 382,
            text: "signup_with",
            shape: "rectangular",
          });

          // Successfully rendered, check if iframe actually loads
          setTimeout(() => {
            if (!btnEl.querySelector("iframe")) {
              setGsiLoaded(false);
            }
          }, 1500);
        } catch (e) {
          console.error("Failed to initialize Google Sign Up", e);
          setGsiLoaded(false);
        }
      }
    };

    let attempts = 0;
    let checkInterval = setInterval(() => {
      attempts++;
      if ((window as any).google?.accounts?.id) {
        initializeGoogle();
        clearInterval(checkInterval);
      } else if (attempts > 10) { // After 3 seconds, if script still not loaded, fallback
        setGsiLoaded(false);
        clearInterval(checkInterval);
      }
    }, 300);

    return () => {
      clearInterval(checkInterval);
    };
  }, [googleClientId, setAuthSession, setLocation, toast]);

  const handleGoogleRedirectLogin = () => {
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const redirectUri = encodeURIComponent(`${window.location.origin}`);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;
    window.location.href = googleAuthUrl;
  };

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
            {!gsiLoaded ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleRedirectLogin}
                className="w-full h-11 flex items-center justify-center gap-3 bg-white dark:bg-[#1e1e20] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/10 font-bold px-4 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign up with Google
              </Button>
            ) : (
              <div 
                id="google-signup-btn" 
                className="w-full flex justify-center min-h-[40px] [&_iframe]:!w-full [&_iframe]:!max-w-none" 
              />
            )}
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
