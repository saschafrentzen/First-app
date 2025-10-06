import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme } from '../theme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  secureTextEntry?: boolean;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  multiline = false,
  secureTextEntry = false,
  disabled = false,
}) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline ? styles.multilineInput : undefined,
          error ? styles.inputError : undefined,
          disabled ? styles.inputDisabled : undefined,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        placeholderTextColor={Theme.colors.textSecondary}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface FormSelectProps {
  label: string;
  value: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  onSelect: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  options,
  onSelect,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.select,
          error ? styles.selectError : null,
          disabled && styles.selectDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectText,
          disabled && styles.selectTextDisabled
        ]}>
          {options.find(opt => opt.value === value)?.label || 'Bitte wählen'}
        </Text>
      </TouchableOpacity>
      {isOpen && !disabled && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                option.value === value && styles.optionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.optionText,
                option.value === value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface FormNumberInputProps extends Omit<FormFieldProps, 'keyboardType'> {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const FormNumberInput: React.FC<FormNumberInputProps> = ({
  label,
  value,
  onChangeText,
  min,
  max,
  step = 1,
  unit,
  error,
  disabled = false,
  ...props
}) => {
  const validateNumber = (text: string) => {
    const num = parseFloat(text);
    if (isNaN(num)) return '';
    if (min !== undefined && num < min) return min.toString();
    if (max !== undefined && num > max) return max.toString();
    return text;
  };

  const increment = () => {
    if (disabled) return;
    const current = parseFloat(value) || 0;
    const newValue = current + step;
    if (max === undefined || newValue <= max) {
      onChangeText(newValue.toString());
    }
  };

  const decrement = () => {
    if (disabled) return;
    const current = parseFloat(value) || 0;
    const newValue = current - step;
    if (min === undefined || newValue >= min) {
      onChangeText(newValue.toString());
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity
          style={[styles.numberButton, disabled && styles.numberButtonDisabled]}
          onPress={decrement}
          disabled={disabled}
        >
          <Text style={styles.numberButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.numberInputWrapper}>
          <TextInput
            style={[
              styles.numberInput,
              error ? styles.inputError : null,
              disabled && styles.inputDisabled,
            ]}
            value={value}
            onChangeText={(text) => onChangeText(validateNumber(text))}
            keyboardType="numeric"
            editable={!disabled}
            {...props}
          />
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>
        <TouchableOpacity
          style={[styles.numberButton, disabled && styles.numberButtonDisabled]}
          onPress={increment}
          disabled={disabled}
        >
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface FormProps {
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  submitLabel = 'Speichern',
  disabled = false,
  loading = false,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (disabled || loading) && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={disabled || loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Lädt...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: Theme.spacing.md,
  },
  fieldContainer: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.body2,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
    color: Theme.colors.text,
    ...Theme.typography.body1,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Theme.colors.error,
  },
  inputDisabled: {
    backgroundColor: Theme.colors.surface,
    opacity: 0.7,
  },
  errorText: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
  select: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
  },
  selectError: {
    borderColor: Theme.colors.error,
  },
  selectDisabled: {
    backgroundColor: Theme.colors.surface,
    opacity: 0.7,
  },
  selectText: {
    color: Theme.colors.text,
    ...Theme.typography.body1,
  },
  selectTextDisabled: {
    color: Theme.colors.textSecondary,
  },
  optionsContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.sm,
    marginTop: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
    maxHeight: 200,
  },
  option: {
    padding: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.textSecondary,
  },
  optionSelected: {
    backgroundColor: `rgba(${Theme.colors.primary}, 0.1)`,
  },
  optionText: {
    color: Theme.colors.text,
    ...Theme.typography.body1,
  },
  optionTextSelected: {
    color: `rgb(${Theme.colors.primary})`,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
  },
  numberButtonDisabled: {
    opacity: 0.7,
  },
  numberButtonText: {
    ...Theme.typography.h2,
    color: Theme.colors.text,
  },
  numberInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Theme.spacing.sm,
  },
  numberInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
    color: Theme.colors.text,
    ...Theme.typography.body1,
    textAlign: 'center',
  },
  unitText: {
    ...Theme.typography.body1,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.sm,
  },
  submitButton: {
    backgroundColor: `rgb(${Theme.colors.primary})`,
    borderRadius: Theme.shape.borderRadius.sm,
    padding: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Theme.typography.body1,
    fontWeight: '600',
  },
});