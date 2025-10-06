import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TagInputProps {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChangeTags,
}) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    if (input.trim()) {
      onChangeTags([...tags, input.trim()]);
      setInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChangeTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Neuen Tag eingeben"
          onSubmitEditing={addTag}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addTag}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#2196f3" />
        </TouchableOpacity>
      </View>

      <View style={styles.tagContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => removeTag(index)}
              style={styles.removeButton}
            >
              <MaterialCommunityIcons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
});

export default TagInput;