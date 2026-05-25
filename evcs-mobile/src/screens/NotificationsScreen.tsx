// Pantalla de Notificaciones
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { EmptyState } from '../components/index';

// Componente simplificado de notificación
const NotificationItem = ({ notification }: { notification: any }) => (
  <View style={styles.notificationItem}>
    <View style={styles.notificationIcon}>
      <Text style={styles.notificationIconText}>
        {notification.type === 'R1' ? '⚡' : notification.type === 'R5' ? '❌' : '📬'}
      </Text>
    </View>
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle}>{notification.title}</Text>
      <Text style={styles.notificationBody}>{notification.body}</Text>
      <Text style={styles.notificationTime}>
        {new Date(notification.sentAt).toLocaleString()}
      </Text>
    </View>
  </View>
);

const NotificationsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, isLoading } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

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
      console.error('[NotificationsScreen] Error refrescando:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredNotifications = selectedRule
    ? notifications.filter((n: any) => n.type === selectedRule)
    : notifications;

  // Agrupar por tipo de regla
  const groupedNotifications = [
    { title: '⚡ SOC ≥ 90% (R1)', data: notifications.filter((n: any) => n.type === 'R1') },
    { title: '⏱️ Tiempo < 10min (R2)', data: notifications.filter((n: any) => n.type === 'R2') },
    { title: '✅ Disponible (R3)', data: notifications.filter((n: any) => n.type === 'R3') },
    { title: '✨ Finalizando (R4)', data: notifications.filter((n: any) => n.type === 'R4') },
    { title: '❌ Error/Fallo (R5)', data: notifications.filter((n: any) => n.type === 'R5') },
  ].filter((section) => section.data.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Historial de Notificaciones</Text>
        <Text style={styles.subtitle}>Total: {notifications.length}</Text>
      </View>

      {notifications.length > 0 ? (
        <>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, !selectedRule && styles.filterTabActive]}
              onPress={() => setSelectedRule(null)}
            >
              <Text style={[styles.filterTabText, !selectedRule && styles.filterTabTextActive]}>
                Todo ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedRule === 'R1' && styles.filterTabActive]}
              onPress={() => setSelectedRule('R1')}
            >
              <Text style={[styles.filterTabText, selectedRule === 'R1' && styles.filterTabTextActive]}>
                R1 ({notifications.filter((n: any) => n.type === 'R1').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, selectedRule === 'R5' && styles.filterTabActive]}
              onPress={() => setSelectedRule('R5')}
            >
              <Text style={[styles.filterTabText, selectedRule === 'R5' && styles.filterTabTextActive]}>
                R5 ({notifications.filter((n: any) => n.type === 'R5').length})
              </Text>
            </TouchableOpacity>
          </View>

          {selectedRule ? (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => <NotificationItem notification={item} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <SectionList
              sections={groupedNotifications}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => <NotificationItem notification={item} />}
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
                  </View>
                </View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="📭"
            title="Sin notificaciones"
            message="Las notificaciones del backend aparecerán aquí cuando se disparen las reglas R1-R5"
          />
        </View>
      )}

      {notifications.length > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{notifications.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Hoy</Text>
            <Text style={styles.statValue}>
              {notifications.filter((n: any) => {
                const date = new Date(n.sentAt);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Últimas 24h</Text>
            <Text style={styles.statValue}>
              {notifications.filter((n: any) => {
                const date = new Date(n.sentAt);
                const now = new Date();
                return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
              }).length}
            </Text>
          </View>
        </View>
      )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#667eea',
  },
  filterTabText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  sectionBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
});

export default NotificationsScreen;