import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeValue: (value: string) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChangeValue,
  style,
  ...props
}) => {
  const handleChangeText = (text: string) => {
    // Entferne alle Nicht-Zahlen und Kommas
    const sanitized = text.replace(/[^0-9,]/g, '');
    
    // Erlaube nur eine Nachkommastelle
    const parts = sanitized.split(',');
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, 2);
    }
    
    // Setze den formatierten Wert
    onChangeValue(parts.join(','));
  };

  return (
    <TextInput
      value={value}
      onChangeText={handleChangeText}
      keyboardType="decimal-pad"
      placeholder="0,00"
      style={[styles.input, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
});