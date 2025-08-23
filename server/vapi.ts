// VAPI API service using fetch instead of SDK
const VAPI_BASE_URL = "https://api.vapi.ai";

export class VapiService {
  private readonly privateKey: string;
  private readonly defaultAssistantId?: string;
  private readonly defaultPhoneNumberId?: string;

  constructor(options?: { privateKey?: string; assistantId?: string; phoneNumberId?: string }) {
    this.privateKey = options?.privateKey || process.env.VAPI_PRIVATE_KEY || "";
    this.defaultAssistantId = options?.assistantId;
    this.defaultPhoneNumberId = options?.phoneNumberId;
  }

  private async vapiRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.privateKey) {
      throw new Error("VAPI private key missing. Please configure in settings.");
    }
    const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.privateKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`VAPI API error details:`, errorText);
      throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Get all calls from VAPI
  async getCalls() {
    try {
      const calls = await this.vapiRequest("/call");
      return calls;
    } catch (error) {
      console.error("Error fetching calls from VAPI:", error);
      throw error;
    }
  }

  // Get specific call details
  async getCall(callId: string) {
    try {
      const call = await this.vapiRequest(`/call/${callId}`);
      return call;
    } catch (error) {
      console.error("Error fetching call from VAPI:", error);
      throw error;
    }
  }

  // Create a new call
  async createCall(phoneNumber: string, assistantId?: string) {
    try {
      // Format phone number to E.164 format
      const formattedPhone = this.formatToE164(phoneNumber);
      
      const call = await this.vapiRequest("/call", {
        method: "POST",
        body: JSON.stringify({
          phoneNumberId: this.defaultPhoneNumberId,
          assistantId: assistantId || this.defaultAssistantId,
          customer: {
            number: formattedPhone,
          },
        }),
      });
      return call;
    } catch (error) {
      console.error("Error creating call:", error);
      throw error;
    }
  }

  // Format phone number to E.164 format
  private formatToE164(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If starts with 1 and has 11 digits, assume US number
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // If 10 digits, assume US number without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If already starts with country code
    if (digits.length > 10) {
      return `+${digits}`;
    }
    
    // Default: add +1 for US
    return `+1${digits}`;
  }

  // Get assistant details
  async getAssistant(assistantId: string = "b3870ff6-ed43-402e-bdba-14f65567e517") {
    try {
      const assistant = await this.vapiRequest(`/assistant/${assistantId}`);
      return assistant;
    } catch (error) {
      console.error("Error fetching assistant:", error);
      throw error;
    }
  }

  // Update assistant configuration
  async updateAssistant(assistantId: string, updates: any) {
    try {
      const assistant = await this.vapiRequest(`/assistant/${assistantId}`, {
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
  async getPhoneNumber(phoneNumberId: string) {
    try {
      const phoneNumber = await this.vapiRequest(`/phone-number/${phoneNumberId}`);
      return phoneNumber;
    } catch (error) {
      console.error("Error fetching phone number:", error);
      throw error;
    }
  }

  // New method: Get detailed call information
  async getCallDetails(callId: string): Promise<any> {
    return this.vapiRequest(`/calls/${callId}`);
  }

  // New method: Cancel/End an active call
  async cancelCall(callId: string): Promise<any> {
    return this.vapiRequest(`/calls/${callId}/end`, {
      method: 'POST',
      body: JSON.stringify({ status: 'ended' })
    });
  }

  // New method: Get call transcripts
  async getCallTranscript(callId: string): Promise<any> {
    return this.vapiRequest(`/calls/${callId}/transcript`);
  }

  // New method: Get call analytics
  async getCallAnalytics(callId: string): Promise<any> {
    return this.vapiRequest(`/calls/${callId}/analytics`);
  }
}
export function createVapiService(options?: { privateKey?: string; assistantId?: string; phoneNumberId?: string }) {
  return new VapiService(options);
}