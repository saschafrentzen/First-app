import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button, Text, Surface, Portal, Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { lookupProduct } from '../services/products';
import { ShoppingItem } from '../types/storage';
import { StorageError } from '../types/errors';

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ShoppingItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Kamera-Berechtigung',
          'Die App benötigt Zugriff auf die Kamera, um Barcodes zu scannen.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Fehler beim Anfordern der Kamera-Berechtigung:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanning) return;
    
    setScanning(true);
    try {
      const product = await lookupProduct(data);
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: `${product.brand} ${product.name}`,
        price: product.price,
        quantity: 1,
        category: product.category,
        barcode: product.barcode,
        addedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      setScannedProduct(newItem);
      setError(null);
    } catch (err) {
      if (err instanceof StorageError) {
        setError(err.message);
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
      setScannedProduct(null);
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      {hasPermission === null ? (
        <View style={styles.messageContainer}>
          <Text>Warte auf Kamera-Berechtigung...</Text>
        </View>
      ) : hasPermission === false ? (
        <View style={styles.messageContainer}>
          <Text>Kein Zugriff auf die Kamera</Text>
          <Button 
            mode="contained" 
            onPress={requestCameraPermission}
            style={styles.button}
          >
            Berechtigung erneut anfragen
          </Button>
        </View>
      ) : (
        <>
          <BarCodeScanner
            style={styles.camera}
            type={BarCodeScanner.Constants.Type.back}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.ean8,
              BarCodeScanner.Constants.BarCodeType.upc_a,
              BarCodeScanner.Constants.BarCodeType.upc_e,
            ]}
            onBarCodeScanned={scanning ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
              <Text style={styles.hint}>
                Positionieren Sie den Barcode im markierten Bereich
              </Text>
            </View>
          </BarCodeScanner>

          <Portal>
            <Modal
              visible={!!scannedProduct}
              onDismiss={() => {
                setScannedProduct(null);
                setScanning(false);
              }}
              contentContainerStyle={styles.modalContent}
            >
              <Surface style={styles.productInfo}>
                {scannedProduct && (
                  <>
                    <Text style={styles.productName}>{scannedProduct.name}</Text>
                    <Text style={styles.productPrice}>
                      €{scannedProduct.price.toFixed(2)}
                    </Text>
                    <View style={styles.buttonContainer}>
                      <Button
                        mode="contained"
                        onPress={() => {
                          navigation.navigate('Lists', { addProduct: scannedProduct });
                          setScannedProduct(null);
                          setScanning(false);
                        }}
                        style={styles.button}
                      >
                        Zur Liste hinzufügen
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setScannedProduct(null);
                          setScanning(false);
                        }}
                        style={styles.button}
                      >
                        Abbrechen
                      </Button>
                    </View>
                  </>
                )}
              </Surface>
            </Modal>
          </Portal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  hint: {
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    margin: 20,
  },
  productInfo: {
    padding: 20,
    borderRadius: 8,
  },
  buttonContainer: {
    gap: 10,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
});

export default ScannerScreen;