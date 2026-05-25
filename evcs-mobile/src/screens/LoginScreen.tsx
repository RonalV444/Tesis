// Pantalla de Login
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { LoadingScreen } from '../components/index';

type NavigationProp = NativeStackNavigationProp<any>;

interface LoginScreenProps {
  navigation: NavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      console.warn('[LoginScreen] Email y contraseña requeridos');
      return;
    }

    const success = await login(email, password);
    if (success) {
      console.log('[LoginScreen] Navegando a Home');
      navigation.replace('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>⚡</Text>
            <Text style={styles.title}>EVCS</Text>
            <Text style={styles.subtitle}>Sistema de Notificaciones</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Demo Credentials */}
            <View style={styles.demoBox}>
              <Text style={styles.demoLabel}>📋 Credenciales Demo</Text>
              <Text style={styles.demoText}>Email: test@test.com</Text>
              <Text style={styles.demoText}>Password: 123456</Text>
            </View>

            {/* Login Button */}
            <Button
              title={isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              size="large"
              style={styles.loginButton}
            />

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Esta aplicación es un cliente demostrativo que recibe notificaciones push desde el
                backend basadas en el motor de reglas (R1-R5).
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingScreen visible={isLoading} message="Verificando credenciales..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  formContainer: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  demoBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 6,
  },
  demoText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Courier New',
  },
  loginButton: {
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default LoginScreen;