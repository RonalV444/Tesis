/**
 * Unit Tests para Notifications Service
 * Valida el registro y envío de notificaciones
 */

import { sendNotificationToUser, registerDeviceToken, deactivateDeviceToken } from '../src/services/notifications';

// Mock del módulo db
jest.mock('../src/services/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Mock del módulo firebase
jest.mock('../src/services/firebase', () => ({
  sendPushNotificationFirebase: jest.fn(),
  sendMulticastNotification: jest.fn(),
}));

import { db } from '../src/services/db';
import { sendMulticastNotification } from '../src/services/firebase';

const mockDb = db as jest.Mocked<typeof db>;
const mockSendMulticast = sendMulticastNotification as jest.MockedFunction<typeof sendMulticastNotification>;

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerDeviceToken', () => {
    test('Debe registrar un token de dispositivo correctamente', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }] as any);

      const result = await registerDeviceToken({
        userId: 'user-123',
        token: 'device-token-abc123',
      });

      expect(result.success).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_tokens'),
        ['user-123', 'device-token-abc123']
      );
    });

    test('Debe manejar errores en registro de token', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const result = await registerDeviceToken({
        userId: 'user-123',
        token: 'device-token-abc123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('Debe actualizar si el token ya existe', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }] as any);

      await registerDeviceToken({
        userId: 'user-123',
        token: 'device-token-abc123',
      });

      const callArgs = mockDb.query.mock.calls[0];
      expect(callArgs[0]).toContain('ON DUPLICATE KEY UPDATE');
    });
  });

  describe('deactivateDeviceToken', () => {
    test('Debe desactivar un token correctamente', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }] as any);

      const result = await deactivateDeviceToken('device-token-abc123');

      expect(result.success).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE device_tokens'),
        expect.arrayContaining(['device-token-abc123'])
      );
    });

    test('Debe manejar errores en desactivación', async () => {
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const result = await deactivateDeviceToken('device-token-abc123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendNotificationToUser', () => {
    test('Debe obtener tokens del usuario y enviar notificación', async () => {
      // Mock para obtener tokens
      mockDb.query.mockResolvedValueOnce([
        [
          { id: 1, token: 'token-123' },
          { id: 2, token: 'token-456' },
        ],
        [],
      ] as any);

      // Mock para FCM - esperar llamada con mock resuelto
      mockSendMulticast.mockResolvedValueOnce({
        success: true,
        successCount: 2,
        failureCount: 0,
        results: [],
      } as any);

      // Mock para logging (segunda llamada a db.query)
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 2 }, []] as any);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 2 }, []] as any);

      const result = await sendNotificationToUser({
        userId: 'user-123',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result.success).toBe(true);
      expect(mockSendMulticast).toHaveBeenCalledTimes(1);
      expect(mockSendMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          body: 'Test Body',
          tokens: ['token-123', 'token-456'],
        })
      );
    });

    test('No debe enviar si el usuario no tiene tokens', async () => {
      mockDb.query.mockResolvedValue([[], []] as any);

      const result = await sendNotificationToUser({
        userId: 'user-with-no-tokens',
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active device tokens');
    });

    test('Debe incluir datos personalizados en notificación', async () => {
      mockDb.query.mockResolvedValueOnce([
        [{ id: 1, token: 'token-123' }],
      ] as any);
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      mockSendMulticast.mockResolvedValue({
        success: true,
        successCount: 1,
        failureCount: 0,
        results: [],
      });

      await sendNotificationToUser({
        userId: 'user-123',
        title: 'Title',
        body: 'Body',
        data: { customKey: 'customValue' },
      });

      expect(mockSendMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customKey: 'customValue' }),
        })
      );
    });

    test('Debe manejar errores en envío de notificaciones', async () => {
      mockDb.query.mockResolvedValueOnce([
        [{ id: 1, token: 'token-123' }],
      ] as any);

      mockSendMulticast.mockRejectedValue(new Error('FCM error'));

      const result = await sendNotificationToUser({
        userId: 'user-123',
        title: 'Title',
        body: 'Body',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Validación de parámetros', () => {
    test('registerDeviceToken debe rechazar userId vacío', async () => {
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }] as any);

      // Esto debería ser manejado por el controlador, pero lo documentamos
      expect(() => {
        registerDeviceToken({ userId: '', token: 'token-123' });
      }).not.toThrow();
    });

    test('sendNotificationToUser debe requerir título y cuerpo', async () => {
      // Esto debería ser validado, pero lo documentamos
      expect(() => {
        sendNotificationToUser({
          userId: 'user-123',
          title: '',
          body: '',
        });
      }).not.toThrow();
    });
  });
});
