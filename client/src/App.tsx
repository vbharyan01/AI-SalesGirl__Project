import { Switch, Route, Link, useLocation, type RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import VapiControl from "@/pages/vapi-control";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { BarChart3, Settings } from "lucide-react";
import LoginPage from "@/pages/auth-login";
import SignupPage from "@/pages/auth-signup";
import SettingsPage from "@/pages/settings";

function Navigation() {
  const [location] = useLocation();
  const isAuthed = typeof window !== "undefined" && !!localStorage.getItem("auth_token");
  const logout = () => { localStorage.removeItem("auth_token"); window.location.href = "/login"; };
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex space-x-2">
        <Link href="/">
          <Button 
            variant={location === "/" ? "default" : "ghost"} 
            size="sm"
            className="flex items-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/vapi">
          <Button 
            variant={location === "/vapi" ? "default" : "ghost"} 
            size="sm"
            className="flex items-center"
          >
            <Settings className="mr-2 h-4 w-4" />
            AI Control
          </Button>
        </Link>
        <Link href="/settings">
          <Button 
            variant={location === "/settings" ? "default" : "ghost"} 
            size="sm"
            className="flex items-center"
          >
            Settings
          </Button>
        </Link>
        <div className="flex-1" />
        {!isAuthed ? (
          <>
            <Link href="/login"><Button variant="outline" size="sm">Login</Button></Link>
            <Link href="/signup"><Button size="sm">Sign up</Button></Link>
          </>
        ) : (
          <Button variant="destructive" size="sm" onClick={logout}>Logout</Button>
        )}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={withAuth(Dashboard)} />
        <Route path="/vapi" component={withAuth(VapiControl)} />
        <Route path="/settings" component={withAuth(SettingsPage)} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

function withAuth<TProps extends RouteComponentProps>(Component: React.ComponentType<TProps>) {
  return function Wrapped(props: TProps) {
    const [location, navigate] = useLocation();
    const isAuthed = typeof window !== "undefined" && !!localStorage.getItem("auth_token");
    if (!isAuthed && location !== "/login" && location !== "/signup") {
      navigate("/login");
      return null;
    }
    return <Component {...(props as TProps)} />;
  };
}
