/**
 * Time Zone Converter Utilities
 * 
 * Supports conversion between:
 * - UTC (Coordinated Universal Time)
 * - Saudi Arabia (Asia/Riyadh, GMT+3)
 * - Sri Lanka (Asia/Colombo, GMT+5:30)
 */

export type TimeZoneId = 'UTC' | 'Asia/Riyadh' | 'Asia/Colombo';

export interface TimeZoneInfo {
    id: TimeZoneId;
    name: string;
    abbreviation: string;
    offset: string;
}

export const TIME_ZONES: TimeZoneInfo[] = [
    { id: 'UTC', name: 'UTC', abbreviation: 'UTC', offset: '+00:00' },
    { id: 'Asia/Riyadh', name: 'Saudi Arabia', abbreviation: 'AST', offset: '+03:00' },
    { id: 'Asia/Colombo', name: 'Sri Lanka', abbreviation: 'IST', offset: '+05:30' },
];

/**
 * Parse various time string formats into a Date object
 * Supports: ISO 8601, common date/time formats
 */
export function parseInputTime(input: string, sourceTimezone: TimeZoneId): Date | null {
    if (!input || !input.trim()) {
        return null;
    }

    const trimmed = input.trim();
    
    // Try parsing as-is (for ISO 8601 with timezone, e.g. "Z" or offset)
    // Only use direct Date parsing if the string seems to contain timezone info
    // or if it doesn't match our specific formats that require manual timezone adjustment.
    const hasTimezoneInfo = /Z|[+-]\d{2}:?\d{2}/.test(trimmed);
    
    if (hasTimezoneInfo) {
        let date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Common patterns to try
    // Format: YYYY-MM-DD HH:mm:ss.SSS or YYYY-MM-DD HH:mm:ss or YYYY-MM-DD HH:mm
    const patterns = [
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/,
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/,
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
        // DD/MM/YYYY format
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/,
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
            let year: number, month: number, day: number;
            let hours = 0, minutes = 0, seconds = 0, ms = 0;
            
            // Check if it's DD/MM/YYYY format
            if (pattern.source.includes('\\/')) {
                day = parseInt(match[1], 10);
                month = parseInt(match[2], 10) - 1;
                year = parseInt(match[3], 10);
                hours = match[4] ? parseInt(match[4], 10) : 0;
                minutes = match[5] ? parseInt(match[5], 10) : 0;
                seconds = match[6] ? parseInt(match[6], 10) : 0;
                ms = match[7] ? parseInt(match[7].padEnd(3, '0'), 10) : 0;
            } else {
                year = parseInt(match[1], 10);
                month = parseInt(match[2], 10) - 1;
                day = parseInt(match[3], 10);
                hours = match[4] ? parseInt(match[4], 10) : 0;
                minutes = match[5] ? parseInt(match[5], 10) : 0;
                seconds = match[6] ? parseInt(match[6], 10) : 0;
                ms = match[7] ? parseInt(match[7].padEnd(3, '0'), 10) : 0;
            }

            // Create date in the source timezone
            // We need to calculate the UTC time from the source timezone
            const tempDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms));
            
            // Adjust for source timezone offset
            const offsetMs = getTimezoneOffsetMs(sourceTimezone);
            const utcDate = new Date(tempDate.getTime() - offsetMs);
            
            return utcDate;
        }
    }

    return null;
}

/**
 * Get timezone offset in milliseconds
 */
export function getTimezoneOffsetMs(timezone: TimeZoneId): number {
    switch (timezone) {
        case 'UTC':
            return 0;
        case 'Asia/Riyadh':
            return 3 * 60 * 60 * 1000; // +3 hours
        case 'Asia/Colombo':
            return 5.5 * 60 * 60 * 1000; // +5:30 hours
        default:
            return 0;
    }
}

/**
 * Convert a Date to a specific timezone and format it
 */
export function convertToTimezone(date: Date, timezone: TimeZoneId): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
    };

    const formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
    // Get milliseconds
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    
    // Format: DD/MM/YYYY, HH:mm:ss -> YYYY-MM-DD HH:mm:ss.SSS
    const parts = formatted.split(', ');
    const datePart = parts[0].split('/').reverse().join('-');
    const timePart = parts[1];
    
    return `${datePart} ${timePart}.${ms}`;
}

/**
 * Format a Date for datetime-local input
 */
export function formatForDateTimeInput(date: Date, timezone: TimeZoneId): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
    };

    const formatted = new Intl.DateTimeFormat('en-CA', options).format(date);
    // Format: YYYY-MM-DD, HH:mm:ss -> YYYY-MM-DDTHH:mm:ss
    return formatted.replace(', ', 'T');
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: TimeZoneId): string {
    return convertToTimezone(new Date(), timezone);
}

/**
 * Parse datetime-local input value with timezone consideration
 */
export function parseDateTimeLocalInput(value: string, timezone: TimeZoneId): Date | null {
    if (!value) return null;
    
    // datetime-local format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = match[6] ? parseInt(match[6], 10) : 0;
    
    // Create UTC date then adjust for timezone
    const tempDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    const offsetMs = getTimezoneOffsetMs(timezone);
    
    return new Date(tempDate.getTime() - offsetMs);
}
