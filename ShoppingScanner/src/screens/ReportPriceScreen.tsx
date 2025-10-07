import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { GeoPoint } from '@react-native-firebase/firestore';
import { priceComparisonService } from '../services/PriceComparisonService';
import { AppStackParamList } from '../navigation/types';
import { CurrencyInput } from '../components/CurrencyInput';
import { LocationPicker } from '../components/LocationPicker';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { formatCurrency } from '../utils/formatters';
import { PriceHistory } from '../types/priceComparison';

type ReportPriceScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'ReportPrice'
>;

type ReportPriceScreenRouteProp = RouteProp<AppStackParamList, 'ReportPrice'>;

interface ReportPriceScreenProps {
  navigation: ReportPriceScreenNavigationProp;
  route: ReportPriceScreenRouteProp;
}

export const ReportPriceScreen: React.FC<ReportPriceScreenProps> = ({
  navigation,
  route,
}) => {
  const { productId, productName, storeId, storeName } = route.params;

  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('Stück');
  const [isSpecialOffer, setIsSpecialOffer] = useState(false);
  const [validUntil, setValidUntil] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);

  useEffect(() => {
    // Lade die Preishistorie
    loadPriceHistory();
    // Frage nach Standortberechtigung und hole aktuellen Standort
    requestLocationPermission();
  }, []);

  const loadPriceHistory = async () => {
    const result = await priceComparisonService.getPriceHistory(productId, storeId);
    if (result.success && result.data) {
      setPriceHistory(result.data);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(
        new GeoPoint(location.coords.latitude, location.coords.longitude)
      );
    } else {
      Alert.alert(
        'Standortberechtigung erforderlich',
        'Bitte erlaube den Zugriff auf deinen Standort, um Preise melden zu können.'
      );
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploading(true);
        // TODO: Implementiere Upload-Logik zu Firebase Storage
        // const uploadedUrl = await uploadImage(result.assets[0].uri);
        // setImageUrl(uploadedUrl);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Beim Auswählen des Bildes ist ein Fehler aufgetreten.');
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Fehler', 'Standort wird benötigt');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Fehler', 'Bitte gib einen gültigen Preis ein');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await priceComparisonService.reportPrice(
        productId,
        storeId,
        parseFloat(price),
        location,
        {
          quantity: parseInt(quantity, 10),
          unit,
          isSpecialOffer,
          validUntil: isSpecialOffer ? validUntil : undefined,
          imageUrl: imageUrl || undefined,
        }
      );

      if (result.success) {
        Alert.alert(
          'Erfolg',
          'Vielen Dank für deine Preismeldung!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Fehler', result.error || 'Preismeldung konnte nicht gespeichert werden');
      }
    } catch (error) {
      console.error('Error submitting price:', error);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{productName}</Text>
        <Text style={styles.subtitle}>{storeName}</Text>
      </View>

      {priceHistory && (
        <View style={styles.chartContainer}>
          <PriceHistoryChart
            history={priceHistory}
            showSpecialOffers
            height={180}
          />
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preis</Text>
          <CurrencyInput
            value={price}
            onChangeValue={setPrice}
            placeholder="0,00"
            style={styles.priceInput}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Menge</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={styles.input}
              placeholder="1"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
            <Text style={styles.label}>Einheit</Text>
            <TextInput
              value={unit}
              onChangeText={setUnit}
              style={styles.input}
              placeholder="Stück"
            />
          </View>
        </View>

        <View style={styles.specialOfferContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setIsSpecialOffer(!isSpecialOffer)}
          >
            <View
              style={[
                styles.checkboxInner,
                isSpecialOffer && styles.checkboxChecked,
              ]}
            />
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Sonderangebot</Text>
        </View>

        {isSpecialOffer && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gültig bis</Text>
            <TextInput
              value={validUntil}
              onChangeText={setValidUntil}
              style={styles.input}
              placeholder="TT.MM.JJJJ"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleImagePick}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#4f46e5" />
          ) : (
            <>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.previewImage}
                />
              ) : (
                <Text style={styles.imageButtonText}>
                  Kassenbon fotografieren
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>

        {location && (
          <View style={styles.locationContainer}>
            <LocationPicker
              initialLocation={location}
              onLocationChange={setLocation}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || !location) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !location}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Preis melden</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  chartContainer: {
    marginVertical: 16,
  },
  form: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  specialOfferContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#4b5563',
  },
  imageButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  imageButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  locationContainer: {
    marginBottom: 16,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});