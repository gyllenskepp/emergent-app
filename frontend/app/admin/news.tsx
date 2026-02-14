import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors } from '../../src/constants/colors';
import { useDataStore, News } from '../../src/stores/dataStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function AdminNewsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { news, fetchNews, createNews, updateNews, deleteNews } = useDataStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    fetchNews();
  }, []);

  const openCreateModal = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      body: '',
      image: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (item: News) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      body: item.body,
      image: item.image || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Fel', 'Titel krävs');
      return;
    }
    if (!formData.body.trim()) {
      Alert.alert('Fel', 'Innehåll krävs');
      return;
    }

    try {
      const newsData = {
        title: formData.title,
        body: formData.body,
        image: formData.image || undefined,
      };

      if (editingNews) {
        await updateNews(editingNews.id, newsData);
        Alert.alert('Klart', 'Nyhet uppdaterad');
      } else {
        await createNews(newsData);
        Alert.alert('Klart', 'Nyhet skapad');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Fel', 'Något gick fel');
    }
  };

  const handleDelete = (item: News) => {
    Alert.alert(
      'Ta bort nyhet',
      `Är du säker på att du vill ta bort "${item.title}"?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNews(item.id);
              Alert.alert('Klart', 'Nyhet borttagen');
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ta bort nyheten');
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hantera nyheter</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {news.map((item) => (
          <View key={item.id} style={styles.newsCard}>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDate}>
                {format(new Date(item.publish_date), 'd MMM yyyy', { locale: sv })}
              </Text>
              <Text style={styles.newsBody} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
            <View style={styles.newsActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={20} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNews ? 'Redigera nyhet' : 'Skapa nyhet'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Spara</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Titel</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Nyhetstitel"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Innehåll</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.body}
              onChangeText={(text) => setFormData({ ...formData, body: text })}
              placeholder="Skriv nyheten här..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={8}
            />

            <Text style={styles.label}>Bild (base64, valfritt)</Text>
            <TextInput
              style={styles.input}
              value={formData.image}
              onChangeText={(text) => setFormData({ ...formData, image: text })}
              placeholder="data:image/jpeg;base64,..."
              placeholderTextColor={Colors.textMuted}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  newsContent: {
    flex: 1,
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  newsDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  newsBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  newsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
});
