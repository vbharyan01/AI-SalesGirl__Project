# VAPI Integration Setup Guide

## Your VAPI Credentials
- **Public Key**: 740abf27-9130-4ade-a3d0-477e8229d044
- **Private Key**: d98e80d8-9153-40f2-8f66-df366364247a
- **Agent ID**: b3870ff6-ed43-402e-bdba-14f65567e517
- **Phone ID**: 46b06452-9890-40f3-b046-80a7543f63c3
- **SIP**: sip:cehpoint-agent@sip.vapi.ai

## Webhook Configuration

### Step 1: Deploy Your Application
1. Click the "Deploy" button in Replit
2. Your app will be available at: `https://[your-repl-name].[username].replit.app`

### Step 2: Configure VAPI Webhook
1. Go to https://dashboard.vapi.ai
2. Navigate to your Agent (ID: b3870ff6-ed43-402e-bdba-14f65567e517)
3. In the agent settings, find "Webhook" or "End Call Function"
4. Set the webhook URL to: `https://[your-deployed-url]/api/logCall`
5. Add HTTP Header:
   - Key: `X-API-KEY`
   - Value: `740abf27-9130-4ade-a3d0-477e8229d044`

### Step 3: Configure Data Format
Ensure your VAPI agent sends JSON data with these fields:
```json
{
  "name": "Customer Name",
  "company": "Company Name",
  "email": "customer@email.com", 
  "phone": "+1234567890",
  "status": "completed",
  "notes": "Call summary and notes",
  "recording_url": "https://recording-url.com"
}
```

### Step 4: Test Integration
1. Make a test call using your VAPI phone number
2. Check your dashboard for the call data
3. Verify all fields are populated correctly

## Troubleshooting
- If calls don't appear, check the webhook URL is correct
- Ensure the API key header is properly set
- Verify the JSON format matches the expected schema