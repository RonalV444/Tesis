// Store global para autenticación usando Zustand
import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  deviceTokenRegistered: boolean;

  // Acciones
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}
console.log('[Store] 🔴🔴🔴 AUTHSTORE CARGADO - VERSIÓN ACTUALIZADA 🔴🔴🔴');
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  deviceTokenRegistered: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('[Store] ========== INICIANDO LOGIN ==========');
      console.log('[Store] Email:', email);

      const response = await apiService.login(email, password);

      if (response.success) {
        set({
          user: response.user,
          token: response.token,
          isLoading: false,
          error: null,
        });
        console.log('[Store] ✅ Login exitoso para:', response.user.email);
        console.log('[Store] User ID:', response.user.id);

        // ============================================
        // REGISTRO DE TOKEN - CON LOGS DETALLADOS
        // ============================================
        console.log('[Store] 📢 Iniciando registro de token de notificaciones...');
        
        try {
          console.log('[Store] Llamando a notificationService.registerTokenWithBackend...');
          const registered = await notificationService.registerTokenWithBackend(response.user.id);
          
          if (registered) {
            set({ deviceTokenRegistered: true });
            console.log('[Store] ✅✅✅ TOKEN REGISTRADO EXITOSAMENTE ✅✅✅');
          } else {
            console.warn('[Store] ⚠️⚠️⚠️ FALLÓ EL REGISTRO DEL TOKEN ⚠️⚠️⚠️');
            console.warn('[Store] El backend no aceptó el token o hubo un error');
          }
        } catch (tokenError) {
          console.error('[Store] ❌❌❌ ERROR REGISTRANDO TOKEN ❌❌❌');
          console.error('[Store] Error detallado:', tokenError);
        }
        // ============================================

        return true;
      } else {
        console.error('[Store] ❌ Login falló:', response.message);
        set({
          isLoading: false,
          error: response.message || 'Error en login',
        });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      console.error('[Store] ❌❌❌ ERROR EN LOGIN ❌❌❌');
      console.error('[Store] Error:', errorMessage);
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },
logout: () => {
  console.log('[Store] Cerrando sesión...');
  set({
    user: null,
    token: null,
    error: null,
    deviceTokenRegistered: false,
  });
  apiService.clearAuth();
  console.log('[Store] Logout completado');
},

  setUser: (user: User | null) => {
    set({ user });
  },

  setToken: (token: string | null) => {
    set({ token });
  },

  clearError: () => {
    set({ error: null });
  },

  isAuthenticated: () => {
    const state = get();
    return state.user !== null && state.token !== null;
  },
}));