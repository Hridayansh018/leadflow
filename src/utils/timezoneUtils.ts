// Timezone utility functions for scheduling

export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
}

export const timezones: TimezoneInfo[] = [
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
];

export const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    return new Date().toLocaleString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    return new Date().toLocaleString();
  }
};

export const convertLocalToUTC = (localDateTime: string, timezone: string): string => {
  try {
    // Create a date object from the local datetime string
    const localDate = new Date(localDateTime);
    
    // Convert to UTC
    const utcTime = localDate.toISOString();
    
    return utcTime;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return new Date().toISOString();
  }
};

export const formatDateTimeForDisplay = (dateTime: string, timezone: string): string => {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return dateTime;
  }
};

export const getTimezoneOffset = (timezone: string): string => {
  const tzInfo = timezones.find(tz => tz.value === timezone);
  return tzInfo ? tzInfo.offset : '+00:00';
}; 