-- Create tables for CSV upload functionality

-- Table to store uploaded CSV files
CREATE TABLE IF NOT EXISTS uploaded_csvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  lead_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store individual leads from CSV uploads
CREATE TABLE IF NOT EXISTS csv_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id UUID NOT NULL REFERENCES uploaded_csvs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_csv_leads_upload_id ON csv_leads(csv_upload_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_csvs_status ON uploaded_csvs(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_csvs_uploaded_at ON uploaded_csvs(uploaded_at);

-- Enable Row Level Security (RLS)
ALTER TABLE uploaded_csvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own uploaded CSVs (for now, allow all authenticated users)
CREATE POLICY "Users can view uploaded CSVs" ON uploaded_csvs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert uploaded CSVs" ON uploaded_csvs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update uploaded CSVs" ON uploaded_csvs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete uploaded CSVs" ON uploaded_csvs
  FOR DELETE USING (auth.role() = 'authenticated');

-- CSV leads policies
CREATE POLICY "Users can view CSV leads" ON csv_leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert CSV leads" ON csv_leads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update CSV leads" ON csv_leads
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete CSV leads" ON csv_leads
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_csvs table
CREATE TRIGGER update_uploaded_csvs_updated_at 
  BEFORE UPDATE ON uploaded_csvs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 