import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Room from "@/pages/Room";
import Dashboard from "@/pages/Dashboard";
import MeetingDetail from "@/pages/MeetingDetail";
import Kanban from "@/pages/Kanban";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import TeamInvitation from "@/pages/TeamInvitation";
import AdminUsers from "@/pages/AdminUsers";
import TeamManagement from "@/pages/TeamManagement";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import TodoManager from "@/pages/TodoManager";
import Collaboration from "@/pages/Collaboration";
import AIInsights from "@/pages/AIInsights";
import PostMeeting from "@/pages/PostMeeting";
import AppLayout from "@/components/AppLayout";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Automatically supply authorization token on all requests
setAuthTokenGetter(() => {
  return localStorage.getItem("intell_meet_token");
});

// Capture Google OAuth redirect token at root before any router redirects
if (typeof window !== "undefined" && window.location.hash) {
  try {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get("id_token");
    const state = params.get("state");
    if (idToken) {
      sessionStorage.setItem("google_id_token", idToken);
      const targetPath = state ? decodeURIComponent(state) : window.location.pathname + window.location.search;
      window.history.replaceState(null, "", window.location.origin + targetPath);
    }
  } catch (e) {
    console.error("Error parsing redirect hash", e);
  }
}

const queryClient = new QueryClient();

function AuthenticatedRoutes({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AuthenticatedRoutes>
          <Home />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/auth">
        <Redirect to="/login" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/team/invite" component={TeamInvitation} />
      <Route path="/room/:roomId" component={Room} />
      
      {/* Authenticated routes wrapped in enterprise AppLayout framework */}
      <Route path="/profile">
        <AuthenticatedRoutes>
          <Profile />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/profile/edit">
        <AuthenticatedRoutes>
          <EditProfile />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/admin/users">
        <AuthenticatedRoutes>
          <AdminUsers />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/dashboard">
        <AuthenticatedRoutes>
          <Dashboard />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/dashboard/meeting/:meetingId">
        <AuthenticatedRoutes>
          <MeetingDetail />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/kanban">
        <AuthenticatedRoutes>
          <Kanban />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/analytics">
        <AuthenticatedRoutes>
          <Analytics />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/team-management">
        <AuthenticatedRoutes>
          <TeamManagement />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/notifications">
        <AuthenticatedRoutes>
          <Notifications />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/settings">
        <AuthenticatedRoutes>
          <Settings />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/todo-manager">
        <AuthenticatedRoutes>
          <TodoManager />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/collaboration">
        <AuthenticatedRoutes>
          <Collaboration />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/ai-insights">
        <AuthenticatedRoutes>
          <AIInsights />
        </AuthenticatedRoutes>
      </Route>
      <Route path="/post-meeting">
        <AuthenticatedRoutes>
          <PostMeeting />
        </AuthenticatedRoutes>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
