// Test script to simulate VAPI webhook calls
// Usage: node test-webhook.js

const API_KEY = process.env.API_KEY || "your-api-key-here";
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const testCalls = [
  {
    name: "Sarah Johnson",
    company: "TechCorp Inc.",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 123-4567",
    status: "completed",
    notes: "Interested in enterprise package. Follow up next week for demo.",
    recording_url: "https://example.com/recording1.mp3"
  },
  {
    name: "Michael Chen",
    company: "Startup.io",
    email: "m.chen@startup.io",
    phone: "+1 (555) 987-6543",
    status: "pending",
    notes: "Left voicemail. Requested callback for pricing information.",
    recording_url: null
  },
  {
    name: "Emily Rodriguez",
    company: "BizCompany LLC",
    email: "e.rodriguez@bizcompany.com",
    phone: "+1 (555) 456-7890",
    status: "failed",
    notes: "Line busy. Retry scheduled for tomorrow morning.",
    recording_url: null
  },
  {
    name: "David Thompson",
    company: "Consulting Pro",
    email: "david@consulting.pro",
    phone: "+1 (555) 321-0987",
    status: "completed",
    notes: "Very interested! Scheduled meeting for next Tuesday to discuss implementation.",
    recording_url: "https://example.com/recording2.mp3"
  }
];

async function testWebhook() {
  console.log("Testing VAPI webhook endpoint...");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log("");

  for (let i = 0; i < testCalls.length; i++) {
    const call = testCalls[i];
    console.log(`Sending test call ${i + 1}/${testCalls.length}: ${call.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/logCall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY
        },
        body: JSON.stringify(call)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${result.message} (ID: ${result.callId})`);
      } else {
        const error = await response.json();
        console.log(`❌ Error ${response.status}: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log("");
  }

  // Test fetching calls
  console.log("Testing GET /api/calls endpoint...");
  try {
    const response = await fetch(`${BASE_URL}/api/calls`);
    if (response.ok) {
      const calls = await response.json();
      console.log(`✅ Successfully fetched ${calls.length} calls`);
    } else {
      console.log(`❌ Error fetching calls: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Network error fetching calls: ${error.message}`);
  }

  console.log("");
  console.log("Test completed!");
  console.log("");
  console.log("Instructions for VAPI integration:");
  console.log("1. Set your webhook URL in VAPI to: " + BASE_URL + "/api/logCall");
  console.log("2. Add X-API-KEY header with value: " + API_KEY);
  console.log("3. Configure VAPI to send JSON data with fields: name, company, email, phone, status, notes, recording_url");
}

testWebhook().catch(console.error);
