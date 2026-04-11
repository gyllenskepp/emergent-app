import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/constants/colors';

const API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://borka-mobile-dev.preview.emergentagent.com';

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminMembersScreen() {
  const router = useRouter();
  const { sessionToken, createUserAsAdmin } = useAuthStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!res.ok) throw new Error('Kunde inte hämta medlemmar');
      const data = await res.json();
      setMembers(data);
    } catch (e: any) {
      Alert.alert('Fel', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Fel', 'Fyll i namn och e-post');
      return;
    }
    setSubmitting(true);
    try {
      await createUserAsAdmin({ name: name.trim(), email: email.trim(), role });
      Alert.alert('Klart!', 'Medlem skapad');
      setName('');
      setEmail('');
      setRole('member');
      setShowForm(false);
      fetchMembers();
    } catch (e: any) {
      Alert.alert('Fel', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (member: Member) => {
    Alert.alert(
      'Ta bort medlem',
      `Är du säker på att du vill ta bort ${member.name}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `${API_URL}/api/admin/users/${member.user_id}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${sessionToken}` },
                }
              );
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Kunde inte ta bort');
              }
              fetchMembers();
            } catch (e: any) {
              Alert.alert('Fel', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hantera medlemmar</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Ionicons
            name={showForm ? 'close' : 'person-add'}
            size={24}
            color={Colors.textOnPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Create form */}
        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skapa nytt konto</Text>
            <TextInput
              style={styles.input}
              placeholder="Namn"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="E-postadress"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {/* Role picker */}
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'member' && styles.roleBtnActive]}
                onPress={() => setRole('member')}
              >
                <Text style={[styles.roleBtnText, role === 'member' && styles.roleBtnTextActive]}>
                  Medlem
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
            <Button title="Skapa konto" onPress={handleCreate} loading={submitting} />
          </View>
        )}

        {/* Member list */}
        {isLoading ? (
          <ActivityIndicator color={Colors.textOnPrimary} style={{ marginTop: 40 }} />
        ) : members.length === 0 ? (
          <Text style={styles.emptyText}>Inga medlemmar hittades</Text>
        ) : (
          <>
            <Text style={styles.listLabel}>{members.length} konton</Text>
            {members.map((m) => (
              <View key={m.user_id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={20} color={Colors.textLight} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                  <View style={[styles.rolePill, m.role === 'admin' && styles.rolePillAdmin]}>
                    <Text style={styles.rolePillText}>
                      {m.role === 'admin' ? 'Admin' : 'Medlem'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(m)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  addBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleBtnTextActive: {
    color: Colors.textLight,
  },
  listLabel: {
    fontSize: 13,
    color: Colors.textOnPrimaryMuted,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textOnPrimaryMuted,
    marginTop: 40,
    fontSize: 15,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rolePillAdmin: {
    backgroundColor: Colors.primaryDark,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteBtn: {
    padding: 8,
  },
});
