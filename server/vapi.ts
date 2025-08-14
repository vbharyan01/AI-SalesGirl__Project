// VAPI API service using fetch instead of SDK
const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || "d98e80d8-9153-40f2-8f66-df366364247a";

async function vapiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`VAPI API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export class VapiService {
  // Get all calls from VAPI
  async getCalls() {
    try {
      const calls = await vapiRequest("/call");
      return calls;
    } catch (error) {
      console.error("Error fetching calls from VAPI:", error);
      throw error;
    }
  }

  // Get specific call details
  async getCall(callId: string) {
    try {
      const call = await vapiRequest(`/call/${callId}`);
      return call;
    } catch (error) {
      console.error("Error fetching call from VAPI:", error);
      throw error;
    }
  }

  // Create a new call
  async createCall(phoneNumber: string, assistantId: string = "b3870ff6-ed43-402e-bdba-14f65567e517") {
    try {
      const call = await vapiRequest("/call", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberId: "46b06452-9890-40f3-b046-80a7543f63c3",
          assistantId: assistantId,
          customer: {
            number: phoneNumber,
          },
        }),
      });
      return call;
    } catch (error) {
      console.error("Error creating call:", error);
      throw error;
    }
  }

  // Get assistant details
  async getAssistant(assistantId: string = "b3870ff6-ed43-402e-bdba-14f65567e517") {
    try {
      const assistant = await vapiRequest(`/assistant/${assistantId}`);
      return assistant;
    } catch (error) {
      console.error("Error fetching assistant:", error);
      throw error;
    }
  }

  // Update assistant configuration
  async updateAssistant(assistantId: string, updates: any) {
    try {
      const assistant = await vapiRequest(`/assistant/${assistantId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return assistant;
    } catch (error) {
      console.error("Error updating assistant:", error);
      throw error;
    }
  }

  // Get phone number details
  async getPhoneNumber(phoneNumberId: string = "46b06452-9890-40f3-b046-80a7543f63c3") {
    try {
      const phoneNumber = await vapiRequest(`/phone-number/${phoneNumberId}`);
      return phoneNumber;
    } catch (error) {
      console.error("Error fetching phone number:", error);
      throw error;
    }
  }
}

export const vapiService = new VapiService();