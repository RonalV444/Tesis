/**
 * RuleEngine - Motor de Reglas para Notificaciones Inteligentes
 * Implementa el patrón Strategy para evaluación de reglas OCPP
 * 
 * Reglas definidas:
 * R1: SOC ≥ 90% → Alerta preventiva de carga casi completa
 * R2: Tiempo < 10 min → Alerta de tiempo restante bajo
 * R3: Status = 'Available' → Alerta de cargador disponible
 * R4: Status = 'Finishing' → Notificación de fin de carga
 * R5: Status = 'Faulted' → Alerta de error/corte de carga
 */

export interface OcppEvent {
  transactionId?: string;
  chargePointId: string;
  userId: string;
  eventType: 'StatusNotification' | 'MeterValues' | 'StartTransaction' | 'StopTransaction';
  status?: string; // 'Available', 'Charging', 'Faulted', 'Reserved', 'Unavailable'
  soc?: number; // State of Charge (0-100)
  timestamp?: string;
  meterValue?: {
    value: number;
    unit?: string;
  };
  startTime?: string;
  estimatedFinishTime?: string;
  power?: number; // kW
  current?: number; // A
  voltage?: number; // V
}

export interface NotificationResult {
  shouldNotify: boolean;
  title: string;
  body: string;
  data: Record<string, string>;
  ruleTriggered: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Estrategia base para evaluación de reglas
 */
abstract class NotificationStrategy {
  abstract evaluate(event: OcppEvent): NotificationResult | null;
  abstract getName(): string;
}

/**
 * Estrategia R1: SOC ≥ 90% - Alerta preventiva de carga casi completa
 */
class SOCStrategy extends NotificationStrategy {
  private threshold = 90;

  evaluate(event: OcppEvent): NotificationResult | null {
    if (event.eventType !== 'MeterValues' || !event.soc) {
      return null;
    }

    if (event.soc >= this.threshold) {
      return {
        shouldNotify: true,
        title: '⚡ Carga casi completa',
        body: `Tu sesión de carga alcanzó ${event.soc.toFixed(0)}% SOC. ¡Casi listo!`,
        data: {
          type: 'charge_almost_complete',
          soc: event.soc.toString(),
          transactionId: event.transactionId || '',
        },
        ruleTriggered: 'R1-SOC',
        priority: 'high',
      };
    }

    return null;
  }

  getName(): string {
    return 'SOCStrategy';
  }

  setThreshold(value: number): void {
    this.threshold = value;
  }
}

/**
 * Estrategia R2: Tiempo < 10 min - Alerta de tiempo restante bajo
 */
class TimeRemainingStrategy extends NotificationStrategy {
  private thresholdMinutes = 10;

  evaluate(event: OcppEvent): NotificationResult | null {
    if (event.eventType !== 'MeterValues' || !event.estimatedFinishTime) {
      return null;
    }

    const now = new Date();
    const finishTime = new Date(event.estimatedFinishTime);
    const diffMs = finishTime.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes > 0 && diffMinutes <= this.thresholdMinutes) {
      return {
        shouldNotify: true,
        title: '⏱️ Tiempo de carga bajo',
        body: `Tu carga estará lista en aproximadamente ${Math.ceil(diffMinutes)} minuto(s).`,
        data: {
          type: 'time_remaining_low',
          minutesRemaining: Math.ceil(diffMinutes).toString(),
          transactionId: event.transactionId || '',
        },
        ruleTriggered: 'R2-TimeRemaining',
        priority: 'high',
      };
    }

    return null;
  }

  getName(): string {
    return 'TimeRemainingStrategy';
  }

  setThreshold(minutes: number): void {
    this.thresholdMinutes = minutes;
  }
}

/**
 * Estrategia R3: Status = 'Available' - Alerta de cargador disponible
 */
class AvailabilityStrategy extends NotificationStrategy {
  evaluate(event: OcppEvent): NotificationResult | null {
    if (event.eventType !== 'StatusNotification') {
      return null;
    }

    if (event.status === 'Available') {
      return {
        shouldNotify: true,
        title: '✅ Cargador disponible',
        body: `El cargador ${event.chargePointId} está disponible para usar.`,
        data: {
          type: 'charger_available',
          chargePointId: event.chargePointId,
          timestamp: new Date().toISOString(),
        },
        ruleTriggered: 'R3-Availability',
        priority: 'medium',
      };
    }

    return null;
  }

  getName(): string {
    return 'AvailabilityStrategy';
  }
}

/**
 * Estrategia R4: Status = 'Finishing' - Notificación de fin de carga
 */
class FinishingStrategy extends NotificationStrategy {
  evaluate(event: OcppEvent): NotificationResult | null {
    // Detectar fin de carga: StatusNotification con Finishing o evento StopTransaction
    const isFinishing = (event.eventType === 'StatusNotification' && event.status === 'Finishing') ||
                        event.eventType === 'StopTransaction';

    if (!isFinishing) {
      return null;
    }

    return {
      shouldNotify: true,
      title: '✨ Carga finalizada',
      body: `Tu sesión de carga ha finalizado en ${event.chargePointId}. ¡Vehículo listo!`,
      data: {
        type: 'charging_finished',
        chargePointId: event.chargePointId,
        transactionId: event.transactionId || '',
      },
      ruleTriggered: 'R4-Finishing',
      priority: 'high',
    };
  }

  getName(): string {
    return 'FinishingStrategy';
  }
}

/**
 * Estrategia R5: Status = 'Faulted' - Alerta de error/corte
 */
class FaultStrategy extends NotificationStrategy {
  evaluate(event: OcppEvent): NotificationResult | null {
    if (event.eventType !== 'StatusNotification') {
      return null;
    }

    if (event.status === 'Faulted') {
      return {
        shouldNotify: true,
        title: '❌ Error en la carga',
        body: `Ocurrió un problema en la estación ${event.chargePointId}. Por favor, verifica el conexión.`,
        data: {
          type: 'charging_error',
          chargePointId: event.chargePointId,
          status: event.status,
          timestamp: new Date().toISOString(),
        },
        ruleTriggered: 'R5-Fault',
        priority: 'high',
      };
    }

    return null;
  }

  getName(): string {
    return 'FaultStrategy';
  }
}

/**
 * Motor de Reglas Principal
 * Evalúa eventos contra múltiples estrategias
 */
export class RuleEngine {
  private strategies: NotificationStrategy[] = [];

  constructor() {
    // Inicializar estrategias por defecto
    this.strategies = [
      new SOCStrategy(),
      new TimeRemainingStrategy(),
      new AvailabilityStrategy(),
      new FinishingStrategy(),
      new FaultStrategy(),
    ];
  }

  /**
   * Evaluar un evento contra todas las estrategias
   * Retorna la primera notificación que se deba enviar
   */
  evaluate(event: OcppEvent): NotificationResult | null {
    console.log(`[RuleEngine] Evaluando evento: ${event.eventType} de ${event.chargePointId}`);

    for (const strategy of this.strategies) {
      const result = strategy.evaluate(event);
      if (result && result.shouldNotify) {
        console.log(`[RuleEngine] ✅ Regla disparada: ${result.ruleTriggered}`);
        return result;
      }
    }

    console.log(`[RuleEngine] ⚠️ Ninguna regla aplicable para este evento`);
    return null;
  }

  /**
   * Agregar una estrategia personalizada
   */
  addStrategy(strategy: NotificationStrategy): void {
    this.strategies.push(strategy);
    console.log(`[RuleEngine] Estrategia agregada: ${strategy.getName()}`);
  }

  /**
   * Obtener todas las estrategias activas
   */
  getStrategies(): NotificationStrategy[] {
    return this.strategies;
  }

  /**
   * Habilitar/deshabilitar estrategias
   */
  setActiveStrategies(names: string[]): void {
    const activeSet = new Set(names);
    this.strategies = this.strategies.filter(s => activeSet.has(s.getName()));
    console.log(`[RuleEngine] Estrategias activas: ${names.join(', ')}`);
  }
}

// Singleton exportado
export const ruleEngine = new RuleEngine();
