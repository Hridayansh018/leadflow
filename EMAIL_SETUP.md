# Email Setup Guide

This guide will help you configure Gmail SMTP for sending emails from your Real Estate CRM.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification**

## Step 2: Generate App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **App passwords**
3. Select **"Mail"** and your device
4. Click **Generate**
5. Copy the generated 16-character password

## Step 3: Set Environment Variables

Create a `.env.local` file in your project root and add:

```env
# Gmail SMTP Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# VAPI Configuration
NEXT_PUBLIC_VAPI_API_KEY=your-vapi-api-key
NEXT_PUBLIC_VAPI_BASE_URL=https://api.vapi.ai

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/real-estate-crm
```

## Step 4: Restart Development Server

After setting the environment variables, restart your development server:

```bash
npm run dev
```

## Step 5: Test Configuration

1. Go to the Email page in your CRM
2. Click **Email Settings** in the sidebar
3. Click **Send Test Email** to verify your configuration

## Features

### Individual Email Sending
- Send emails to individual recipients
- Support for CC and BCC
- HTML and plain text content
- Custom sender name

### Bulk Email Sending
- Send emails to multiple recipients manually
- Send emails to leads from your database
- Success/failure tracking for each recipient
- Preview functionality

### Email Management
- View sent and received emails
- Search and filter emails
- Bulk actions (delete, archive, mark read/unread)
- Email composition with rich text support

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using an app password, not your regular Gmail password
- Verify the app password is exactly 16 characters long

### "Less secure app access" error
- You need to use an app password instead of enabling less secure apps
- App passwords are more secure and recommended by Google

### Environment variables not working
- Restart your development server after adding environment variables
- Make sure the `.env.local` file is in the project root
- Check that the variable names match exactly

### Test email not received
- Check your spam folder
- Verify the sender email address is correct
- Ensure your Gmail account allows app passwords

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your app password secure
- Use different app passwords for different environments
- Regularly rotate your app passwords

## API Endpoints

The email functionality uses these API endpoints:

- `POST /api/email/send` - Send individual email
- `POST /api/email/bulk` - Send bulk emails
- `POST /api/email/leads` - Send emails to leads
- `POST /api/email/test` - Test email configuration
- `GET /api/email/test` - Get configuration status

## Email Templates

You can create HTML email templates for common use cases:

### Property Listing Email
```html
<h2>New Property Available</h2>
<p>Hello {{name}},</p>
<p>We have a new property that matches your criteria:</p>
<ul>
  <li>Address: {{address}}</li>
  <li>Price: {{price}}</li>
  <li>Bedrooms: {{bedrooms}}</li>
</ul>
<p>Contact us to schedule a viewing!</p>
```

### Follow-up Email
```html
<h2>Thank you for your interest</h2>
<p>Hello {{name}},</p>
<p>Thank you for inquiring about our properties.</p>
<p>We'll be in touch soon with more details.</p>
<p>Best regards,<br>Your Real Estate Team</p>
```

## Rate Limits

Gmail has the following limits:
- 500 emails per day for regular accounts
- 2000 emails per day for Google Workspace accounts
- 100 emails per hour

Consider these limits when sending bulk emails to large lists. 