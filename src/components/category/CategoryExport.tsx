import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text, Switch } from 'react-native-paper';
import { categoryService } from '../../services/categoryService';
import { writeAsStringAsync, getInfoAsync } from 'expo-file-system';

// Create a constant for the document directory path
const DOCUMENT_DIR = '/data/user/0/com.firstapp/files/';
import * as Sharing from 'expo-sharing';

interface CategoryExportProps {
  visible: boolean;
  onDismiss: () => void;
  selectedCategories?: string[];
}

export const CategoryExport: React.FC<CategoryExportProps> = ({
  visible,
  onDismiss,
  selectedCategories
}) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeRules, setIncludeRules] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [asTemplate, setAsTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      let exportData: string;
      
      if (asTemplate && selectedCategories?.length) {
        exportData = await categoryService.exportTemplate(selectedCategories);
      } else {
        exportData = await categoryService.exportCategories({
          format,
          includeRules: includeRules,
          includeMetadata: includeMetadata
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = format === 'json' ? 'json' : 'csv';
      const filename = `categories_export_${timestamp}.${extension}`;
      
      // Erstelle temporäre Datei im Cache-Verzeichnis
      // Create the full file path
      const filePath = `${DOCUMENT_DIR}${filename}`;

      // Write the file
      await writeAsStringAsync(filePath, exportData);

      // Check if file was created successfully
      const fileInfo = await getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('Datei konnte nicht erstellt werden');
      }

      // Prüfe ob Sharing verfügbar ist
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: format === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: 'Kategorien exportieren',
          UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text'
        });
      } else {
        throw new Error('Teilen ist auf diesem Gerät nicht verfügbar');
      }

      onDismiss();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export fehlgeschlagen');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Kategorien exportieren</Dialog.Title>
        <Dialog.Content>
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {!asTemplate && (
            <View style={styles.section}>
              <Text>Format:</Text>
              <RadioButton.Group onValueChange={value => setFormat(value as 'json' | 'csv')} value={format}>
                <View style={styles.radioOption}>
                  <RadioButton.Item label="JSON" value="json" />
                </View>
                <View style={styles.radioOption}>
                  <RadioButton.Item label="CSV" value="csv" />
                </View>
              </RadioButton.Group>
            </View>
          )}

          {selectedCategories?.length ? (
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text>Als Template exportieren</Text>
                <Switch 
                  value={asTemplate}
                  onValueChange={setAsTemplate}
                />
              </View>
            </View>
          ) : null}

          {!asTemplate && format === 'json' && (
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text>Regeln einschließen</Text>
                <Switch 
                  value={includeRules}
                  onValueChange={setIncludeRules}
                />
              </View>
              <View style={styles.switchContainer}>
                <Text>Metadaten einschließen</Text>
                <Switch 
                  value={includeMetadata}
                  onValueChange={setIncludeMetadata}
                />
              </View>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Abbrechen</Button>
          <Button mode="contained" onPress={handleExport}>
            Exportieren
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});