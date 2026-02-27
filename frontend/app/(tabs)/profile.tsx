import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CategoryNames } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser, loginWithEmail, error, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notification_preferences?.enabled || false
  );
  const [categoryPrefs, setCategoryPrefs] = useState(
    user?.notification_preferences?.categories || {
      open_game_night: false,
      member_night: false,
      tournament: false,
      special_event: false,
      news: false,
    }
  );
  
const handleEmailAuth = async () => {
  if (!email.trim()) {
    Alert.alert('Fel', 'Ange e-postadress');
    return;
  }
  if (!password.trim()) {
    Alert.alert('Fel', 'Ange lösenord');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    await loginWithEmail(email.trim(), password);
  } catch (err: any) {
    Alert.alert('Fel', err.message || 'Fel inloggning');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleLogout = async () => {
    Alert.alert(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logga ut',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await updateUser({
        notification_preferences: {
          ...user?.notification_preferences,
          enabled: value,
        },
      } as any);
    } catch (error) {
      setNotificationsEnabled(!value);
      Alert.alert('Fel', 'Kunde inte uppdatera inställningar');
    }
  };

  const toggleCategory = async (category: string, value: boolean) => {
    const newPrefs = { ...categoryPrefs, [category]: value };
    setCategoryPrefs(newPrefs);
    try {
      await updateUser({
        notification_preferences: {
          ...user?.notification_preferences,
          categories: newPrefs,
        },
      } as any);
    } catch (error) {
      setCategoryPrefs({ ...categoryPrefs, [category]: !value });
      Alert.alert('Fel', 'Kunde inte uppdatera inställningar');
    }
  };

  const handleSubscribeCalendar = () => {
    Alert.alert(
      'Prenumerera på kalendern',
      'Välj hur du vill prenumerera:',
      [
        {
          text: 'Apple Kalender (iPhone)',
          onPress: () => {
            const webcalUrl = `${API_URL}/api/calendar/ics`.replace('https://', 'webcal://').replace('http://', 'webcal://');
            Linking.openURL(webcalUrl);
          },
        },
        {
          text: 'Google Kalender',
          onPress: () => {
            const icsUrl = encodeURIComponent(`${API_URL}/api/calendar/ics`);
            Linking.openURL(`https://calendar.google.com/calendar/r?cid=${icsUrl}`);
          },
        },
        { text: 'Avbryt', style: 'cancel' },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.loginContent}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profil</Text>
            </View>

            <View style={styles.loginContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.welcomeTitle}>Välkommen till BORKA</Text>
              <Text style={styles.welcomeText}>
                Logga in för att få tillgång till personliga inställningar, notiser och mer.
              </Text>

              {/* Email Form */}
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="E-postadress"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Lösenord"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                
                <Button
                  title="Logga in"
                  onPress={handleEmailAuth}
                  loading={isSubmitting}
                />

                {/* Error message display */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={styles.adminHint}>
                  Kontakta admin för konto.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <View style={styles.avatarImage}>
                <Ionicons name="person" size={32} color={Colors.textLight} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role === 'admin' ? 'Admin' : 'Medlem'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notisinställningar</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color={Colors.primary} />
                <Text style={styles.settingLabel}>Aktivera notiser</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>

            {notificationsEnabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.subsectionTitle}>Kategorier</Text>
                {Object.entries(CategoryNames).map(([key, label]) => (
                  <View key={key} style={styles.settingRow}>
                    <Text style={styles.categoryLabel}>{label}</Text>
                    <Switch
                      value={categoryPrefs[key as keyof typeof categoryPrefs]}
                      onValueChange={(value) => toggleCategory(key, value)}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.surface}
                    />
                  </View>
                ))}
                <View style={styles.settingRow}>
                  <Text style={styles.categoryLabel}>Nyheter</Text>
                  <Switch
                    value={categoryPrefs.news}
                    onValueChange={(value) => toggleCategory('news', value)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.surface}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Calendar Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kalendersynk</Text>
          <View style={styles.card}>
            <Text style={styles.syncInfo}>
              Prenumerera på BORKA:s kalender för att få alla event direkt i din kalender-app.
            </Text>
            <TouchableOpacity style={styles.syncButton} onPress={handleSubscribeCalendar}>
              <Ionicons name="cloud-download-outline" size={24} color={Colors.primary} />
              <Text style={styles.syncButtonText}>Prenumerera på kalendern</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Panel */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adminpanel</Text>
            <View style={styles.card}>
              <TouchableOpacity 
                style={styles.adminItem}
                onPress={() => router.push('/admin/events')}
              >
                <Ionicons name="calendar" size={24} color={Colors.primary} />
                <Text style={styles.adminItemText}>Hantera event</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.adminItem}
                onPress={() => router.push('/admin/news')}
              >
                <Ionicons name="newspaper" size={24} color={Colors.secondary} />
                <Text style={styles.adminItemText}>Hantera nyheter</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            <Text style={styles.logoutText}>Logga ut</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  loginContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  authTabActive: {
    backgroundColor: Colors.surface,
  },
  authTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  authTabTextActive: {
    color: Colors.text,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  adminHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  syncInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  syncButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  adminItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  bottomSpacer: {
    height: 32,
  },
});
