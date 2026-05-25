// Pantalla de Perfil
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/notifications';
import { apiService } from '../services/api';
import { Button } from '../components/Button';

type NavigationProp = NativeStackNavigationProp<any>;

interface ProfileScreenProps {
  navigation: NavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadDeviceInfo();
    checkConnection();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const token = await notificationService.getDeviceToken();
      setDeviceToken(token);
      console.log('[ProfileScreen] Token cargado:', token?.substring(0, 20) + '...');
    } catch (error) {
      console.error('[ProfileScreen] Error cargando token:', error);
    }
  };

  const checkConnection = async () => {
    try {
      await apiService.getBackendStatus();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      console.log('[ProfileScreen] Iniciando logout...');

      if (deviceToken && apiService.getUserId()) {
        try {
          await apiService.deactivateDeviceToken(deviceToken);
          console.log('[ProfileScreen] Token desactivado');
        } catch (error) {
          console.warn('[ProfileScreen] Error desactivando token:', error);
        }
      }

      notificationService.clearNotificationListeners();
      logout();
      console.log('[ProfileScreen] Logout completado');
      navigation.replace('Login');
    } catch (error) {
      console.error('[ProfileScreen] Error en logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    const today = new Date();
    const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const todayCount = notifications.filter((n: any) => {
      const date = new Date(n.sentAt);
      return date.toDateString() === today.toDateString();
    }).length;

    const last24hCount = notifications.filter((n: any) => {
      const date = new Date(n.sentAt);
      return date >= last24h;
    }).length;

    const ruleStats = {
      R1: notifications.filter((n: any) => n.type === 'R1').length,
      R2: notifications.filter((n: any) => n.type === 'R2').length,
      R3: notifications.filter((n: any) => n.type === 'R3').length,
      R4: notifications.filter((n: any) => n.type === 'R4').length,
      R5: notifications.filter((n: any) => n.type === 'R5').length,
    };

    return { todayCount, last24hCount, ruleStats };
  };

  const stats = getStatistics();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.email}>{user?.email || 'test@test.com'}</Text>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 Estado del Sistema</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Backend</Text>
              <View
                style={[
                  styles.statusBadge,
                  isConnected ? styles.statusBadgeGreen : styles.statusBadgeRed,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Notificaciones</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>✓ Habilitadas</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Token FCM</Text>
              <Text style={styles.tokenText}>{deviceToken ? '✓' : '✗'}</Text>
            </View>
          </View>

          {deviceToken && (
            <View style={styles.tokenDisplay}>
              <Text style={styles.tokenLabel}>Token de Dispositivo</Text>
              <Text style={styles.tokenValue}>{deviceToken.substring(0, 40)}...</Text>
            </View>
          )}
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{notifications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.todayCount}</Text>
              <Text style={styles.statLabel}>Hoy</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.last24hCount}</Text>
              <Text style={styles.statLabel}>Últimas 24h</Text>
            </View>
          </View>

          {/* Rule Distribution */}
          <View style={styles.ruleDistribution}>
            <Text style={styles.ruleDistributionTitle}>Por Regla</Text>

            {[
              { rule: 'R1', label: 'SOC ≥ 90%', count: stats.ruleStats.R1, color: '#fbbf24' },
              { rule: 'R2', label: 'Tiempo < 10min', count: stats.ruleStats.R2, color: '#60a5fa' },
              { rule: 'R3', label: 'Disponible', count: stats.ruleStats.R3, color: '#34d399' },
              { rule: 'R4', label: 'Finalizando', count: stats.ruleStats.R4, color: '#a78bfa' },
              { rule: 'R5', label: 'Error', count: stats.ruleStats.R5, color: '#f87171' },
            ].map(({ rule, label, count, color }) => (
              <View key={rule} style={styles.ruleRow}>
                <View style={[styles.ruleColor, { backgroundColor: color }]} />
                <Text style={styles.ruleLabel}>{label}</Text>
                <Text style={styles.ruleCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Información</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Versión:</Text> 1.0.0
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>API Base:</Text> /api
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Motor de Reglas:</Text> R1, R2, R3, R4, R5
            </Text>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Button
            title="🔄 Actualizar Estado"
            onPress={checkConnection}
            variant="secondary"
            size="large"
            style={styles.actionButton}
          />

          <Button
            title="📋 Copiar Token"
            onPress={() => {
              if (deviceToken) {
                console.log('[ProfileScreen] Token copiado');
              }
            }}
            variant="secondary"
            size="large"
            style={styles.actionButton}
          />

          <Button
            title="🚪 Cerrar Sesión"
            onPress={handleLogout}
            loading={loading}
            disabled={loading}
            variant="danger"
            size="large"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeGreen: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  tokenText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  tokenDisplay: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  tokenLabel: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier New',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  ruleDistribution: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  ruleDistributionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ruleColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  ruleLabel: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  ruleCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    minWidth: 20,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 10,
  },
});

export default ProfileScreen;