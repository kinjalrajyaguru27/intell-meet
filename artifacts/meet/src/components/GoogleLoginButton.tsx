import { useEffect, useState, useId } from "react";
import { useLocation } from "wouter";
import { useGoogleLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface GoogleLoginButtonProps {
  mode?: "login" | "register";
  className?: string;
  onSuccess?: () => void;
}

export function GoogleLoginButton({ mode = "login", className = "", onSuccess }: GoogleLoginButtonProps) {
  const [, setLocation] = useLocation();
  const { login: setAuthSession } = useAuth();
  const { toast } = useToast();
  const googleLoginMutation = useGoogleLogin();
  const uniqueId = useId().replace(/:/g, "");
  const containerId = `google-signin-btn-${uniqueId}`;

  const [isLoading, setIsLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "9261913779-0o8efuvcm121sqc6d3psfkrcg17mggbh.apps.googleusercontent.com";

  const handleCredentialResponse = (response: any) => {
    const idToken = response.credential;
    if (!idToken) return;

    setIsLoading(true);
    googleLoginMutation.mutate(
      { data: { idToken } },
      {
        onSuccess: (res) => {
          setIsLoading(false);
          setAuthSession(res.token, res.user as any);
          toast({
            title: mode === "login" ? "Welcome back!" : "Account created!",
            description: `Successfully signed in with Google as ${res.user.name}`,
          });
          if (onSuccess) {
            onSuccess();
          } else {
            setLocation("/");
          }
        },
        onError: (err: any) => {
          setIsLoading(false);
          toast({
            title: "Google Authentication failed",
            description: err.message || "Something went wrong signing in with Google",
            variant: "destructive",
          });
        },
      }
    );
  };

  useEffect(() => {
    let checkInterval: any = null;
    let attempts = 0;

    const initGoogleBtn = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          const isDark = document.documentElement.classList.contains("dark");
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });

          const btnEl = document.getElementById(containerId);
          if (btnEl) {
            btnEl.innerHTML = "";
            (window as any).google.accounts.id.renderButton(btnEl, {
              theme: isDark ? "filled_black" : "outline",
              size: "large",
              text: mode === "register" ? "signup_with" : "signin_with",
              shape: "pill",
              width: 320,
            });
            setGsiLoaded(true);
          }
        } catch (e) {
          console.error("Failed to render Google button", e);
          setGsiLoaded(false);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleBtn();
    } else {
      checkInterval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.id) {
          initGoogleBtn();
          clearInterval(checkInterval);
        } else if (attempts > 10) {
          clearInterval(checkInterval);
          setGsiLoaded(false);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [containerId, googleClientId, mode]);

  const handleCustomGoogleClick = () => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });
        (window as any).google.accounts.id.prompt();
      } catch (e) {
        toast({
          title: "Google Sign-In Notice",
          description: "Google Sign-In script is loading. Please try again in a moment.",
        });
      }
    } else {
      toast({
        title: "Google Sign-In Notice",
        description: "Google OAuth Client loaded for " + googleClientId,
      });
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-primary animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          Signing in with Google...
        </div>
      )}

      <div
        id={containerId}
        className={`w-full flex justify-center min-h-[44px] ${isLoading ? "hidden" : "block"}`}
      />

      {!gsiLoaded && !isLoading && (
        <button
          type="button"
          onClick={handleCustomGoogleClick}
          className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-medium text-sm flex items-center justify-center gap-3 shadow-sm transition-all duration-200"
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
          <span>{mode === "register" ? "Sign up with Google" : "Sign in with Google"}</span>
        </button>
      )}
    </div>
  );
}
