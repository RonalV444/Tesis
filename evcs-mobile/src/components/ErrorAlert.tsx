import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const ErrorAlert = ({ visible, message, onClose }: { visible: boolean; message: string; onClose: () => void }) => {
  if (!visible) return null;
  return (
    <View style={styles.alertContainer}>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Error</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  alertButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#667eea',
    borderRadius: 8,
    marginTop: 8,
  },
  alertButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});