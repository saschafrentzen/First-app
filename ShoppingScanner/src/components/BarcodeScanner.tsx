import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, Text } from 'react-native-paper';

interface BarcodeScannerProps {
  onScanned: (data: string) => void;
  onClose: () => void;
}

const BarcodeScannerComponent = ({ onScanned, onClose }: BarcodeScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onScanned(data);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
          >
            Cancel
          </Button>
          {scanned && (
            <Button
              mode="contained"
              onPress={() => setScanned(false)}
              style={styles.rescanButton}
            >
              Scan Again
            </Button>
          )}
        </View>
      </BarCodeScanner>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
});

export default BarcodeScannerComponent;