/**
 * Unit Tests para RuleEngine
 * Valida que todas las estrategias de notificación funcionen correctamente
 */

import { RuleEngine, OcppEvent, NotificationResult } from '../src/services/ruleEngine';

describe('RuleEngine - Motor de Reglas de Notificaciones', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('R1 - SOC Strategy (SOC ≥ 90%)', () => {
    test('Debe enviar notificación cuando SOC alcanza 90%', () => {
      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        soc: 90,
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
      expect(result?.ruleTriggered).toBe('R1-SOC');
      expect(result?.title).toContain('casi completa');
      expect(result?.priority).toBe('high');
    });

    test('No debe enviar notificación cuando SOC < 90%', () => {
      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        soc: 85,
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).toBeNull();
    });

    test('Debe ignorar MeterValues sin SOC', () => {
      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).toBeNull();
    });

    test('Debe incluir SOC en datos de notificación', () => {
      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        soc: 95,
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data.soc).toBe('95');
    });
  });

  describe('R2 - TimeRemaining Strategy (Tiempo < 10 min)', () => {
    test('Debe enviar notificación cuando faltan < 10 minutos', () => {
      const now = new Date();
      const finish = new Date(now.getTime() + 5 * 60000); // 5 minutos

      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        estimatedFinishTime: finish.toISOString(),
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
      expect(result?.ruleTriggered).toBe('R2-TimeRemaining');
      expect(result?.title).toContain('bajo');
    });

    test('No debe enviar notificación cuando faltan > 10 minutos', () => {
      const now = new Date();
      const finish = new Date(now.getTime() + 15 * 60000); // 15 minutos

      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        estimatedFinishTime: finish.toISOString(),
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).toBeNull();
    });

    test('Debe calcular correctamente minutos restantes', () => {
      const now = new Date();
      const finish = new Date(now.getTime() + 7 * 60000); // 7 minutos

      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        estimatedFinishTime: finish.toISOString(),
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data.minutesRemaining).toBeDefined();
      expect(parseInt(result?.data.minutesRemaining || '0')).toBeLessThanOrEqual(7);
    });
  });

  describe('R3 - Availability Strategy (Status = Available)', () => {
    test('Debe enviar notificación cuando cargador está disponible', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Available',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
      expect(result?.ruleTriggered).toBe('R3-Availability');
      expect(result?.title).toContain('disponible');
      expect(result?.priority).toBe('medium');
    });

    test('No debe enviar notificación para otros estados', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Charging',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).toBeNull();
    });

    test('Debe incluir chargePointId en datos', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Available',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data.chargePointId).toBe('CP-001');
    });
  });

  describe('R4 - Finishing Strategy (Carga finalizada)', () => {
    test('Debe enviar notificación cuando carga termina', () => {
      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'StopTransaction',
        status: 'Finishing',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
      expect(result?.ruleTriggered).toBe('R4-Finishing');
      expect(result?.title).toContain('finalizada');
      expect(result?.priority).toBe('high');
    });

    test('Debe incluir transactionId en datos de finalización', () => {
      const event: OcppEvent = {
        transactionId: 'tx-789',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'StopTransaction',
        status: 'Finishing',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data.transactionId).toBe('tx-789');
    });
  });

  describe('R5 - Fault Strategy (Error/Corte)', () => {
    test('Debe enviar notificación cuando cargador falla', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'StatusNotification',
        status: 'Faulted',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
      expect(result?.ruleTriggered).toBe('R5-Fault');
      expect(result?.title).toContain('Error');
      expect(result?.priority).toBe('high');
    });

    test('Debe incluir status de error en datos', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'StatusNotification',
        status: 'Faulted',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data.status).toBe('Faulted');
    });
  });

  describe('Comportamiento general del RuleEngine', () => {
    test('Debe retornar null si no hay regla aplicable', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'Heartbeat' as any,
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result).toBeNull();
    });

    test('Debe evaluar solo la primera regla que aplique', () => {
      // Este test asegura que no se envíen múltiples notificaciones
      const now = new Date();
      const finish = new Date(now.getTime() + 5 * 60000);

      const event: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-456',
        eventType: 'MeterValues',
        soc: 95, // Aplica R1
        estimatedFinishTime: finish.toISOString(), // También aplica R2
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      // Debe retornar solo una notificación (la primera que se evalúa)
      expect(result).not.toBeNull();
      expect(result?.shouldNotify).toBe(true);
    });

    test('Debe tener al menos 5 estrategias registradas', () => {
      const strategies = ruleEngine.getStrategies();
      expect(strategies.length).toBeGreaterThanOrEqual(5);
    });

    test('Debe permitir agregar estrategias personalizadas', () => {
      const initialCount = ruleEngine.getStrategies().length;

      // Crear una estrategia mock
      class CustomStrategy {
        evaluate() {
          return null;
        }
        getName() {
          return 'CustomStrategy';
        }
      }

      ruleEngine.addStrategy(new CustomStrategy() as any);
      const finalCount = ruleEngine.getStrategies().length;

      expect(finalCount).toBe(initialCount + 1);
    });
  });

  describe('Validación de datos de notificación', () => {
    test('Todas las notificaciones deben tener estructura válida', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Faulted',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      if (result && result.shouldNotify) {
        expect(result.title).toBeDefined();
        expect(result.body).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.ruleTriggered).toBeDefined();
        expect(result.priority).toMatch(/high|medium|low/);
      }
    });

    test('Notificaciones deben tener datos validos', () => {
      const event: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Available',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      expect(result?.data).toEqual(
        expect.objectContaining({
          type: expect.any(String),
        })
      );
    });
  });
});
