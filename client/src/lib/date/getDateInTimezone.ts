// getDateInTimezone — returns YYYY-MM-DD for a given Date in a specific IANA timezone
export function getDateInTimezone(date: Date, timezone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
    }).format(date);
  }
  
  // getPreviousDate — calendar-date arithmetic on a YYYY-MM-DD string, DST-safe
  export function getPreviousDate(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  