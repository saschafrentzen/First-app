import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '../services/BiometricService';

export interface UseBiometricAuth {
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: (reason?: string) => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
}

export const useBiometricAuth = (): UseBiometricAuth => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const hasHardware = await biometricService.checkBiometricHardware();
      setIsAvailable(hasHardware);

      const settings = biometricService.getSettings();
      setIsEnabled(settings.enabled);
    } catch (err) {
      setError('Fehler beim Prüfen der biometrischen Authentifizierung');
      console.error('Error checking biometric status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    try {
      setError(null);
      return await biometricService.authenticate(reason);
    } catch (err) {
      setError('Authentifizierung fehlgeschlagen');
      return false;
    }
  }, []);

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await biometricService.enableBiometrics();
      if (success) {
        setIsEnabled(true);
      }
      return success;
    } catch (err) {
      setError('Aktivierung der biometrischen Authentifizierung fehlgeschlagen');
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await biometricService.disableBiometrics();
      setIsEnabled(false);
    } catch (err) {
      setError('Deaktivierung der biometrischen Authentifizierung fehlgeschlagen');
    }
  }, []);

  return {
    isAvailable,
    isEnabled,
    isLoading,
    error,
    authenticate,
    enableBiometrics,
    disableBiometrics
  };
};

// Beispiel für die Verwendung:
/*
const MyComponent: React.FC = () => {
  const { 
    isAvailable, 
    isEnabled, 
    authenticate, 
    enableBiometrics 
  } = useBiometricAuth();

  const handleSecureAction = async () => {
    const authenticated = await authenticate('Bitte authentifizieren Sie sich');
    if (authenticated) {
      // Führe geschützte Aktion aus
    }
  };

  return (
    <View>
      {isAvailable && !isEnabled && (
        <Button 
          onPress={enableBiometrics}
          title="Biometrische Authentifizierung aktivieren"
        />
      )}
      <Button
        onPress={handleSecureAction}
        title="Geschützte Aktion ausführen"
      />
    </View>
  );
};
*/