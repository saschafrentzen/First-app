import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GeoPoint } from '@react-native-firebase/firestore';

interface LocationPickerProps {
  initialLocation: GeoPoint;
  onLocationChange: (location: GeoPoint) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationChange,
}) => {
  const [location, setLocation] = useState(initialLocation);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={(region) => {
          const newLocation = new GeoPoint(
            region.latitude,
            region.longitude
          );
          setLocation(newLocation);
          onLocationChange(newLocation);
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});