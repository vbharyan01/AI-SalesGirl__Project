import { apiRequest } from "./queryClient";
import type { InsertCall, Call } from "@shared/schema";

// Extended Call interface to handle both formats
export interface ExtendedCall extends Call {
  // VAPI API format properties
  assistantId?: string;
  assistant?: { name: string };
  customer?: { 
    number: string; 
    name: string 
  };
  duration?: number;
  createdAt?: string;
}

export const api = {
  // Log a new call (VAPI webhook endpoint)
  logCall: async (callData: InsertCall, apiKey: string) => {
    const response = await apiRequest("POST", "/api/logCall", callData);
    return response.json();
  },

  // Get all calls from VAPI endpoint (has demo data)
  getCalls: async (): Promise<ExtendedCall[]> => {
    const response = await apiRequest("GET", "/api/vapi/calls");
    return response.json();
  },

  // Get call statistics
  getStats: async () => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },

  // Search VAPI calls
  searchCalls: async (query: string) => {
    const response = await apiRequest("GET", `/api/vapi/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Get VAPI assistant info
  getAssistant: async (assistantId?: string) => {
    const url = assistantId ? `/api/vapi/assistant/${assistantId}` : '/api/vapi/assistant';
    const response = await apiRequest("GET", url);
    return response.json();
  },

  // Get VAPI phone info
  getPhone: async (phoneNumberId?: string) => {
    const url = phoneNumberId ? `/api/vapi/phone/${phoneNumberId}` : '/api/vapi/phone';
    const response = await apiRequest("GET", url);
    return response.json();
  },

  // Create a new VAPI call
  createCall: async (callData: any) => {
    const response = await apiRequest("POST", "/api/vapi/calls", callData);
    return response.json();
  },
};
