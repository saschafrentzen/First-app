import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface, Portal, Modal } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BarcodeScannerComponent from '../components/BarcodeScanner';
import { lookupProduct } from '../services/products';
import { ShoppingItem } from '../services/database';
import { RootStackParamList } from '../navigation/types';

type ScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const ScannerScreen = ({ navigation, route }: ScannerScreenProps) => {
  const { onAddItem } = route.params;
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{ name: string; price: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBarCodeScanned = async (barcode: string) => {
    try {
      const product = await lookupProduct(barcode);
      setScannedProduct(product);
      setError(null);
    } catch (err) {
      setError('Product not found. Please try again.');
      setScannedProduct(null);
    }
  };

  const handleAddItem = () => {
    if (scannedProduct) {
      const newItem: ShoppingItem = {
        name: scannedProduct.name,
        price: scannedProduct.price,
        quantity: 1,
        createdAt: new Date(),
      };
      onAddItem(newItem);
      setScannedProduct(null);
    }
  };

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={scanning}
          onDismiss={() => setScanning(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <BarcodeScannerComponent
            onScanned={handleBarCodeScanned}
            onClose={() => setScanning(false)}
          />
        </Modal>
      </Portal>

      <Surface style={styles.content}>
        {scannedProduct ? (
          <View>
            <Text style={styles.productName}>{scannedProduct.name}</Text>
            <Text style={styles.productPrice}>€{scannedProduct.price.toFixed(2)}</Text>
            <Button
              mode="contained"
              onPress={handleAddItem}
              style={styles.button}
            >
              Add to List
            </Button>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text>Scan a product to add it to your list</Text>
        )}

        <Button
          mode="contained"
          onPress={() => setScanning(true)}
          style={styles.button}
        >
          Scan Barcode
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
    alignItems: 'center',
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