/**
 * Helper function to format date for display
 */
export const formatDateString = (dateStr: string): string => {
  return dateStr; // Simply return the date string as is
};

/**
 * Format date for readable display
 */
export const formatDateForDisplay = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Get default date (current implementation uses a hardcoded date with data)
 */
export const getDefaultDate = (): string => {
  return "2025-07-01"; // Using July 1st, 2025 which has data according to the logs
};

/**
 * Get default start date (alias for getDefaultDate for consistency)
 */
export const getDefaultStartDate = (): string => {
  return getDefaultDate();
};

/**
 * Get default end date (alias for getDefaultDate for consistency)
 */
export const getDefaultEndDate = (): string => {
  return getDefaultDate();
};
