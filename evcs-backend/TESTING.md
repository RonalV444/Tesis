# 🧪 Guía de Pruebas - EVCS Backend

Este documento explica cómo ejecutar las pruebas unitarias e integración del módulo de notificaciones inteligentes.

## 📋 Contenido de Pruebas

### Pruebas Unitarias

1. **`ruleEngine.test.ts`** - Pruebas del motor de reglas (40+ casos)
   - R1: Detección de SOC ≥ 90%
   - R2: Detección de tiempo restante < 10 min
   - R3: Detección de cargador disponible
   - R4: Detección de fin de carga
   - R5: Detección de errores/fallos
   - Comportamiento general y validación de datos

2. **`notifications.test.ts`** - Pruebas del servicio de notificaciones (15+ casos)
   - Registro de tokens de dispositivo
   - Desactivación de tokens
   - Envío de notificaciones a usuarios
   - Manejo de errores

### Pruebas de Integración

3. **`integration.test.ts`** - Flujos completos end-to-end (20+ casos)
   - Flujo: Inicio de transacción
   - Flujo: Monitoreo de carga
   - Flujo: Error en cargador
   - Flujo: Fin de transacción
   - Flujo: Cargador se libera
   - Casos complejos con múltiples eventos

## 🚀 Ejecutar Pruebas

### Instalar dependencias

```bash
npm install
```

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar pruebas en modo watch (recarga automática)

```bash
npm run test:watch
```

### Ejecutar pruebas con salida detallada

```bash
npm run test:verbose
```

### Generar reporte de cobertura

```bash
npm run test:coverage
```

## 📊 Cobertura Esperada

```
Archivos:
├── ruleEngine.ts        → 95%+ cobertura (5 estrategias)
├── notifications.ts     → 80%+ cobertura (registración y envío)
└── firebase.ts         → 60%+ cobertura (mocks para pruebas)

Global Target: 60% cobertura mínima
```

## 🔍 Estructura de Pruebas

```
__tests__/
├── setup.ts                 # Configuración global de Jest
├── ruleEngine.test.ts       # Pruebas unitarias de reglas
├── notifications.test.ts    # Pruebas de notificaciones
└── integration.test.ts      # Pruebas de integración
```

## ✅ Validación de Reglas

Cada prueba valida:

- **Entrada**: Evento OCPP con parámetros específicos
- **Procesamiento**: Evaluación a través del RuleEngine
- **Salida**: Notificación generada (si aplica)
- **Datos**: Estructura y contenido de la notificación

### Ejemplo: Prueba de R1 (SOC ≥ 90%)

```typescript
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

  expect(result?.shouldNotify).toBe(true);
  expect(result?.ruleTriggered).toBe('R1-SOC');
  expect(result?.title).toContain('casi completa');
});
```

## 🧩 Mocks Utilizados

### Base de Datos (db.ts)

```typescript
jest.mock('../src/services/db', () => ({
  db: {
    query: jest.fn(),
  },
}));
```

### Firebase (firebase.ts)

```typescript
jest.mock('../src/services/firebase', () => ({
  sendPushNotificationFirebase: jest.fn(),
  sendMulticastNotification: jest.fn(),
}));
```

## 📈 Flujo de Prueba Completo

```
1. Evento OCPP (ej: MeterValues)
       ↓
2. RuleEngine.evaluate(event)
       ↓
3. Evaluación de estrategias (R1-R5)
       ↓
4. RetornarNotificationResult (si aplica)
       ↓
5. Envío a través de Firebase (mocked)
       ↓
6. Logging en BD (mocked)
```

## 🐛 Debugging de Pruebas

### Ver logs durante pruebas

Comentar las líneas del `setup.ts`:

```typescript
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
// });
```

### Ejecutar una sola prueba

```bash
npx jest ruleEngine.test.ts -t "Debe enviar notificación cuando SOC alcanza 90%"
```

### Ejecutar un archivo de pruebas

```bash
npx jest ruleEngine.test.ts --verbose
```

## 📝 Notas Importantes

1. **Pruebas Aisladas**: Cada prueba es independiente y usa `beforeEach` para limpiar mocks
2. **Sin Base de Datos**: Las pruebas no requieren BD real (todo es mocked)
3. **Sin Firebase Real**: Las pruebas no envían notificaciones reales
4. **Rápidas**: Suite completa se ejecuta en < 2 segundos

## 🎯 Próximos Pasos

- Agregar pruebas de rendimiento (latencia evento → notificación)
- Agregar pruebas de reconexión WebSocket
- Agregar pruebas de tolerancia a fallos
- Integrar con CI/CD (GitHub Actions, etc.)

## 📞 Soporte

Para más información, revisar:
- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Documentación de ts-jest](https://kulshekhar.github.io/ts-jest/)
- `src/services/ruleEngine.ts` - Implementación del motor
