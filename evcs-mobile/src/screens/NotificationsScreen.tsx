// Pantalla de Notificaciones - VERSIÓN SIMPLIFICADA
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
import { EmptyState } from '../components/index';

const NotificationsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { receivedNotifications, fetchNotifications } = useNotificationStore();
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Sincronizar receivedNotifications con estado local
  useEffect(() => {
    console.log('[NotificationsScreen] Sincronizando notificaciones:', receivedNotifications.length);
    setLocalNotifications([...receivedNotifications]);
  }, [receivedNotifications]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[NotificationsScreen] Pantalla enfocada');
      handleRefresh();
    }, [user?.id])
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications(user?.id);
    } catch (error) {
      console.error('[NotificationsScreen] Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const NotificationItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {item.type === 'R1' ? '⚡' : item.type === 'R5' ? '❌' : '📬'}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (localNotifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="📭"
          title="Sin notificaciones"
          message="Las notificaciones aparecerán aquí cuando lleguen"
        />
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Historial de Notificaciones</Text>
        <Text style={styles.subtitle}>Total: {localNotifications.length}</Text>
      </View>

      <FlatList
        data={localNotifications}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => <NotificationItem item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
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
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NotificationsScreen;