import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { GeoPoint } from '@react-native-firebase/firestore';
import * as Location from 'expo-location';
import { priceComparisonService } from '@app/services/PriceComparisonService';
import { PriceHistoryChart } from '@app/components/PriceHistoryChart';
import { formatCurrency } from '@app/utils/formatters';
import { AppStackParamList } from '@app/navigation/types';
import {
  PriceReport,
  Store,
  SortOption,
  FilterOptions,
  PriceAlert,
} from '@app/types';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

type PriceComparisonScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'PriceComparison'
>;

type PriceComparisonScreenRouteProp = RouteProp<
  AppStackParamList,
  'PriceComparison'
>;

interface PriceComparisonScreenProps {
  navigation: PriceComparisonScreenNavigationProp;
  route: PriceComparisonScreenRouteProp;
}

export const PriceComparisonScreen: React.FC<PriceComparisonScreenProps> = ({
  navigation,
  route,
}) => {
  const { productId, productName } = route.params;
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [stores, setStores] = useState<{ [key: string]: Store }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    maxPrice: '',
    minPrice: '',
    radius: '10',
    onlyVerified: false,
    includeSpecialOffers: true,
    minTrustScore: '50',
  });

  const [sortOption, setSortOption] = useState<SortOption>('price_asc');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadPriceReports();
    }
  }, [location, filters, sortOption]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(
        new GeoPoint(location.coords.latitude, location.coords.longitude)
      );
    }
  };

  const loadPriceReports = async () => {
    if (!location) return;

    setLoading(true);
    try {
      // Lade Preismeldungen mit Filtern
      const query = {
        productId,
        location,
        radius: parseFloat(filters.radius),
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        onlyVerified: filters.onlyVerified,
        includeSpecialOffers: filters.includeSpecialOffers,
        minTrustScore: parseFloat(filters.minTrustScore),
        sortBy: sortOption,
      };

      const result = await priceComparisonService.searchPriceReports(query);
      
      if (result.success && result.data) {
        setReports(result.data.reports);
        setStores(result.data.stores);
      }
    } catch (error) {
      console.error('Error loading price reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPriceReports();
  };

  const handleCreateAlert = async () => {
    if (!location) return;

    try {
      const result = await priceComparisonService.createPriceAlert(
        productId,
        parseFloat(filters.maxPrice || '0'),
        {
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          radius: parseFloat(filters.radius),
          location,
          notificationFrequency: 'immediately'
        }
      );

      if (result.success) {
        setAlertCreated(true);
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
    }
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortOption === 'price_asc' && styles.sortButtonActive,
        ]}
        onPress={() => handleSortChange('price_asc')}
      >
        <Text style={styles.sortButtonText}>€ Aufsteigend</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortOption === 'price_desc' && styles.sortButtonActive,
        ]}
        onPress={() => handleSortChange('price_desc')}
      >
        <Text style={styles.sortButtonText}>€ Absteigend</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortOption === 'distance' && styles.sortButtonActive,
        ]}
        onPress={() => handleSortChange('distance')}
      >
        <Text style={styles.sortButtonText}>Entfernung</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sortButton,
          sortOption === 'trust' && styles.sortButtonActive,
        ]}
        onPress={() => handleSortChange('trust')}
      >
        <Text style={styles.sortButtonText}>Vertrauen</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <View style={styles.filterInput}>
          <Text style={styles.filterLabel}>Min. Preis (€)</Text>
          <TextInput
            value={filters.minPrice}
            onChangeText={(value) =>
              setFilters({ ...filters, minPrice: value })
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="0,00"
          />
        </View>
        <View style={styles.filterInput}>
          <Text style={styles.filterLabel}>Max. Preis (€)</Text>
          <TextInput
            value={filters.maxPrice}
            onChangeText={(value) =>
              setFilters({ ...filters, maxPrice: value })
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="999,99"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterInput}>
          <Text style={styles.filterLabel}>Radius (km)</Text>
          <TextInput
            value={filters.radius}
            onChangeText={(value) =>
              setFilters({ ...filters, radius: value })
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="10"
          />
        </View>
        <View style={styles.filterInput}>
          <Text style={styles.filterLabel}>Min. Vertrauen (%)</Text>
          <TextInput
            value={filters.minTrustScore}
            onChangeText={(value) =>
              setFilters({ ...filters, minTrustScore: value })
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="50"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() =>
            setFilters({
              ...filters,
              onlyVerified: !filters.onlyVerified,
            })
          }
        >
          <MaterialIcons
            name={filters.onlyVerified ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color="#4f46e5"
          />
          <Text style={styles.filterToggleText}>Nur verifizierte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() =>
            setFilters({
              ...filters,
              includeSpecialOffers: !filters.includeSpecialOffers,
            })
          }
        >
          <MaterialIcons
            name={
              filters.includeSpecialOffers
                ? 'check-box'
                : 'check-box-outline-blank'
            }
            size={24}
            color="#4f46e5"
          />
          <Text style={styles.filterToggleText}>Sonderangebote</Text>
        </TouchableOpacity>
      </View>

      {!alertCreated && (
        <TouchableOpacity
          style={styles.createAlertButton}
          onPress={handleCreateAlert}
        >
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
          <Text style={styles.createAlertButtonText}>
            Preisalarm erstellen
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPriceCard = (report: PriceReport) => {
    const store = stores[report.storeId];
    if (!store || !location) return null;

    const distance = priceComparisonService.calculateDistance(
      location.latitude,
      location.longitude,
      store.location.latitude,
      store.location.longitude
    );

    return (
      <TouchableOpacity
        key={report.reportId}
        style={styles.priceCard}
        onPress={() =>
          navigation.navigate('ReportPrice', {
            productId,
            productName,
            storeId: store.id,
            storeName: store.name,
          })
        }
      >
        <View style={styles.priceCardHeader}>
          <View>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>
              {store.address.street}, {store.address.postalCode} {store.address.city}
            </Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.price}>
              {formatCurrency(report.price)}
            </Text>
            {report.isSpecialOffer && (
              <View style={styles.specialOfferBadge}>
                <Text style={styles.specialOfferText}>%</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceCardFooter}>
          <View style={styles.trustScore}>
            <MaterialIcons
              name="verified-user"
              size={16}
              color={report.trustScore >= 70 ? '#4f46e5' : '#9ca3af'}
            />
            <Text
              style={[
                styles.trustScoreText,
                report.trustScore >= 70 && styles.trustScoreHighText,
              ]}
            >
              {report.trustScore}%
            </Text>
          </View>

          <Text style={styles.distance}>{distance.toFixed(1)} km</Text>

          <Text style={styles.timestamp}>
            {new Date(report.reportedAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>
          Standortfreigabe erforderlich für Preisvergleiche
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{productName}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialIcons
            name={showFilters ? 'filter-list-off' : 'filter-list'}
            size={24}
            color="#4f46e5"
          />
        </TouchableOpacity>
      </View>

      {showFilters && renderFilters()}
      {renderSortOptions()}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {reports.length > 0 ? (
            reports.map(renderPriceCard)
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.message}>
                Keine Preismeldungen in deiner Nähe gefunden
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
    marginHorizontal: 6,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  createAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  createAlertButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  sortButtonActive: {
    backgroundColor: '#4f46e5',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#4b5563',
  },
  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  priceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  storeAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  specialOfferBadge: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  specialOfferText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  priceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trustScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustScoreText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  trustScoreHighText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
  },
});