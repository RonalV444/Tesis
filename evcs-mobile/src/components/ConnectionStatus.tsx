// Componente para mostrar estado de conexión
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { apiService } from '../services/api';

export const ConnectionStatus: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Revisar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      await apiService.getBackendStatus();
      setConnected(true);
    } catch (error) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={styles.loadingText}>Verificando conexión...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, connected ? styles.connected : styles.disconnected]}>
      <View style={styles.indicator} />
      <Text style={styles.text}>
        {connected ? '🟢 Conectado' : '🔴 Sin conexión'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  connected: {
    backgroundColor: '#d1fae5',
  },
  disconnected: {
    backgroundColor: '#fee2e2',
  },
  loading: {
    backgroundColor: '#f3f4f6',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#667eea',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
});
