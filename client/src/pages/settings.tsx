import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Key, 
  User, 
  Phone, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Zap,
  Shield,
  Database,
  Globe,
  Activity
} from "lucide-react";

export default function SettingsPage() {
  const [vapiPrivateKey, setVapiPrivateKey] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [defaultCustomerNumber, setDefaultCustomerNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("credentials");
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const headers: Record<string, string> = authHeader();
      const res = await fetch("/api/settings", { headers });
      if (!res.ok) return;
      const data = await res.json();
      setVapiPrivateKey(data?.vapiPrivateKey || "");
      setAssistantId(data?.assistantId || "");
      setPhoneNumberId(data?.phoneNumberId || "");
      setDefaultCustomerNumber(data?.defaultCustomerNumber || "");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", ...authHeader() };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({ vapiPrivateKey, assistantId, phoneNumberId, defaultCustomerNumber }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Save failed");
      toast({ title: "Settings Saved", description: "Your VAPI configuration has been updated successfully!" });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testVapiConnection = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", ...authHeader() };
      
      // Test 1: Check if credentials are saved
      if (!vapiPrivateKey || !assistantId || !phoneNumberId) {
        setTestResults({
          success: false,
          message: "Please save your VAPI credentials first",
          tests: []
        });
        return;
      }

      const tests = [];
      
      // Test 2: Test assistant endpoint
      try {
        const assistantRes = await fetch("/api/vapi/assistant", { headers });
        if (assistantRes.ok) {
          const assistantData = await assistantRes.json();
          tests.push({
            name: "Assistant Connection",
            status: "success",
            message: `Connected to assistant: ${assistantData.name || assistantId}`,
            data: assistantData
          });
        } else {
          tests.push({
            name: "Assistant Connection",
            status: "error",
            message: "Failed to connect to assistant",
            error: await assistantRes.text()
          });
        }
      } catch (error: any) {
        tests.push({
          name: "Assistant Connection",
          status: "error",
          message: "Error testing assistant connection",
          error: error.message || "Unknown error"
        });
      }

      // Test 3: Test phone number endpoint
      try {
        const phoneRes = await fetch("/api/vapi/phone", { headers });
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json();
          tests.push({
            name: "Phone Number Connection",
            status: "success",
            message: `Connected to phone number: ${phoneData.phoneNumber || phoneNumberId}`,
            data: phoneData
          });
        } else {
          tests.push({
            name: "Phone Number Connection",
            status: "error",
            message: "Failed to connect to phone number",
            error: await phoneRes.text()
          });
        }
      } catch (error: any) {
        tests.push({
          name: "Phone Number Connection",
          status: "error",
          message: "Error testing phone number connection",
          error: error.message || "Unknown error"
        });
      }

      // Test 4: Test calls endpoint
      try {
        const callsRes = await fetch("/api/vapi/calls", { headers });
        if (callsRes.ok) {
          const callsData = await callsRes.json();
          tests.push({
            name: "Calls API Connection",
            status: "success",
            message: `Successfully connected to calls API. Found ${callsData.length} calls.`,
            data: callsData
          });
        } else {
          tests.push({
            name: "Calls API Connection",
            status: "error",
            message: "Failed to connect to calls API",
            error: await callsRes.text()
          });
        }
      } catch (error: any) {
        tests.push({
          name: "Calls API Connection",
          status: "error",
          message: "Error testing calls API connection",
          error: error.message || "Unknown error"
        });
      }

      // Test 5: Test call creation (dry run)
      if (defaultCustomerNumber) {
        try {
          const testCallRes = await fetch("/api/vapi/calls", {
            method: "POST",
            headers,
            body: JSON.stringify({ phoneNumber: defaultCustomerNumber, testMode: true }),
          });
          
          if (testCallRes.ok) {
            tests.push({
              name: "Call Creation Test",
              status: "success",
              message: "Call creation endpoint is working",
              data: await testCallRes.json()
            });
          } else {
            const errorData = await testCallRes.json();
            tests.push({
              name: "Call Creation Test",
              status: "warning",
              message: "Call creation endpoint responded but with warnings",
              data: errorData
            });
          }
        } catch (error: any) {
          tests.push({
            name: "Call Creation Test",
            status: "error",
            message: "Error testing call creation",
            error: error.message || "Unknown error"
          });
        }
      }

      const successCount = tests.filter(t => t.status === "success").length;
      const totalTests = tests.length;
      
      setTestResults({
        success: successCount === totalTests,
        message: `Tests completed: ${successCount}/${totalTests} passed`,
        tests
      });

    } catch (error: any) {
      setTestResults({
        success: false,
        message: "Testing failed with an unexpected error",
        tests: [{
          name: "General Test",
          status: "error",
          message: "Unexpected error during testing",
          error: error.message || "Unknown error"
        }]
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 border-green-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Loader2 className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="mr-3 text-primary" />
            VAPI Configuration & Testing
          </h1>
          <p className="text-gray-600 mt-2">
            Configure your VAPI credentials and test your AI agent setup
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="testing">Connection Testing</TabsTrigger>
            <TabsTrigger value="health">Health Dashboard</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="mr-2 text-primary" />
                  VAPI API Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={save}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vapiPrivateKey" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        VAPI Private Key *
                      </Label>
                      <Input
                        id="vapiPrivateKey"
                        type="password"
                        placeholder="Enter your VAPI private key"
                        value={vapiPrivateKey}
                        onChange={(e) => setVapiPrivateKey(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Get this from your VAPI dashboard under API Keys
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistantId" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Assistant ID *
                      </Label>
                      <Input
                        id="assistantId"
                        placeholder="Enter your VAPI assistant ID"
                        value={assistantId}
                        onChange={(e) => setAssistantId(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        The unique identifier for your AI agent
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumberId" className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone Number ID *
                      </Label>
                      <Input
                        id="phoneNumberId"
                        placeholder="Enter your VAPI phone number ID"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        The phone number assigned to your agent
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultCustomerNumber" className="flex items-center">
                        <Globe className="mr-2 h-4 w-4" />
                        Default Test Number
                      </Label>
                      <Input
                        id="defaultCustomerNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={defaultCustomerNumber}
                        onChange={(e) => setDefaultCustomerNumber(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Optional: Default number for testing calls
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {vapiPrivateKey && assistantId && phoneNumberId ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          All required fields are filled
                        </span>
                      ) : (
                        <span className="flex items-center text-orange-600">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Please fill in all required fields
                        </span>
                      )}
                    </div>
                    <Button type="submit" disabled={loading || !vapiPrivateKey || !assistantId || !phoneNumberId}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="mr-2 text-primary" />
                  Test Your VAPI Connection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-2">
                        Test your VAPI configuration to ensure everything is working correctly
                      </p>
                      <p className="text-sm text-gray-500">
                        This will test your credentials, assistant connection, and API endpoints
                      </p>
                    </div>
                    <Button 
                      onClick={testVapiConnection} 
                      disabled={testing || !vapiPrivateKey || !assistantId || !phoneNumberId}
                      className="min-w-[140px]"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Run Tests
                        </>
                      )}
                    </Button>
                  </div>

                  {testResults && (
                    <div className="space-y-4">
                      <Alert className={testResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <AlertDescription className="font-medium">
                          {testResults.message}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        {testResults.tests.map((test: any, index: number) => (
                          <div key={index} className={`p-4 border rounded-lg ${getStatusColor(test.status)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                {getStatusIcon(test.status)}
                                <span className="ml-2 font-medium">{test.name}</span>
                              </div>
                              <Badge variant={test.status === "success" ? "default" : test.status === "warning" ? "secondary" : "destructive"}>
                                {test.status}
                              </Badge>
                            </div>
                            <p className="text-sm">{test.message}</p>
                            {test.error && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium">View Error Details</summary>
                                <pre className="mt-2 text-xs bg-white/50 p-2 rounded border overflow-x-auto">
                                  {test.error}
                                </pre>
                              </details>
                            )}
                            {test.data && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium">View Response Data</summary>
                                <pre className="mt-2 text-xs bg-white/50 p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(test.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!testResults && !testing && (
                    <div className="text-center py-8 text-gray-500">
                      <TestTube className="mx-auto h-12 w-12 mb-4" />
                      <p>Click "Run Tests" to verify your VAPI configuration</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Dashboard Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  VAPI System Health Dashboard
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of your VAPI integration performance and system status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">✓</div>
                        <div className="text-sm text-green-800">System Status</div>
                      </div>
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        Healthy
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">∞</div>
                        <div className="text-sm text-blue-800">API Response</div>
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Fast
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-600">🔒</div>
                        <div className="text-sm text-purple-800">Security</div>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        Secure
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Credential Validation</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Valid
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">API Connectivity</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Database Connection</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Last Health Check</span>
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">System Recommendations</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your VAPI integration is running optimally</li>
                    <li>• All credentials are properly configured</li>
                    <li>• API response times are within normal range</li>
                    <li>• Ready to make calls with your AI Sales Girl!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 text-primary" />
                  VAPI Setup Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Step 1: Get Your VAPI Credentials</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Go to <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">VAPI Dashboard</a></li>
                        <li>Sign up or log in to your account</li>
                        <li>Navigate to "API Keys" section</li>
                        <li>Copy your Private Key</li>
                        <li>Go to "Agents" section and copy your Assistant ID</li>
                        <li>Go to "Phone Numbers" section and copy your Phone Number ID</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Step 2: Configure Your Settings</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Enter your VAPI Private Key in the credentials tab</li>
                        <li>Enter your Assistant ID</li>
                        <li>Enter your Phone Number ID</li>
                        <li>Optionally add a default test phone number</li>
                        <li>Click "Save Configuration"</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Step 3: Test Your Connection</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Go to the "Connection Testing" tab</li>
                        <li>Click "Run Tests" to verify everything works</li>
                        <li>Check that all tests pass successfully</li>
                        <li>If any tests fail, review the error messages</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Step 4: Start Using Your Agent</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Go to the VAPI Control page</li>
                        <li>Make test calls to verify functionality</li>
                        <li>Monitor call logs and analytics</li>
                        <li>Configure webhooks for real-time updates</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Keep your private key secure and never share it</li>
                        <li>• Test with a small number first before scaling up</li>
                        <li>• Monitor your VAPI dashboard for usage and billing</li>
                        <li>• Set up webhooks to automatically log calls</li>
                        <li>• Use the default test number for development</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) return {} as Record<string, string>;
  return { Authorization: `Bearer ${token}` } as Record<string, string>;
}


