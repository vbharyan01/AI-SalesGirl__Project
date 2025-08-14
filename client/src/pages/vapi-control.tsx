import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneCall, User, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VapiControl() {
  const [phoneNumber, setPhoneNumber] = useState("");
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

  // Create call mutation
  const createCallMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch("/api/vapi/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              <Settings className="inline-block text-primary mr-3" />
              VAPI Control Panel
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">AI Sales Girl</div>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <p className="text-sm text-gray-600">ID: {assistant.id || "b3870ff6-ed43-402e-bdba-14f65567e517"}</p>
                    <p className="text-sm text-gray-600">Name: {assistant.name || "AI Sales Girl"}</p>
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

          {/* Phone Number Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="mr-2 text-primary" />
                Phone Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phoneLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : phoneNumberInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Phone Active</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{formatPhoneNumber(phoneNumberInfo.number || "+1 (555) 555-0123")}</p>
                    <p className="text-sm text-gray-600">ID: {phoneNumberInfo.id || "46b06452-9890-40f3-b046-80a7543f63c3"}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Phone Configured</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">+1 (555) 555-0123</p>
                    <p className="text-sm text-gray-600">ID: 46b06452-9890-40f3-b046-80a7543f63c3</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent VAPI Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhoneCall className="mr-2 text-primary" />
                Recent VAPI Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
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
                <div className="space-y-3">
                  {vapiCalls.slice(0, 5).map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{call.customer?.number || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{new Date(call.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                        {call.status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Phone className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No VAPI calls found</p>
                  <p className="text-xs text-gray-400">Make your first call using the form above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}