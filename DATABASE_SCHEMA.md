# LeadFlow CRM Database Schema

This document outlines all the data stored in the Supabase database for the LeadFlow CRM system.

## Database Tables

### 1. Users Table
**Purpose**: Store user authentication and profile information
```sql
users (
  id: uuid (primary key)
  email: text (unique)
  name: text
  role: text (default: 'user')
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- User authentication credentials (handled by Supabase Auth)
- User profile information (name, email, role)
- Account creation and modification timestamps

### 2. Leads Table
**Purpose**: Store lead information and contact details
```sql
leads (
  id: uuid (primary key)
  name: text
  email: text
  phone: text
  status: text (new, contacted, qualified, converted, lost)
  source: text
  notes: text
  assigned_to: uuid (foreign key to users.id)
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- Lead contact information (name, email, phone)
- Lead status tracking (new → contacted → qualified → converted/lost)
- Lead source information
- Notes and comments about the lead
- Assignment to specific users
- Creation and modification timestamps

### 3. Campaigns Table
**Purpose**: Store campaign information and configuration
```sql
campaigns (
  id: uuid (primary key)
  name: text
  description: text
  status: text (draft, active, paused, completed, failed)
  assistant_id: text (VAPI assistant ID)
  phone_number_id: text (VAPI phone number ID)
  prompt: text
  created_by: uuid (foreign key to users.id)
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- Campaign name and description
- Campaign status (draft, active, paused, completed, failed)
- VAPI integration details (assistant ID, phone number ID)
- Campaign prompt/script
- Creator information
- Creation and modification timestamps

### 4. Campaign_Leads Table
**Purpose**: Link campaigns to leads (many-to-many relationship)
```sql
campaign_leads (
  id: uuid (primary key)
  campaign_id: uuid (foreign key to campaigns.id)
  lead_id: uuid (foreign key to leads.id)
  status: text (pending, in-progress, completed, failed)
  created_at: timestamp
)
```

**Data Stored**:
- Campaign-lead associations
- Individual lead status within campaigns
- Creation timestamps

### 5. Call_History Table
**Purpose**: Store call records and outcomes
```sql
call_history (
  id: uuid (primary key)
  campaign_id: uuid (foreign key to campaigns.id)
  lead_id: uuid (foreign key to leads.id)
  call_id: text (VAPI call ID)
  status: text (initiated, in-progress, completed, failed)
  duration: integer (seconds)
  recording_url: text
  transcript: text
  outcome: text (success, no-answer, voicemail, busy, failed)
  notes: text
  created_at: timestamp
)
```

**Data Stored**:
- Call metadata (campaign, lead, VAPI call ID)
- Call status and duration
- Recording URL and transcript
- Call outcome and notes
- Creation timestamps

### 6. Emails Table
**Purpose**: Store sent email records
```sql
emails (
  id: uuid (primary key)
  lead_id: uuid (foreign key to leads.id)
  subject: text
  content: text
  status: text (sent, delivered, opened, clicked, bounced, failed)
  sent_at: timestamp
  delivered_at: timestamp
  opened_at: timestamp
  clicked_at: timestamp
  created_at: timestamp
)
```

**Data Stored**:
- Email content (subject, body)
- Email status tracking (sent → delivered → opened → clicked)
- Timestamps for each status change
- Associated lead information

### 7. Email_Templates Table
**Purpose**: Store reusable email templates
```sql
email_templates (
  id: uuid (primary key)
  name: text
  subject: text
  content: text
  category: text (lead-followup, property-showing, market-update, general, custom)
  variables: text[] (array of variable names)
  is_default: boolean
  created_by: uuid (foreign key to users.id)
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- Template name and content
- Template category for organization
- Variable placeholders for personalization
- Default template flags
- Creator information
- Creation and modification timestamps

### 8. Property_Files Table
**Purpose**: Store property-related files and documents
```sql
property_files (
  id: uuid (primary key)
  name: text
  file_url: text
  file_type: text
  file_size: integer
  lead_id: uuid (foreign key to leads.id)
  uploaded_by: uuid (foreign key to users.id)
  created_at: timestamp
)
```

**Data Stored**:
- File metadata (name, type, size)
- File storage URL
- Associated lead information
- Uploader information
- Creation timestamps

### 9. Campaign_Schedules Table
**Purpose**: Store recurring campaign schedules
```sql
campaign_schedules (
  id: uuid (primary key)
  campaign_id: uuid (foreign key to campaigns.id)
  name: text
  frequency: text (daily, weekly, monthly)
  time: text (HH:MM format)
  days_of_week: integer[] (0-6 for weekly)
  day_of_month: integer (1-31 for monthly)
  timezone: text
  is_active: boolean
  last_run: timestamp
  next_run: timestamp
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- Schedule configuration (frequency, time, days)
- Timezone information
- Active/inactive status
- Last and next run timestamps
- Creation and modification timestamps

### 10. Call_Queue Table
**Purpose**: Store pending calls in queue
```sql
call_queue (
  id: uuid (primary key)
  campaign_id: uuid (foreign key to campaigns.id)
  lead_id: uuid (foreign key to leads.id)
  customer_name: text
  phone_number: text
  scheduled_time: timestamp
  status: text (pending, in-progress, completed, failed, cancelled)
  priority: text (low, medium, high)
  retry_count: integer
  max_retries: integer
  notes: text
  created_at: timestamp
)
```

**Data Stored**:
- Queue item metadata (campaign, lead, customer info)
- Scheduling information (time, priority)
- Status tracking and retry logic
- Notes and comments
- Creation timestamps

### 11. Uploaded_CSVs Table
**Purpose**: Store uploaded CSV file information
```sql
uploaded_csvs (
  id: uuid (primary key)
  filename: text
  lead_count: integer
  status: text (processing, completed, failed)
  error: text
  uploaded_at: timestamp
  created_at: timestamp
  updated_at: timestamp
)
```

**Data Stored**:
- CSV file metadata (filename, upload time)
- Processing status and error information
- Lead count from the uploaded file
- Creation and modification timestamps

### 12. CSV_Leads Table
**Purpose**: Store individual leads from uploaded CSV files
```sql
csv_leads (
  id: uuid (primary key)
  csv_upload_id: uuid (foreign key to uploaded_csvs.id)
  name: text
  email: text
  phone: text
  location: text
  notes: text
  created_at: timestamp
)
```

**Data Stored**:
- Lead information parsed from CSV files
- Contact details (name, email, phone)
- Additional information (location, notes)
- Reference to the original CSV upload
- Creation timestamps

## Data Relationships

### One-to-Many Relationships:
- User → Leads (assigned_to)
- User → Campaigns (created_by)
- User → Email_Templates (created_by)
- User → Property_Files (uploaded_by)
- Campaign → Call_History
- Campaign → Campaign_Schedules
- Campaign → Call_Queue
- Lead → Call_History
- Lead → Emails
- Lead → Property_Files
- Uploaded_CSV → CSV_Leads (csv_upload_id)

### Many-to-Many Relationships:
- Campaigns ↔ Leads (via campaign_leads table)

## Data Flow

### Lead Management:
1. **Lead Creation**: New leads stored in `leads` table
2. **Lead Assignment**: Leads assigned to users via `assigned_to` field
3. **Lead Status Updates**: Status changes tracked via `status` field
4. **Lead Notes**: Additional information stored in `notes` field

### Campaign Management:
1. **Campaign Creation**: Campaigns stored in `campaigns` table
2. **Lead Association**: Campaigns linked to leads via `campaign_leads` table
3. **Campaign Execution**: Calls made via VAPI integration
4. **Call Tracking**: Call results stored in `call_history` table

### Email Management:
1. **Template Creation**: Email templates stored in `email_templates` table
2. **Email Sending**: Emails sent and tracked in `emails` table
3. **Email Tracking**: Status updates (sent → delivered → opened → clicked)

### File Management:
1. **File Upload**: Property files uploaded and stored
2. **File Association**: Files linked to leads via `lead_id`
3. **File Access**: Files accessible via `file_url`

## Data Security

### Row Level Security (RLS):
- Users can only access their own data
- Admins can access all data
- Campaign data shared among team members

### Data Privacy:
- Personal information encrypted at rest
- API keys stored securely in environment variables
- Audit trails maintained for all data changes

## Data Retention

### Active Data:
- All current leads, campaigns, and communications
- Recent call history and email records
- Active templates and schedules

### Archived Data:
- Completed campaigns older than 1 year
- Call history older than 2 years
- Email records older than 2 years

### Backup Strategy:
- Daily automated backups
- Point-in-time recovery available
- Data export capabilities for compliance

## Integration Points

### VAPI Integration:
- Campaign execution via VAPI API
- Call recording and transcript storage
- Real-time call status updates

### Email Integration:
- Email sending via SMTP/Gmail API
- Email tracking and analytics
- Template personalization

### File Storage:
- File upload to Supabase Storage
- Secure file access and sharing
- File type validation and virus scanning 