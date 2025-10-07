import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SmartFridgeConfig } from '../../types/smartHome';

interface Props {
  fridge: SmartFridgeConfig;
}

export const FridgeHeader = ({ fridge }: Props) => {
  const theme = useTheme();

  const getManufacturerIcon = () => {
    switch (fridge.manufacturer) {
      case 'Samsung':
        return 'samsung';
      case 'LG':
        return 'alpha-l-circle';
      default:
        return 'fridge';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon 
              name={getManufacturerIcon()} 
              size={24} 
              color={theme.colors.primary} 
              style={styles.icon}
            />
            <View>
              <Text variant="titleMedium">{fridge.name}</Text>
              <Text variant="bodySmall">{fridge.model}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Icon 
              name={fridge.isConnected ? 'wifi' : 'wifi-off'} 
              size={20}
              color={fridge.isConnected ? theme.colors.primary : theme.colors.error}
            />
            <Text 
              variant="bodySmall"
              style={{ 
                color: fridge.isConnected ? theme.colors.primary : theme.colors.error 
              }}
            >
              {fridge.isConnected ? 'Verbunden' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.lastSync}>
          <Icon name="sync" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={styles.syncText}>
            Letzte Aktualisierung: {new Date(fridge.lastSync).toLocaleString()}
          </Text>
          <IconButton
            icon="cog"
            size={20}
            onPress={() => {
              // TODO: Implement settings
            }}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastSync: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  syncText: {
    marginLeft: 4,
    flex: 1,
  },
});