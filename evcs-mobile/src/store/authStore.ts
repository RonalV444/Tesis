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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  deviceTokenRegistered: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('[Store] Iniciando login...');

      const response = await apiService.login(email, password);

      if (response.success) {
        set({
          user: response.user,
          token: response.token,
          isLoading: false,
          error: null,
        });
        console.log('[Store] Login exitoso');

        // Registrar token FCM/Expo después del login
        console.log('[Store] Registrando token de notificaciones...');
        try {
          const registered = await notificationService.registerTokenWithBackend(response.user.id);
          if (registered) {
            set({ deviceTokenRegistered: true });
            console.log('[Store] ✅ Token de notificaciones registrado exitosamente');
          } else {
            console.warn('[Store] ⚠️ No se pudo registrar el token de notificaciones');
            // No fallar el login si el token no se registra
          }
        } catch (tokenError) {
          console.error('[Store] ❌ Error registrando token de notificaciones:', tokenError);
          // No fallar el login si el token no se registra
        }

        return true;
      } else {
        set({
          isLoading: false,
          error: response.message || 'Error en login',
        });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error('[Store] Error en login:', errorMessage);
      return false;
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      error: null,
    });
    apiService.clearAuth();
    console.log('[Store] Logout realizado');
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
