/**
 * Integration Tests para OCPP y RuleEngine
 * Valida el flujo completo: evento OCPP → RuleEngine → Notificación
 */

import { RuleEngine, OcppEvent } from '../src/services/ruleEngine';

describe('OCPP Integration Tests', () => {
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
  });

  describe('Flujo completo: Inicio de transacción', () => {
    test('StartTransaction debe procesarse y evaluar reglas', () => {
      // Simular evento OCPP de inicio
      const event: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'StartTransaction',
        timestamp: new Date().toISOString(),
      };

      const result = ruleEngine.evaluate(event);

      // Para StartTransaction, no debería haber regla que se dispare
      // (las reglas se disparan en MeterValues, StatusNotification, etc.)
      expect(result).toBeNull();
    });
  });

  describe('Flujo completo: Monitoreo de carga', () => {
    test('Debe detectar carga completa en 90% SOC', () => {
      // 1. Evento de MeterValues con SOC=89%
      const event1: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'MeterValues',
        soc: 89,
        timestamp: new Date().toISOString(),
      };

      const result1 = ruleEngine.evaluate(event1);
      expect(result1).toBeNull(); // No aplica aún

      // 2. Evento de MeterValues con SOC=92%
      const event2: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'MeterValues',
        soc: 92,
        timestamp: new Date().toISOString(),
      };

      const result2 = ruleEngine.evaluate(event2);
      expect(result2).not.toBeNull();
      expect(result2?.ruleTriggered).toBe('R1-SOC');
    });
  });

  describe('Flujo completo: Error en cargador', () => {
    test('Debe alertar cuando cargador falla durante carga', () => {
      // 1. Carga activa con MeterValues
      const event1: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'MeterValues',
        soc: 45,
        timestamp: new Date().toISOString(),
      };

      const result1 = ruleEngine.evaluate(event1);
      expect(result1).toBeNull(); // Carga normal

      // 2. Cambio de estado a Faulted
      const event2: OcppEvent = {
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'StatusNotification',
        status: 'Faulted',
        timestamp: new Date().toISOString(),
      };

      const result2 = ruleEngine.evaluate(event2);
      expect(result2).not.toBeNull();
      expect(result2?.ruleTriggered).toBe('R5-Fault');
      expect(result2?.priority).toBe('high');
    });
  });

  describe('Flujo completo: Fin de transacción', () => {
    test('Debe notificar al completar carga', () => {
      // 1. Carga en progreso
      const event1: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'MeterValues',
        soc: 99,
        timestamp: new Date().toISOString(),
      };

      const result1 = ruleEngine.evaluate(event1);
      expect(result1?.ruleTriggered).toBe('R1-SOC'); // Notificación de casi completo

      // 2. Stop Transaction
      const event2: OcppEvent = {
        transactionId: 'tx-001',
        chargePointId: 'CP-MALL-01-01',
        userId: 'driver-123',
        eventType: 'StopTransaction',
        status: 'Finishing',
        meterValue: { value: 42.5, unit: 'kWh' },
        timestamp: new Date().toISOString(),
      };

      const result2 = ruleEngine.evaluate(event2);
      expect(result2).not.toBeNull();
      expect(result2?.ruleTriggered).toBe('R4-Finishing');
      expect(result2?.body).toContain('finalizado');
    });
  });

  describe('Flujo completo: Cargador se libera', () => {
    test('Debe notificar cuando cargador vuelve a disponible', () => {
      // 1. Cargador estaba Charging
      const event1: OcppEvent = {
        chargePointId: 'CP-MALL-01-01',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Charging',
        timestamp: new Date().toISOString(),
      };

      const result1 = ruleEngine.evaluate(event1);
      expect(result1).toBeNull();

      // 2. Cargador ahora es Available
      const event2: OcppEvent = {
        chargePointId: 'CP-MALL-01-01',
        userId: 'system',
        eventType: 'StatusNotification',
        status: 'Available',
        timestamp: new Date().toISOString(),
      };

      const result2 = ruleEngine.evaluate(event2);
      expect(result2).not.toBeNull();
      expect(result2?.ruleTriggered).toBe('R3-Availability');
      expect(result2?.priority).toBe('medium');
    });
  });

  describe('Casos complejos: Múltiples eventos', () => {
    test('Debe manejar secuencia realista de eventos de carga', () => {
      const chargePointId = 'CP-MALL-01-01';
      const userId = 'driver-123';
      const txId = 'tx-001';

      // Evento 1: Start
      const startEvent: OcppEvent = {
        transactionId: txId,
        chargePointId,
        userId,
        eventType: 'StartTransaction',
        timestamp: new Date().toISOString(),
      };
      let result = ruleEngine.evaluate(startEvent);
      expect(result).toBeNull(); // No hay notificación en start

      // Evento 2: Meter Values progresivos
      const meterEvents = [
        { soc: 20, timestamp: new Date().toISOString() },
        { soc: 45, timestamp: new Date().toISOString() },
        { soc: 88, timestamp: new Date().toISOString() },
        { soc: 91, timestamp: new Date().toISOString() }, // Aquí se dispara R1
      ];

      let notificationCount = 0;
      for (const meter of meterEvents) {
        const event: OcppEvent = {
          transactionId: txId,
          chargePointId,
          userId,
          eventType: 'MeterValues',
          soc: meter.soc,
          timestamp: meter.timestamp,
        };
        result = ruleEngine.evaluate(event);
        if (result?.shouldNotify) {
          notificationCount++;
        }
      }

      expect(notificationCount).toBeGreaterThan(0);

      // Evento 3: Stop Transaction
      const stopEvent: OcppEvent = {
        transactionId: txId,
        chargePointId,
        userId,
        eventType: 'StopTransaction',
        status: 'Finishing',
        meterValue: { value: 45.2, unit: 'kWh' },
        timestamp: new Date().toISOString(),
      };
      result = ruleEngine.evaluate(stopEvent);
      expect(result?.ruleTriggered).toBe('R4-Finishing');
    });
  });

  describe('Validación de estructura de datos OCPP', () => {
    test('Evento debe contener información mínima requerida', () => {
      const minimalEvent: OcppEvent = {
        chargePointId: 'CP-001',
        userId: 'user-123',
        eventType: 'StatusNotification',
        status: 'Available',
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        ruleEngine.evaluate(minimalEvent);
      }).not.toThrow();
    });

    test('Debe manejar eventos con datos opcionales', () => {
      const richEvent: OcppEvent = {
        transactionId: 'tx-123',
        chargePointId: 'CP-001',
        userId: 'user-123',
        eventType: 'MeterValues',
        soc: 85,
        power: 7.2,
        current: 32,
        voltage: 230,
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        ruleEngine.evaluate(richEvent);
      }).not.toThrow();
    });
  });
});
