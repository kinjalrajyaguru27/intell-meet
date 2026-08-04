import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Mail, ArrowLeft, Eye, EyeOff, Check, X, ShieldCheck, RefreshCw, Send, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Step state: 1 = Send OTP, 2 = Verify OTP & Set Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Resend OTP countdown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Form handling
  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm({
    defaultValues: { email: "" },
  });

  const { register: registerStep2, handleSubmit: handleSubmitStep2, watch, setValue, formState: { errors: errorsStep2 } } = useForm({
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const passwordValue = watch("password");

  // Password strength logic
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false,
  });

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

    setPasswordStrength({ score, hasLength, hasUpper, hasLower, hasDigit, hasSpecial });
  }, [passwordValue]);

  // Handle Step 1: Request OTP
  const onSendOtp = async (data: { email: string }) => {
    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to send OTP");
      }

      setEmail(data.email);
      setStep(2);
      setCountdown(30);

      toast({
        title: "OTP Sent!",
        description: `A 6-digit OTP has been sent to ${data.email}`,
      });
    } catch (err: any) {
      toast({
        title: "OTP Request Failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to resend OTP");
      }

      setCountdown(30);

      toast({
        title: "New OTP Sent!",
        description: `A new 6-digit OTP code was sent to ${email}`,
      });
    } catch (err: any) {
      toast({
        title: "Resend Failed",
        description: err.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Step 2: Verify OTP & Reset Password
  const onResetPassword = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength.score < 5) {
      toast({
        title: "Weak Password",
        description: "Please fulfill all password strength requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: data.otp,
          password: data.password,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. You can now log in.",
      });

      setLocation("/login");
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err.message || "Invalid or expired OTP code.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-4 py-10">
      {/* Dynamic Background Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md space-y-4 relative z-10">
        <Card className="bg-white dark:bg-card/65 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
          
          <CardHeader className="space-y-2 pt-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
              {step === 1 ? "Forgot Password" : "Enter OTP & Reset Password"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {step === 1
                ? "Enter your email to receive a 6-digit OTP code"
                : `Enter the 6-digit OTP sent to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              /* STEP 1: Enter Email & Send OTP */
              <form onSubmit={handleSubmitStep1(onSendOtp)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground dark:text-white text-xs font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...registerStep1("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-foreground dark:text-white"
                    />
                  </div>
                  {errorsStep1.email && <p className="text-xs text-destructive mt-0.5">{errorsStep1.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 mt-6 gap-2 font-bold shadow-lg shadow-primary/20 transition-all duration-200"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* STEP 2: Enter 6-Digit OTP & Set New Password */
              <form onSubmit={handleSubmitStep2(onResetPassword)} className="space-y-4">

                {/* 6-Digit OTP Code Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="otp" className="text-foreground dark:text-white text-xs font-semibold">
                      6-Digit OTP Code
                    </Label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || isSendingOtp}
                      className="text-xs text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      maxLength={6}
                      placeholder="• • • • • •"
                      {...registerStep2("otp", { 
                        required: "OTP is required",
                        pattern: { value: /^[0-9]{6}$/, message: "Must be a 6-digit number" }
                      })}
                      className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 tracking-[0.4em] font-mono text-center font-bold text-lg focus-visible:ring-primary h-12 text-foreground dark:text-white placeholder:tracking-[0.3em] placeholder:text-muted-foreground/50"
                    />
                  </div>
                  {errorsStep2.otp && <p className="text-xs text-destructive mt-0.5">{errorsStep2.otp.message}</p>}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-foreground dark:text-white text-xs font-semibold">
                    New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...registerStep2("password", { required: "Password is required" })}
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-foreground dark:text-white text-xs font-semibold">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerStep2("confirmPassword", { required: "Please confirm your password" })}
                      className="bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-foreground dark:text-white"
                    />
                  </div>
                  {errorsStep2.confirmPassword && <p className="text-xs text-destructive mt-0.5">{errorsStep2.confirmPassword.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 mt-6 gap-2 font-bold shadow-lg shadow-primary/20 transition-all duration-200"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Verify & Reset Password"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground dark:hover:text-white font-medium transition-colors text-center pt-1 block"
                >
                  Need to change email address?
                </button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center pb-8 pt-2">
            <button
              onClick={() => setLocation("/login")}
              className="text-xs text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors flex items-center gap-1 font-semibold underline underline-offset-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}