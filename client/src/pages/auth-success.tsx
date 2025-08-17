import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthSuccessPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const username = urlParams.get("username");
    const error = urlParams.get("error");

    if (error) {
      toast({ 
        title: "Authentication failed", 
        description: "There was an error during authentication. Please try again.", 
        variant: "destructive" 
      });
      navigate("/login");
      return;
    }

    if (token && username) {
      // Store the authentication token
      localStorage.setItem("auth_token", token);
      
      toast({ 
        title: "Welcome!", 
        description: `Successfully logged in as ${decodeURIComponent(username)}` 
      });
      
      // Redirect to the main application
      navigate("/vapi");
    } else {
      toast({ 
        title: "Authentication failed", 
        description: "Missing authentication information.", 
        variant: "destructive" 
      });
      navigate("/login");
    }
  }, [toast, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authenticating...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-600">Please wait while we complete your authentication...</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


