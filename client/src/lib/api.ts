import { apiRequest } from "./queryClient";
import type { InsertCall, Call } from "@shared/schema";

export const api = {
  // Log a new call (VAPI webhook endpoint)
  logCall: async (callData: InsertCall, apiKey: string) => {
    const response = await apiRequest("POST", "/api/logCall", callData);
    return response.json();
  },

  // Get all calls
  getCalls: async (): Promise<Call[]> => {
    const response = await apiRequest("GET", "/api/calls");
    return response.json();
  },

  // Get call statistics
  getStats: async () => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};
