export interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  backgroundLight: string;
  text: string;
  textLight: string;
  textSecondary: string;
  textInverted: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  accent: string;
  surface: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}