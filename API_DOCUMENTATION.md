# LeadFlow API Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Internal API Endpoints](#internal-api-endpoints)
3. [VAPI Integration](#vapi-integration)
4. [Features Documentation](#features-documentation)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)
8. [Environment Variables](#environment-variables)

---

## 🚀 Overview

LeadFlow is a comprehensive real estate CRM with AI-powered calling, email automation, lead management, and advanced analytics. This documentation covers all API endpoints, features, and integration points.

---

## 🔗 Internal API Endpoints

### Authentication Endpoints

#### `POST /api/login`
**Purpose**: User authentication and login

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Status Codes**:
- `200`: Login successful
- `401`: Invalid credentials
- `500`: Server error

---

### Email Management Endpoints

#### `GET /api/emails`
**Purpose**: Retrieve all sent emails

**Response**:
```json
{
  "emails": [
    {
      "id": "email_id",
      "to": "recipient@example.com",
      "subject": "Email Subject",
      "content": "Email content",
      "status": "sent",
      "sentAt": "2024-01-01T00:00:00Z",
      "templateId": "template_id"
    }
  ]
}
```

#### `POST /api/emails`
**Purpose**: Send a new email

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "content": "Email content",
  "templateId": "template_id"
}
```

#### `GET /api/emails/[id]`
**Purpose**: Get specific email details

**Parameters**:
- `id`: Email ID

#### `PUT /api/emails/[id]`
**Purpose**: Update email details

#### `DELETE /api/emails/[id]`
**Purpose**: Delete an email

#### `POST /api/emails/bulk-delete`
**Purpose**: Delete multiple emails

**Request Body**:
```json
{
  "emailIds": ["id1", "id2", "id3"]
}
```

#### `POST /api/emails/bulk-update`
**Purpose**: Update multiple emails

**Request Body**:
```json
{
  "emailIds": ["id1", "id2"],
  "updates": {
    "status": "read"
  }
}
```

---

### Email Sending Endpoints

#### `POST /api/email/send`
**Purpose**: Send individual email

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Subject",
  "content": "Email content",
  "templateId": "template_id"
}
```

#### `POST /api/email/bulk`
**Purpose**: Send bulk emails

**Request Body**:
```json
{
  "recipients": [
    {
      "email": "user1@example.com",
      "name": "User 1"
    }
  ],
  "subject": "Bulk Email Subject",
  "content": "Email content",
  "templateId": "template_id"
}
```

#### `POST /api/email/leads`
**Purpose**: Send email to specific lead

**Request Body**:
```json
{
  "leadId": "lead_id",
  "subject": "Subject",
  "content": "Email content"
}
```

#### `POST /api/email/test`
**Purpose**: Test email configuration

**Request Body**:
```json
{
  "to": "test@example.com"
}
```

---

### Lead Management Endpoints

#### `GET /api/leads`
**Purpose**: Retrieve all leads

**Response**:
```json
{
  "leads": [
    {
      "id": "lead_id",
      "name": "Lead Name",
      "email": "lead@example.com",
      "phone": "+1234567890",
      "status": "new",
      "interest": "high",
      "requestedCallback": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/leads`
**Purpose**: Create new lead

**Request Body**:
```json
{
  "name": "Lead Name",
  "email": "lead@example.com",
  "phone": "+1234567890",
  "status": "new",
  "interest": "high"
}
```

#### `GET /api/leads/[id]`
**Purpose**: Get specific lead details

#### `PUT /api/leads/[id]`
**Purpose**: Update lead details

#### `DELETE /api/leads/[id]`
**Purpose**: Delete a lead

---

## 🤖 VAPI Integration

### VAPI Service Methods

#### `makeCall(request: VAPICallRequest)`
**Purpose**: Make a single AI-powered call

**Request**:
```typescript
interface VAPICallRequest {
  phoneNumberId: string;
  assistantId: string;
  customer: {
    number: string;
    name?: string;
    info?: string;
  };
  metadata?: {
    campaignId?: string;
    customerInfo?: string;
  };
}
```

**Response**:
```typescript
interface VAPICallResponse {
  id: string;
  status: string;
  customer: {
    number: string;
    name?: string;
  };
  assistant: {
    id: string;
  };
  phoneNumber: {
    id: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

#### `scheduleCall(request: VAPIScheduleCallRequest)`
**Purpose**: Schedule a call for later

**Request**:
```typescript
interface VAPIScheduleCallRequest extends VAPICallRequest {
  scheduledTime?: string;
  timeOfDay?: string;
  timezone?: string;
}
```

#### `createCampaign(request: VAPICampaignRequest)`
**Purpose**: Create an AI calling campaign

**Request**:
```typescript
interface VAPICampaignRequest {
  name: string;
  assistantId: string;
  phoneNumberId: string;
  leads: Array<{
    name: string;
    phone: string;
    info?: string;
  }>;
  prompt?: string;
  scheduledTime?: string;
  timeOfDay?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
}
```

#### `getCampaigns()`
**Purpose**: Retrieve all campaigns

**Response**:
```typescript
interface VAPICampaignResponse[] {
  id: string;
  name: string;
  status: string;
  assistantId: string;
  phoneNumberId: string;
  leads: Array<{
    name: string;
    phone: string;
    info?: string;
  }>;
  prompt?: string;
  createdAt: string;
}
```

#### `getCampaignDetails(campaignId: string)`
**Purpose**: Get detailed campaign information

**Response**:
```typescript
{
  campaign: VAPICampaignResponse;
  callStatuses: Array<{
    callId: string;
    customerName: string;
    phoneNumber: string;
    status: string;
    duration?: string;
    createdAt: string;
  }>;
}
```

#### `getCampaignAnalytics(campaignId: string)`
**Purpose**: Get comprehensive campaign analytics

**Response**:
```typescript
{
  success: boolean;
  data?: {
    totalCalls: number;
    answeredCalls: number;
    unansweredCalls: number;
    failedCalls: number;
    averageCallDuration: number;
    answerRate: number;
    successRate: number;
    conversionRate: number;
    leadsGenerated: number;
    callbackRequests: number;
    interestedCustomers: number;
    callTimeline: Array<{
      date: string;
      calls: number;
      answered: number;
      conversions: number;
    }>;
    topPerformingLeads: Array<{
      name: string;
      phone: string;
      status: string;
      duration: number;
      interest: string;
    }>;
  };
  message?: string;
}
```

#### Campaign Management Methods

- `pauseCampaign(campaignId: string)` - Pause campaign execution
- `resumeCampaign(campaignId: string)` - Resume paused campaign
- `stopCampaign(campaignId: string)` - Stop campaign execution
- `deleteCampaign(campaignId: string)` - Delete campaign

#### Call Management Methods

- `getCalls()` - Retrieve all calls
- `getCallStatus(callId: string)` - Get specific call status
- `getScheduledCalls()` - Get scheduled calls
- `cancelScheduledCall(id: string)` - Cancel scheduled call

---

## 🎯 Features Documentation

### 1. AI-Powered Calling System

#### Single Call Feature
- **Purpose**: Make individual AI-powered calls to leads
- **Components**: 
  - Call scheduling (immediate or scheduled)
  - Phone number validation and formatting
  - Call status tracking
  - Call history recording

#### Campaign Management
- **Purpose**: Create and manage automated calling campaigns
- **Features**:
  - Campaign creation with custom prompts
  - Lead list management
  - Campaign scheduling
  - Real-time status monitoring
  - Pause/resume functionality
  - Campaign analytics

#### Call Analytics
- **Metrics Tracked**:
  - Total calls made
  - Answer rates
  - Call duration
  - Conversion rates
  - Campaign performance
  - Top performing leads

### 2. Email Automation System

#### Bulk Email Sending
- **Purpose**: Send personalized emails to multiple recipients
- **Features**:
  - Template-based email composition
  - Variable substitution
  - Email history tracking
  - Delivery status monitoring

#### Email Templates
- **Pre-built Templates**:
  - Lead follow-up
  - Property showing invitation
  - Market updates
  - Open house invitations
  - Welcome emails

#### Email Management
- **Features**:
  - Email history
  - Template management
  - Bulk operations
  - Delivery tracking

### 3. Lead Management System

#### Lead Database
- **Purpose**: Comprehensive lead storage and management
- **Features**:
  - Lead creation and editing
  - Status tracking
  - Interest level classification
  - Callback request tracking
  - Lead analytics

#### Lead Analytics
- **Metrics**:
  - Lead conversion rates
  - Engagement tracking
  - Performance analytics
  - ROI calculations

### 4. Analytics Dashboard

#### Real-time Metrics
- **Campaign Analytics**:
  - Total campaigns
  - Active campaigns
  - Success rates
  - Completion rates

#### Call Analytics
- **Metrics**:
  - Total calls
  - Answer rates
  - Average duration
  - Conversion rates

#### Email Analytics
- **Metrics**:
  - Emails sent
  - Delivery rates
  - Open rates
  - Click-through rates

### 5. Campaign Analytics

#### Advanced Analytics
- **Features**:
  - 7-day call timeline
  - Top performing leads
  - Conversion tracking
  - ROI analysis
  - Performance comparisons

#### Real-time Updates
- **Features**:
  - Live campaign status
  - Auto-refresh functionality
  - Progress tracking
  - Alert system

---

## 🔐 Authentication

### Authentication Flow
1. User submits login credentials
2. Server validates credentials
3. JWT token generated and returned
4. Token stored in client-side storage
5. Token included in subsequent requests

### Protected Routes
- All API endpoints require authentication
- Token validation on each request
- Automatic logout on token expiration

---

## ⚠️ Error Handling

### Standard Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common Error Codes
- `AUTH_FAILED`: Authentication failed
- `INVALID_REQUEST`: Invalid request data
- `VAPI_ERROR`: VAPI service error
- `EMAIL_ERROR`: Email service error
- `DATABASE_ERROR`: Database operation failed

### Error Handling Strategy
- Graceful degradation for service failures
- User-friendly error messages
- Detailed logging for debugging
- Retry mechanisms for transient failures

---

## 📊 Data Models

### Lead Model
```typescript
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  interest: 'high' | 'medium' | 'low';
  requestedCallback: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Email Model
```typescript
interface Email {
  id: string;
  to: string;
  subject: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  templateId?: string;
  sentAt: string;
}
```

### Campaign Model
```typescript
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  leads: string[];
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Call History Model
```typescript
interface CallHistory {
  id: string;
  customerName: string;
  phoneNumber: string;
  duration: string;
  status: 'answered' | 'unanswered' | 'busy';
  type: 'campaign' | 'single';
  campaignName?: string;
  timestamp: string;
}
```

---

## 🔧 Environment Variables

### Required Environment Variables

```env
# VAPI Configuration
NEXT_PUBLIC_VAPI_PRIVATE_KEY=your_vapi_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
NEXT_PUBLIC_PHONE_NUMBER_ID=your_phone_number_id

# Email Configuration
GMAIL_EMAIL=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Authentication
AUTH_SECRET=your_auth_secret
```

### Optional Environment Variables

```env
# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Templates
EMAIL_FROM_NAME=LeadFlow CRM
EMAIL_REPLY_TO=support@leadflow.com
```

---

## 🚀 Getting Started

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Fill in your configuration
# VAPI credentials
# Gmail SMTP settings
# Database connection
# Authentication secrets
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Test API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realestate.com","password":"admin123"}'

# Test VAPI connection
curl -X GET http://localhost:3000/api/vapi/test
```

---

## 📝 API Best Practices

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Rate Limiting
- VAPI calls: 100 requests/minute
- Email sending: 50 emails/minute
- Database operations: No limit

### Error Handling
- Always check response status
- Handle network errors gracefully
- Implement retry logic for transient failures

---

## 🔍 Troubleshooting

### Common Issues

#### VAPI Connection Issues
- Verify API key is correct
- Check assistant and phone number IDs
- Ensure network connectivity

#### Email Sending Issues
- Verify Gmail app password
- Check SMTP settings
- Ensure email templates are valid

#### Database Issues
- Verify MongoDB connection string
- Check database permissions
- Ensure collections exist

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

---

## 📞 Support

For technical support:
- Check the troubleshooting section
- Review error logs
- Contact development team
- Submit issue on GitHub

---

**LeadFlow API Documentation** - Version 1.0  
*Last updated: January 2024* 