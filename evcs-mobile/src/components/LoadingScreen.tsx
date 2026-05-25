import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const LoadingScreen = ({ visible, message = 'Cargando...' }: { visible: boolean; message?: string }) => {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});