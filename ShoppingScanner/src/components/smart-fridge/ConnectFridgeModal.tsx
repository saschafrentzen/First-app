import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Modal, Card, TextInput, Button } from 'react-native-paper';
import { SmartFridgeConfig } from '../../types/smartHome';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onConnect: (manufacturer: string, ipAddress: string) => void;
}

export const ConnectFridgeModal = ({ visible, onDismiss, onConnect }: Props) => {
  const [manufacturer, setManufacturer] = useState<SmartFridgeConfig['manufacturer']>('Samsung');
  const [ipAddress, setIpAddress] = useState('');

  const handleConnect = () => {
    if (!manufacturer || !ipAddress) return;
    onConnect(manufacturer, ipAddress);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card>
          <Card.Title title="Kühlschrank verbinden" />
          <Card.Content>
            <TextInput
              label="Hersteller"
              value={manufacturer}
              onChangeText={(text) => setManufacturer(text as SmartFridgeConfig['manufacturer'])}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="IP-Adresse"
              value={ipAddress}
              onChangeText={setIpAddress}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="192.168.1.100"
            />
          </Card.Content>
          <Card.Actions>
            <Button onPress={onDismiss}>Abbrechen</Button>
            <Button
              mode="contained"
              onPress={handleConnect}
              disabled={!manufacturer || !ipAddress}
            >
              Verbinden
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  input: {
    marginBottom: 16,
  },
});