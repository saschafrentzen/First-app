interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  grey: string;
  border: string;
  shadow: string;
  white: string;
  successLight: string;
}

interface ThemeSpacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
}

interface ThemeBorderRadius {
  small: number;
  medium: number;
  large: number;
}

interface ThemeTypography {
  h1: {
    fontSize: number;
    fontWeight: 'bold';
  };
  h2: {
    fontSize: number;
    fontWeight: 'bold';
  };
  h3: {
    fontSize: number;
    fontWeight: '600';
  };
  body: {
    fontSize: number;
  };
  caption: {
    fontSize: number;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
}

export const theme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    card: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    grey: '#8E8E93',
    border: '#C6C6C8',
    shadow: '#000000',
    white: '#FFFFFF',
    successLight: '#E3FFF1',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 14,
    },
  },
};