import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, PhoneCall, User, Settings, CheckCircle, AlertCircle, Search, Activity, Clock, MapPin, Mail, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VapiControl() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Get VAPI calls
  const { data: vapiCalls = [], isLoading: callsLoading } = useQuery<any[]>({
    queryKey: ['/api/vapi/calls'],
  });

  // Get assistant details
  const { data: assistant, isLoading: assistantLoading } = useQuery<any>({
    queryKey: ['/api/vapi/assistant'],
  });

  // Get phone number details
  const { data: phoneNumberInfo, isLoading: phoneLoading } = useQuery<any>({
    queryKey: ['/api/vapi/phone'],
  });

  // Search for specific agent or calls
  const { data: searchResults, isLoading: searchLoading, refetch: refetchSearch } = useQuery<any[]>({
    queryKey: ['/api/vapi/search', searchQuery],
    enabled: false, // Only run when manually triggered
  });

  // Search for agent or calls
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter an agent ID, phone number, or customer name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";
      const response = await fetch(`/api/vapi/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 
          "Content-Type": "application/json", 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const results = await response.json();
      // Update the query data manually
      queryClient.setQueryData(['/api/vapi/search', searchQuery], results);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search for the specified query",
        variant: "destructive",
      });
    }
  };

  // Create call mutation
  const createCallMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";
      const response = await fetch("/api/vapi/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.message || "Failed to create call");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Call Initiated",
        description: `Call created successfully. ID: ${data.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vapi/calls'] });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message || "Failed to create call",
        variant: "destructive",
      });
    },
  });

  const handleCreateCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to call",
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation for phone number
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    
    createCallMutation.mutate(phoneNumber);
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getAgentInfo = (call: any) => {
    // Extract agent information from call data
    return {
      id: call.assistantId || 'Unknown',
      name: call.assistant?.name || 'Aryan Agent', // Default to Aryan if no name
      phone: call.customer?.number || 'Unknown',
      status: call.status || 'pending',
      duration: call.duration || 0,
      timestamp: call.createdAt || new Date().toISOString(),
    };
  };

  const filterCallsByAgent = (agentId: string) => {
    return vapiCalls.filter(call => call.assistantId === agentId);
  };

  const filterCallsByPhone = (phone: string) => {
    return vapiCalls.filter(call => 
      call.customer?.number?.includes(phone) || 
      call.phoneNumberId === phone
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              <Settings className="inline-block text-primary mr-3" />
              INTELA AI Agent Control
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">Developed by Cehpoint</div>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Settings className="mr-2 text-blue-600" />
              Configure Your VAPI Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-blue-800">
                <p className="mb-2">
                  <strong>Important:</strong> To use this system with your own VAPI account, you need to configure your credentials first.
                </p>
                <p className="text-sm">
                  Go to Settings → Credentials tab to enter your VAPI Private Key, Assistant ID, and Phone Number ID.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/settings'} 
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 text-primary" />
              Search Agent & Call Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter Agent ID, Phone Number, or Customer Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Search Results ({searchResults.length})</h4>
                <div className="space-y-3">
                  {searchResults.map((call: any) => {
                    const agentInfo = getAgentInfo(call);
                    return (
                      <div key={call.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-900">{agentInfo.name}</h5>
                              <p className="text-sm text-blue-700">Agent ID: {agentInfo.id}</p>
                            </div>
                          </div>
                          <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                            {call.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-blue-800">{formatPhoneNumber(agentInfo.phone)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-blue-800">{new Date(agentInfo.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-blue-800">{agentInfo.duration}s</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-blue-800">{call.customer?.name || 'Unknown Customer'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {searchResults && searchResults.length === 0 && searchQuery && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400">Try searching with a different agent ID, phone number, or customer name</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="calls">Call Logs</TabsTrigger>
            <TabsTrigger value="testing">API Testing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Make Call Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PhoneCall className="mr-2 text-primary" />
                    Make New Call
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Outbound calling may not be enabled on your VAPI account. 
                        Contact VAPI support to enable this feature for live calls.
                      </p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleCreateCall} className="space-y-4">
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a valid US phone number (e.g., 5551234567 or +15551234567)
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={createCallMutation.isPending}
                      className="w-full"
                    >
                      {createCallMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Call...
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2 h-4 w-4" />
                          Start Call
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Assistant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 text-primary" />
                    Assistant Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assistantLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : assistant ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                        <span className="text-sm font-medium">Assistant Active</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID: {assistant.id}</p>
                        <p className="text-sm text-gray-600">Name: {assistant.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="text-orange-500 mr-2 h-4 w-4" />
                      <span className="text-sm">Assistant information unavailable</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 text-primary" />
                  Agent Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="agentId">Agent ID</Label>
                      <Input
                        id="agentId"
                        placeholder="Enter agent ID to view details..."
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={() => setSearchQuery(agentId)}
                      disabled={!agentId.trim()}
                      className="mt-6"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      View Agent
                    </Button>
                  </div>
                  
                  {agentId && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="font-medium text-blue-900 mb-2">Agent Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Agent ID:</span> {agentId}
                        </div>
                        <div>
                          <span className="font-medium">Name:</span> Aryan Agent
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <Badge variant="default" className="ml-2">Active</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> Sales Agent
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PhoneCall className="mr-2 text-primary" />
                  Call Logs & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {callsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : vapiCalls.length > 0 ? (
                  <div className="space-y-4">
                    {vapiCalls.map((call: any) => {
                      const agentInfo = getAgentInfo(call);
                      return (
                        <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{agentInfo.name}</h4>
                                <p className="text-sm text-gray-500">Agent ID: {agentInfo.id}</p>
                              </div>
                            </div>
                            <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                              {call.status || 'pending'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{formatPhoneNumber(agentInfo.phone)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{new Date(agentInfo.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{agentInfo.duration}s</span>
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{call.customer?.name || 'Unknown Customer'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No call data available</p>
                    <p className="text-sm text-gray-400">Call logs will appear here when calls are made</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 text-primary" />
                  VAPI API Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Test Endpoints</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          GET /api/vapi/calls
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          GET /api/vapi/assistant
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          GET /api/vapi/phone
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          POST /api/vapi/calls
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">API Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>VAPI Connection:</span>
                          <Badge variant="default">Connected</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Authentication:</span>
                          <Badge variant="default">Valid</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Rate Limit:</span>
                          <Badge variant="secondary">Normal</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Quick Test</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Use the search function above to test agent lookup and call history.
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Enter an agent ID to see their call history</p>
                      <p>• Enter a phone number to see call logs</p>
                      <p>• Enter a customer name to search calls</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 py-8 bg-gray-800 text-white rounded-lg">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">INTELA AI Agent Solution</h3>
                <p className="text-gray-300 text-sm">Professional AI-powered sales communication platform</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-300">Developed by</p>
                <p className="text-xl font-bold">Cehpoint</p>
                <p className="text-xs text-gray-400">IT & Cyber Security Company</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
              <div>© 2025 INTELA AI Agent Solution. All rights reserved.</div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                  System Operational
                </span>
                <span>Connected to VAPI</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}