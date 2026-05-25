// Pantalla Home
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/notifications';
import { EmptyState } from '../components/index';

const HomeScreen = () => {
  const { user } = useAuthStore();
  const { receivedNotifications, fetchNotifications, isLoading, unreadCount, addReceivedNotification } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  // Inicializar listeners de notificaciones al montar
  useEffect(() => {
    if (user?.id) {
      console.log('[HomeScreen] Inicializando listeners de notificaciones...');
      
      // Configurar listeners para recibir notificaciones en tiempo real
      notificationService.setupNotificationListeners((notification) => {
        console.log('[HomeScreen] 🔔 Notificación recibida:', notification.request.content.title);
        
        // Agregar a la lista de notificaciones recibidas
        addReceivedNotification(notification);
      });

      // Limpiar listeners al desmontar
      return () => {
        console.log('[HomeScreen] Limpiando listeners de notificaciones...');
        notificationService.clearNotificationListeners();
      };
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[HomeScreen] Pantalla enfocada, refrescando...');
      handleRefresh();
    }, [])
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications(user?.id);
    } catch (error) {
      console.error('[HomeScreen] Error refrescando:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <Text style={styles.notificationTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Hola, {user?.name || 'Usuario'}</Text>
          <Text style={styles.subtitle}>Esperando notificaciones...</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount || 0}</Text>
        </View>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>✅ Conectado al backend</Text>
        </View>
      </View>

      {/* Content */}
      {receivedNotifications && receivedNotifications.length > 0 ? (
        <View style={styles.content}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>📬 Notificaciones Recientes</Text>
            <Text style={styles.listCount}>{receivedNotifications.length}</Text>
          </View>

          <FlatList
            data={receivedNotifications}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderNotification}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔔"
            title="Sin notificaciones"
            message="Las notificaciones recibidas aparecerán aquí. El simulador web en la PC puede enviar eventos para generarlas."
          />

          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Cómo funciona</Text>
        <Text style={styles.infoText}>
          1. Abre el simulador web (demo-interactive.html) en tu PC
        </Text>
        <Text style={styles.infoText}>
          2. Simula eventos OCPP desde el panel de control
        </Text>
        <Text style={styles.infoText}>
          3. Las notificaciones se enviarán automáticamente según las reglas (R1-R5)
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  badge: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  connectionStatus: {
    backgroundColor: '#d3f9d8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectionText: {
    color: '#2f9e44',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listCount: {
    fontSize: 12,
    color: '#999',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },
});

export default HomeScreen;