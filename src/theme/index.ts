export const Theme = {
  colors: {
    primary: '26, 115, 232',        // Google Blue
    secondary: '52, 168, 83',       // Green
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#202124',
    textSecondary: '#5F6368',
    error: '#D93025',
    warning: '#F29900',
    success: '#1E8E3E',
    shadow: '#000000',
    
    // Diagramm-Farben
    chart: {
      primary: '#1967D2',
      secondary: '#34A853',
      tertiary: '#EA4335',
      quaternary: '#FBBC04',
      
      // Pastell-Varianten für Pie-Charts
      pastel: {
        blue: '#D2E3FC',
        green: '#CEEAD6',
        red: '#FCE8E6',
        yellow: '#FEF7E0',
      }
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
    }
  },
  
  shape: {
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 16,
      xl: 24,
    }
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 5,
    }
  },
  
  animation: {
    duration: {
      short: 200,
      medium: 300,
      long: 400,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    }
  }
};