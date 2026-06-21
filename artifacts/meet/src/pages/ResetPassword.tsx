import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video, KeyRound, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");

  const resetPasswordMutation = useResetPassword();

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false,
  });

  // Extract token from URL search parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      toast({
        title: "Token missing",
        description: "A reset token is required to view this page.",
        variant: "destructive",
      });
      setLocation("/forgot-password");
    }
  }, [setLocation, toast]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
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
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength.score < 5) {
      toast({
        title: "Weak password",
        description: "Please fulfill all password requirements before submitting.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate(
      { data: { token, password: data.password } },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Your password has been successfully updated.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            title: "Reset failed",
            description: err.message || "Token might be invalid or expired.",
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] relative overflow-hidden px-4">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/65 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
        
        <CardHeader className="space-y-2 pt-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Reset Password
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Fulfill requirements and enter your new password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white text-xs font-semibold">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  className="bg-black/40 border-white/10 pl-10 pr-10 text-sm focus-visible:ring-primary h-11 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwordValue && (
                <div className="space-y-2 mt-2 bg-black/25 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400 font-semibold uppercase tracking-wider">Password Strength</span>
                    <span className={`font-bold uppercase ${
                      passwordStrength.score >= 4 ? "text-emerald-400" : passwordStrength.score >= 2 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasLength ? <Check className="w-3 h-3 text-emerald-400 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-500 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasLength ? "text-zinc-300" : "text-zinc-500"}>8+ Characters</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasUpper ? <Check className="w-3 h-3 text-emerald-400 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-500 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasUpper ? "text-zinc-300" : "text-zinc-500"}>Uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasLower ? <Check className="w-3 h-3 text-emerald-400 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-500 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasLower ? "text-zinc-300" : "text-zinc-500"}>Lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center text-[10px]">
                      {passwordStrength.hasDigit ? <Check className="w-3 h-3 text-emerald-400 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-500 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasDigit ? "text-zinc-300" : "text-zinc-500"}>Digit (0-9)</span>
                    </div>
                    <div className="flex items-center text-[10px] col-span-2">
                      {passwordStrength.hasSpecial ? <Check className="w-3 h-3 text-emerald-400 mr-1 shrink-0" /> : <X className="w-3 h-3 text-zinc-500 mr-1 shrink-0" />}
                      <span className={passwordStrength.hasSpecial ? "text-zinc-300" : "text-zinc-500"}>Special Character (!@#$%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-white text-xs font-semibold">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", { required: "Confirm password is required" })}
                  className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 mt-6 gap-2"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Updating password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center pb-8 pt-2">
          <button
            onClick={() => setLocation("/login")}
            className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
