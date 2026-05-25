// Componente para mostrar una notificación individual
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NotificationLog } from '../types';

interface NotificationItemProps {
  notification: NotificationLog;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'R1':
        return '#fbbf24'; // Amarillo
      case 'R2':
        return '#60a5fa'; // Azul
      case 'R3':
        return '#34d399'; // Verde
      case 'R4':
        return '#a78bfa'; // Púrpura
      case 'R5':
        return '#f87171'; // Rojo
      default:
        return '#667eea'; // Azul por defecto
    }
  };

  const getRuleLabel = (type: string) => {
    switch (type) {
      case 'R1':
        return 'SOC ≥ 90%';
      case 'R2':
        return 'Tiempo < 10min';
      case 'R3':
        return 'Disponible';
      case 'R4':
        return 'Finalizando';
      case 'R5':
        return 'Error/Fallo';
      default:
        return 'Sistema';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[styles.badge, { backgroundColor: getRuleColor(notification.type) }]}
      >
        <Text style={styles.badgeText}>{notification.type}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatTime(notification.sentAt)}</Text>
        </View>

        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>

        <View style={styles.ruleLabel}>
          <Text style={[styles.ruleText, { color: getRuleColor(notification.type) }]}>
            {getRuleLabel(notification.type)}
          </Text>
        </View>
      </View>

      <View style={styles.indicator}>
        <View
          style={[styles.dot, { backgroundColor: getRuleColor(notification.type) }]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 45,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  body: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  ruleLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  ruleText: {
    fontSize: 10,
    fontWeight: '500',
  },
  indicator: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
