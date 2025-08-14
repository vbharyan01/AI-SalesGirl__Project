import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import VapiControl from "@/pages/vapi-control";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { BarChart3, Settings } from "lucide-react";

function Navigation() {
  const [location] = useLocation();
  
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
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/vapi" component={VapiControl} />
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
