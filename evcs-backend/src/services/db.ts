// Base de datos en MEMORIA (no necesita MySQL)
// Esto reemplaza toda la dependencia de mysql2

export interface MemoryDB {
  users: any[];
  deviceTokens: any[];
  notifications: any[];
  webSubscriptions: any[];
  chargePoints: any[];
  transactions: any[];
}

export const memoryDB: MemoryDB = {
  users: [
    { id: '1', email: 'test@test.com', password: '123456', name: 'Usuario Test', createdAt: new Date().toISOString() }
  ],
  deviceTokens: [],
  notifications: [],
  webSubscriptions: [],   // Para suscripciones de PWA
  chargePoints: [],
  transactions: []
};

// Objeto que simula la interfaz de mysql2/promise
export const db = {
  async query(sql: string, params?: any[]) {
    console.log('📝 [DEMO DB] Query:', sql, params || '');
    
    // Simular INSERT de charge_points
    if (sql.includes('INSERT INTO charge_points')) {
      const id = params?.[0];
      if (id && !memoryDB.chargePoints.find(cp => cp.id === id)) {
        memoryDB.chargePoints.push({ id, name: params?.[1], status: 'Available', last_heartbeat: new Date() });
      }
      return [{ insertId: Date.now() }, null];
    }
    
    // Simular UPDATE de charge_points
    if (sql.includes('UPDATE charge_points')) {
      return [{ affectedRows: 1 }, null];
    }
    
    // Simular SELECT de transactions activas
    if (sql.includes('SELECT user_id, id FROM transactions') && sql.includes('Active')) {
      const cpId = params?.[0];
      const activeTx = memoryDB.transactions.find(tx => tx.charge_point_id === cpId && tx.status === 'Active');
      if (activeTx) {
        return [[{ user_id: activeTx.user_id, id: activeTx.id }], null];
      }
      return [[], null];
    }
    
    // Simular INSERT de transactions
    if (sql.includes('INSERT INTO transactions')) {
      const newTx = {
        id: memoryDB.transactions.length + 1,
        charge_point_id: params?.[0],
        user_id: params?.[1],
        status: 'Active',
        start_time: new Date().toISOString()
      };
      memoryDB.transactions.push(newTx);
      return [{ insertId: newTx.id }, null];
    }
    
    // Simular UPDATE de transactions (Stop)
    if (sql.includes('UPDATE transactions') && sql.includes('Completed')) {
      const cpId = params?.[1];
      const tx = memoryDB.transactions.find(t => t.charge_point_id === cpId && t.status === 'Active');
      if (tx) {
        tx.status = 'Completed';
        tx.stop_time = new Date().toISOString();
        tx.energy_delivered = params?.[0];
      }
      return [{ affectedRows: 1 }, null];
    }
    
    return [[], null];
  },
  
  async execute(sql: string, params?: any[]) {
    return this.query(sql, params);
  }
};

// Función para probar conexión (siempre exitosa en modo demo)
export async function testConnection() {
  console.log('✅ [DEMO DB] Base de datos en memoria operativa');
  return true;
}