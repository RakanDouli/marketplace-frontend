/**
 * Avatar Utility Functions
 *
 * Handles avatar display logic:
 * - Shows uploaded avatar image if available
 * - Shows initials with soft random color if no image
 * - Colors have low opacity for day/night theme compatibility
 */

// Soft colors with low opacity for theme compatibility
const AVATAR_COLORS = [
  'rgba(59, 130, 246, 0.15)',   // Blue
  'rgba(16, 185, 129, 0.15)',   // Green
  'rgba(245, 158, 11, 0.15)',   // Amber
  'rgba(239, 68, 68, 0.15)',    // Red
  'rgba(139, 92, 246, 0.15)',   // Purple
  'rgba(236, 72, 153, 0.15)',   // Pink
  'rgba(20, 184, 166, 0.15)',   // Teal
  'rgba(251, 146, 60, 0.15)',   // Orange
];

/**
 * Get initials from a name
 * @param name - Full name or email
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();

  // First letter of first name + first letter of last name
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get consistent color for a user based on their ID
 * Uses a simple hash to pick the same color every time for the same user
 * @param userId - User's unique ID
 * @returns Soft color with low opacity
 */
export function getAvatarColor(userId: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to index
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Get text color based on background (always use theme-aware color)
 * Since we use low opacity backgrounds, we can use standard text colors
 */
export function getAvatarTextColor(): string {
  return 'currentColor'; // Uses the component's text color (theme-aware)
}
