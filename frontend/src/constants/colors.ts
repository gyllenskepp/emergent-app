// BORKA Color Palette - Based on website branding
export const Colors = {
  // Primary colors
  primary: '#3C888F',      // Teal - main brand color (CMYK 72/37/33.5/15.5)
  primaryDark: '#2A6068',  // Darker teal for pressed states

  // Secondary colors
  secondary: '#457B9D',    // Blue accent
  secondaryLight: '#A8DADC', // Light blue

  // Category colors
  openGameNight: '#3C888F',   // Teal (brand primary)
  memberNight: '#457B9D',      // Blue
  tournament: '#2A9D8F',       // Teal variant
  specialEvent: '#F4A261',     // Orange

  // Neutrals
  background: '#3C888F',    // Teal brand background (CMYK 72/37/33.5/15.5)
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
  error: '#C0392B',
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
