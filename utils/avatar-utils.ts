/**
 * Avatar Utility Functions
 *
 * Generates consistent avatar initials and colors for users without custom avatars.
 * Color is deterministic based on user's name/email (same user = same color always).
 */

/**
 * Get initials from user's name or email
 * Examples:
 * - "John Doe" → "JD"
 * - "أحمد محمد" → "أم"
 * - "john@example.com" → "JO"
 */
export function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      // Get first letter of first and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Single name - get first 2 letters
    return name.trim().substring(0, 2).toUpperCase();
  }

  // Fallback to email
  return email.substring(0, 2).toUpperCase();
}

/**
 * Generate a consistent color based on string input
 * Uses simple hash function to generate consistent colors
 * Same input always returns same color
 * Colors work well with both light and dark themes
 *
 * Uses CSS variable approach - color adapts to theme automatically
 */
export function stringToColor(str: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate HSL color (better than RGB for avatars)
  // Hue: 0-360 degrees (full color spectrum)
  // Saturation: 30-40% (calm, muted colors - easy on the eyes)
  // Lightness: Uses CSS variable for theme adaptation
  const hue = Math.abs(hash % 360);
  const saturation = 30 + (Math.abs(hash) % 10); // 30-40% (very calm)

  // Use CSS custom property for lightness that adapts to theme
  // In light mode: lighter colors with darker text
  // In dark mode: darker colors with lighter text
  return `hsl(${hue}, ${saturation}%, var(--avatar-lightness, 80%))`;
}

/**
 * Get avatar background color based on user's name or email
 * Consistent color for the same user
 */
export function getAvatarColor(name: string | null, email: string): string {
  const seed = name && name.trim() ? name.trim() : email;
  return stringToColor(seed);
}
