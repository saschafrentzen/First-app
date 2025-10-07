import { MD3Theme, MD3LightTheme } from 'react-native-paper';

type CustomMD3Colors = {
  warning: string;
};

type ExtendedMD3Theme = MD3Theme & {
  colors: MD3Theme['colors'] & CustomMD3Colors;
};

// Basis-Theme mit den Standard-MD3-Farben
const baseTheme = MD3LightTheme;

// Erweitere das Theme mit unseren eigenen Farben
export const customTheme: Partial<ExtendedMD3Theme> = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    warning: '#FFA000', // Warnung in Amber
  },
};