import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text, Switch, ActivityIndicator } from 'react-native-paper';
import { categoryService } from '../../services/categoryService';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface CategoryImportProps {
  visible: boolean;
  onDismiss: () => void;
  onImportComplete?: (result: { imported: number; skipped: number; errors: Array<{ id: string; error: string }> }) => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
}

export const CategoryImport: React.FC<CategoryImportProps> = ({
  visible,
  onDismiss,
  onImportComplete
}) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'overwrite' | 'rename'>('skip');
  const [validateHierarchy, setValidateHierarchy] = useState(true);
  const [importRules, setImportRules] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setImportResult(null);

      const docPickerResult = await DocumentPicker.getDocumentAsync({
        type: format === 'json' ? 'application/json' : 'text/csv',
        copyToCacheDirectory: true
      });

      if (docPickerResult.assets && docPickerResult.assets.length > 0) {
        const doc = docPickerResult.assets[0];
        const content = await FileSystem.readAsStringAsync(doc.uri);

        if (isTemplate) {
          const templateResult = await categoryService.importTemplate(content);
          const result = {
            imported: templateResult.created,
            skipped: 0,
            errors: templateResult.errors.map(err => ({ id: 'template', error: err }))
          };
          setImportResult(result);
          onImportComplete?.(result);
        } else {
          const result = await categoryService.importCategories(content, format, {
            conflictResolution,
            validateHierarchy,
            importRules: importRules && format === 'json'
          });
          setImportResult(result);
          onImportComplete?.(result);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Kategorien importieren</Dialog.Title>
        <Dialog.Content>
          {error && (
            <Text style={styles.error}>{error}</Text>
          )}

          {importResult && (
            <View style={styles.result}>
              <Text>Importiert: {importResult.imported}</Text>
              {!isTemplate && <Text>Übersprungen: {importResult.skipped}</Text>}
              {importResult.errors.length > 0 && (
                <View style={styles.errors}>
                  <Text style={styles.errorTitle}>Fehler:</Text>
                  {importResult.errors.map((err, index) => (
                    <Text key={index} style={styles.errorItem}>
                      {err.id}: {err.error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {!importResult && !isLoading && (
            <>
              <View style={styles.section}>
                <View style={styles.switchContainer}>
                  <Text>Template importieren</Text>
                  <Switch 
                    value={isTemplate}
                    onValueChange={setIsTemplate}
                  />
                </View>
              </View>

              {!isTemplate && (
                <>
                  <View style={styles.section}>
                    <Text>Format:</Text>
                    <RadioButton.Group 
                      onValueChange={(value: string) => setFormat(value as 'json' | 'csv')} 
                      value={format}
                    >
                      <View style={styles.radioOption}>
                        <RadioButton.Item label="JSON" value="json" />
                      </View>
                      <View style={styles.radioOption}>
                        <RadioButton.Item label="CSV" value="csv" />
                      </View>
                    </RadioButton.Group>
                  </View>

                  <View style={styles.section}>
                    <Text>Bei Konflikten:</Text>
                    <RadioButton.Group 
                      onValueChange={(value: string) => setConflictResolution(value as 'skip' | 'overwrite' | 'rename')} 
                      value={conflictResolution}
                    >
                      <View style={styles.radioOption}>
                        <RadioButton.Item label="Überspringen" value="skip" />
                      </View>
                      <View style={styles.radioOption}>
                        <RadioButton.Item label="Überschreiben" value="overwrite" />
                      </View>
                      <View style={styles.radioOption}>
                        <RadioButton.Item label="Umbenennen" value="rename" />
                      </View>
                    </RadioButton.Group>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.switchContainer}>
                      <Text>Hierarchie validieren</Text>
                      <Switch 
                        value={validateHierarchy}
                        onValueChange={setValidateHierarchy}
                      />
                    </View>
                    {format === 'json' && (
                      <View style={styles.switchContainer}>
                        <Text>Regeln importieren</Text>
                        <Switch 
                          value={importRules}
                          onValueChange={setImportRules}
                        />
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Importiere...</Text>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>
            {importResult ? 'Schließen' : 'Abbrechen'}
          </Button>
          {!importResult && !isLoading && (
            <Button mode="contained" onPress={handleImport}>
              Importieren
            </Button>
          )}
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
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  result: {
    marginVertical: 10,
  },
  errors: {
    marginTop: 10,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorItem: {
    color: 'red',
    fontSize: 12,
    marginLeft: 10,
  },
});