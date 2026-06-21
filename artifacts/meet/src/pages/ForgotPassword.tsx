import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Video, Mail, ArrowLeft, KeyRound, AlertTriangle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resetLink, setResetLink] = useState<string | null>(null);

  const forgotPasswordMutation = useForgotPassword();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    forgotPasswordMutation.mutate(
      { data: { email: data.email } },
      {
        onSuccess: (res: any) => {
          toast({
            title: "Reset link generated!",
            description: "A secure reset link has been processed.",
          });
          if (res.resetLink) {
            setResetLink(res.resetLink);
          }
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.message || "Failed to generate password reset request",
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

      <div className="w-full max-w-md space-y-4 relative z-10">
        <Card className="bg-card/65 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-indigo-500" />
          
          <CardHeader className="space-y-2 pt-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!resetLink ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white text-xs font-semibold">Email Address</Label>
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
                      className="bg-black/40 border-white/10 pl-10 text-sm focus-visible:ring-primary h-11 text-white"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/95 mt-6 gap-2"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Generating link..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                  We've generated your password reset link!
                </div>
                <p className="text-xs text-zinc-400">
                  Because this is a simulation workspace, the link has also been printed to the server terminal. You can copy the generated reset link below to complete testing:
                </p>
                <div className="bg-black/60 p-3 rounded-lg border border-white/5 text-left select-all break-all text-xs font-mono text-zinc-300">
                  {resetLink}
                </div>
                <Button
                  onClick={() => {
                    const token = new URL(resetLink).searchParams.get("token");
                    setLocation(`/reset-password?token=${token}`);
                  }}
                  className="w-full h-10 rounded-xl text-xs"
                >
                  Go to Password Reset Page
                </Button>
              </div>
            )}
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
    </div>
  );
}
