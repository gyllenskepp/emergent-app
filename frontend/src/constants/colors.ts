// BORKA Color Palette - Based on website branding
export const Colors = {
  // Primary colors
  primary: '#E63946',      // Warm red - main accent
  primaryDark: '#C1121F',  // Darker red for pressed states
  
  // Secondary colors
  secondary: '#457B9D',    // Blue accent
  secondaryLight: '#A8DADC', // Light blue
  
  // Category colors
  openGameNight: '#E63946',   // Red
  memberNight: '#457B9D',      // Blue
  tournament: '#2A9D8F',       // Teal
  specialEvent: '#F4A261',     // Orange
  
  // Neutrals
  background: '#F8F9FA',    // Light gray background
  surface: '#FFFFFF',       // White cards
  surfaceSecondary: '#F1F3F5', // Secondary surface
  
  // Text
  text: '#1D3557',          // Dark blue text
  textSecondary: '#6C757D', // Gray text
  textLight: '#FFFFFF',     // White text
  textMuted: '#ADB5BD',     // Muted text
  
  // Borders and dividers
  border: '#DEE2E6',
  divider: '#E9ECEF',
  
  // States
  success: '#2A9D8F',
  warning: '#F4A261',
  error: '#E63946',
  info: '#457B9D',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const CategoryColors: Record<string, string> = {
  'open_game_night': Colors.openGameNight,
  'member_night': Colors.memberNight,
  'tournament': Colors.tournament,
  'special_event': Colors.specialEvent,
};

export const CategoryNames: Record<string, string> = {
  'open_game_night': 'Öppen spelkväll',
  'member_night': 'Medlemskväll',
  'tournament': 'Turnering',
  'special_event': 'Specialevent',
};
