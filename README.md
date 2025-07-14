# LeadFlow CRM

A comprehensive real estate CRM system built with Next.js, featuring AI-powered calling, email management, and lead tracking.

## 🚀 Features

- **Lead Management**: Track and manage real estate leads with detailed information
- **AI Calling**: Automated phone calls using VAPI (Voice AI Platform)
- **Email Campaigns**: Bulk email sending with templates and tracking
- **Call History**: Monitor and analyze call performance
- **Analytics Dashboard**: Comprehensive insights and reporting
- **User Authentication**: Secure login with Supabase Auth
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Calling**: VAPI (Voice AI Platform)
- **Email**: Gmail SMTP
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📋 Prerequisites

Before running LeadFlow, ensure you have:

- Node.js 18+ installed
- Supabase account and project
- VAPI account and API credentials
- Gmail account with app password for email sending

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd leadflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# VAPI Configuration
NEXT_PUBLIC_VAPI_PRIVATE_KEY=your_vapi_private_key_here
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id_here
NEXT_PUBLIC_PHONE_NUMBER_ID=your_vapi_phone_number_id_here

# Email Configuration
GMAIL_EMAIL=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Email Templates Configuration
EMAIL_FROM_NAME=LeadFlow CRM
EMAIL_REPLY_TO=support@leadflow.com
```

### 4. Set up Supabase Database

1. Create a new Supabase project
2. Run the database migration script to create tables
3. Configure Row Level Security (RLS) policies
4. Create a test user in Supabase Auth

### 5. Run the Development Server
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
- **`supabase.ts`**: Supabase client configuration
- **`vapiService.ts`**: Handles AI calling functionality
- **`emailService.ts`**: Manages email sending and templates
- **`leadService.ts`**: Lead management operations
- **`emailDataService.ts`**: Email data management

### Authentication
- **Supabase Auth**: Secure user authentication
- **AuthContext**: React context for auth state management
- **LoginPage**: User login and registration

### Database Schema
- **users**: User accounts and profiles
- **leads**: Lead information and status
- **emails**: Email records and tracking
- **campaigns**: Campaign management
- **call_history**: Call logs and analytics

## 🚀 Getting Started

### 1. Supabase Setup
1. Create a new Supabase project
2. Get your project URL and API keys
3. Run the database migration script
4. Configure authentication settings

### 2. VAPI Setup
1. Create a VAPI account
2. Set up your assistant and phone number
3. Add your API credentials to environment variables

### 3. Email Setup
1. Enable 2FA on your Gmail account
2. Generate an app password
3. Add email credentials to environment variables

### 4. Test the Application
1. Start the development server
2. Create a test user account
3. Test lead management and email features

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/login` - User login (now handled by Supabase Auth)

### Lead Management
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create a new lead
- `GET /api/leads/[id]` - Get a specific lead
- `PUT /api/leads/[id]` - Update a lead
- `DELETE /api/leads/[id]` - Delete a lead

### Email Management
- `GET /api/emails` - Get all emails
- `POST /api/emails` - Create email record
- `POST /api/email/send` - Send individual email
- `POST /api/email/bulk` - Send bulk emails

## 🔒 Security

- **Row Level Security (RLS)**: Database-level security policies
- **Supabase Auth**: Secure authentication and session management
- **Environment Variables**: Secure credential management
- **Input Validation**: Server-side validation for all inputs

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Database Migration
1. Run migration scripts in Supabase SQL editor
2. Configure RLS policies
3. Set up authentication providers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team
