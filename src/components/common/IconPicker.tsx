import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

// Eine Auswahl häufig verwendeter Icons
const commonIcons = [
  'folder', 'food', 'cart', 'cash', 'credit-card',
  'home', 'car', 'bike', 'bus', 'train',
  'phone', 'laptop', 'television', 'lightbulb',
  'medical-bag', 'pill', 'school', 'book',
  'music', 'movie', 'gamepad', 'basketball',
  'dumbbell', 'run', 'bike', 'swim',
  'tshirt', 'shoe-formal', 'glasses',
  'baby-face', 'dog', 'cat',
  'flower', 'tree', 'weather-sunny',
  'tools', 'hammer', 'screwdriver',
];

const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.selectedIconContainer}
        onPress={() => setModalVisible(true)}
      >
        {selectedIcon ? (
          <MaterialCommunityIcons
            name={selectedIcon as any}
            size={32}
            color="#333"
          />
        ) : (
          <Text style={styles.placeholderText}>Icon auswählen</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Icon auswählen</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.iconGrid}>
              <View style={styles.gridContainer}>
                {commonIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.selectedIconOption,
                    ]}
                    onPress={() => {
                      onSelectIcon(icon);
                      setModalVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={32}
                      color={selectedIcon === icon ? '#2196f3' : '#666'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectedIconContainer: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  iconGrid: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  iconOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedIconOption: {
    backgroundColor: '#e3f2fd',
  },
});

export default IconPicker;