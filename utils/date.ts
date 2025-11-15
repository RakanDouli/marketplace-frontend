/**
 * Format date to readable format
 * @param dateString ISO date string or Date object
 * @param locale 'ar' for Arabic, 'en' for English
 * @returns Formatted date
 */
export function formatDate(dateString: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (locale === 'ar') {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // English short format: "12 Jan '25"
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${day} ${month} '${year}`;
}

/**
 * Format datetime (includes time)
 * @param dateString ISO date string or Date object
 * @param locale 'ar' for Arabic, 'en' for English
 * @returns Formatted datetime
 */
export function formatDateTime(dateString: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (locale === 'ar') {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  const dateStr = formatDate(date, 'en');
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} - ${time}`;
}

/**
 * Format relative time (e.g., "منذ ساعتين", "2 hours ago")
 * @param dateString ISO date string or Date object
 * @param locale 'ar' for Arabic, 'en' for English
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ar') {
    if (diffSecs < 60) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} ${diffMins === 1 ? 'دقيقة' : 'دقائق'}`;
    if (diffHours < 24) return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    if (diffDays < 7) return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    return formatDate(date, 'ar');
  }

  // English
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return formatDate(date, 'en');
}
