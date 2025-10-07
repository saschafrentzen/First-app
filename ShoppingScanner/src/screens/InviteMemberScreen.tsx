import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const InviteMemberScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mitglied einladen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
  },
});