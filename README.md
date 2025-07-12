# LeadFlow - AI-Powered Real Estate CRM

LeadFlow is a comprehensive real estate CRM system that combines AI-powered calling, lead management, email automation, and advanced analytics to streamline real estate operations.

## 🚀 Features

### 🤖 AI-Powered Calling
- **VAPI Integration**: Automated calling using VAPI's AI assistant
- **Campaign Management**: Create and manage calling campaigns with custom prompts
- **Call History**: Track and analyze all call interactions
- **Smart Lead Targeting**: Intelligent lead prioritization and calling strategies

### 📧 Email Automation
- **Bulk Email Sending**: Send personalized emails to multiple leads simultaneously
- **Email Templates**: Create and manage reusable email templates
- **Gmail SMTP Integration**: Seamless email delivery through Gmail
- **Email History**: Track all sent emails with delivery status
- **Lead-Specific Emails**: Send targeted emails to individual leads

### 👥 Lead Management
- **Lead Database**: Comprehensive lead storage and management
- **Lead Analytics**: Track lead engagement and conversion rates
- **Property File Management**: Upload and manage property files for campaigns
- **Lead Scoring**: Intelligent lead prioritization based on interactions

### 📊 Advanced Analytics
- **Real-time Dashboard**: Live metrics and performance indicators
- **Campaign Analytics**: Track campaign performance and success rates
- **Call Analytics**: Analyze call patterns and outcomes
- **Email Analytics**: Monitor email engagement and delivery rates
- **Timeline Views**: Visual representation of lead interactions over time

### 🎯 Campaign Management
- **Campaign Creation**: Set up automated calling campaigns
- **Pause/Resume**: Control campaign execution in real-time
- **Progress Tracking**: Monitor campaign completion rates
- **Success Metrics**: Track campaign effectiveness and ROI

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (server-side), localStorage (client-side)
- **AI Calling**: VAPI (Voice AI Platform)
- **Email**: Gmail SMTP
- **Authentication**: Custom auth system
- **Icons**: Lucide React

## 📋 Prerequisites

Before running LeadFlow, ensure you have:

- Node.js 18+ installed
- MongoDB database (for production)
- VAPI account and API credentials
- Gmail account with app password for email sending

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd real-estate-crm-nextjs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory with the following variables:

```env
# VAPI Configuration
NEXT_PUBLIC_VAPI_PRIVATE_KEY=your_vapi_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
NEXT_PUBLIC_PHONE_NUMBER_ID=your_phone_number_id

# Email Configuration
GMAIL_EMAIL=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password

# Database (for production)
MONGODB_URI=your_mongodb_connection_string

# Authentication
AUTH_SECRET=your_auth_secret
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── call-history/      # Call history page
│   ├── context/           # React contexts
│   └── pages/             # Page components
├── components/            # Reusable UI components
├── models/               # Data models
├── services/             # Business logic services
└── utils/                # Utility functions
```

## 🔧 Key Components

### Services
- **`vapiService.ts`**: Handles AI calling functionality
- **`emailService.ts`**: Manages email sending and templates
- **`databaseService.ts`**: Database operations and data management
- **`leadService.ts`**: Lead management operations

### Components
- **`CallHistoryTable.tsx`**: Displays call history with filtering
- **`CampaignHistoryTable.tsx`**: Shows campaign performance
- **`BulkEmailComposer.tsx`**: Bulk email composition interface
- **`CampaignManager.tsx`**: Campaign creation and management

## 🎨 Features in Detail

### AI Calling System
- Integrates with VAPI for automated phone calls
- Supports custom prompts for different scenarios
- Tracks call outcomes and customer responses
- Provides detailed call analytics

### Email Automation
- Bulk email sending to multiple leads
- Template-based email composition
- Gmail SMTP integration for reliable delivery
- Email history and delivery tracking

### Lead Management
- Comprehensive lead database
- Lead scoring and prioritization
- Property file management
- Lead interaction history

### Analytics Dashboard
- Real-time performance metrics
- Campaign success tracking
- Call and email analytics
- Visual data representations

## 🔒 Security Features

- Client-side data storage with localStorage
- Server-side MongoDB integration
- Secure API key management
- Authentication system for user access

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all required environment variables are set in your production environment:
- VAPI credentials
- Gmail SMTP settings
- MongoDB connection string
- Authentication secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

---

**LeadFlow** - Transforming real estate lead management with AI-powered automation.
