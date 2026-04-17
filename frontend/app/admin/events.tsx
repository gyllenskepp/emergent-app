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
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors, CategoryColors, CategoryNames } from '../../src/constants/colors';
import { useDataStore, Event, Category } from '../../src/stores/dataStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/Button';

export default function AdminEventsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { events, fetchEvents, categories, fetchCategories, createEvent, updateEvent, deleteEvent } = useDataStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: 'Odengatan 31, Sandviken',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    category: 'open_game_night',
  });
  const [recurring, setRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState('4');
  const [activePicker, setActivePicker] = useState<{
    field: 'start_time' | 'end_time';
    mode: 'date' | 'time';
  } | null>(null);

  const openDatePicker = (field: 'start_time' | 'end_time') => {
    setActivePicker({ field, mode: 'date' });
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!activePicker) return;

    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    if (!selectedDate) return;

    if (Platform.OS === 'android') {
      if (activePicker.mode === 'date') {
        const existing = new Date(formData[activePicker.field]);
        selectedDate.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
        setFormData(prev => ({ ...prev, [activePicker.field]: selectedDate.toISOString() }));
        setActivePicker({ field: activePicker.field, mode: 'time' });
      } else {
        const existing = new Date(formData[activePicker.field]);
        existing.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setFormData(prev => ({ ...prev, [activePicker.field]: existing.toISOString() }));
        setActivePicker(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [activePicker.field]: selectedDate.toISOString() }));
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    fetchEvents();
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    const now = new Date();
    const start = new Date(now);
    start.setHours(18, 0, 0, 0);
    const end = new Date(now);
    end.setHours(21, 30, 0, 0);

    setFormData({
      title: '',
      description: '',
      location: 'Odengatan 31, Sandviken',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      category: 'open_game_night',
    });
    setRecurring(false);
    setRecurringWeeks('4');
    setModalVisible(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      start_time: event.start_time,
      end_time: event.end_time,
      category: event.category,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Fel', 'Titel krävs');
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        Alert.alert('Klart', 'Event uppdaterat');
      } else if (recurring) {
        const weeks = Math.max(1, Math.min(52, parseInt(recurringWeeks) || 4));
        const startBase = new Date(formData.start_time);
        const endBase = new Date(formData.end_time);
        for (let i = 0; i < weeks; i++) {
          const start = new Date(startBase);
          start.setDate(start.getDate() + i * 7);
          const end = new Date(endBase);
          end.setDate(end.getDate() + i * 7);
          await createEvent({ ...formData, start_time: start.toISOString(), end_time: end.toISOString() });
        }
        Alert.alert('Klart', `${weeks} återkommande event skapade`);
      } else {
        await createEvent(formData);
        Alert.alert('Klart', 'Event skapat');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Fel', 'Något gick fel');
    }
  };

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Ta bort event',
      `Är du säker på att du vill ta bort "${event.title}"?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              Alert.alert('Klart', 'Event borttaget');
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ta bort eventet');
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
        <Text style={styles.headerTitle}>Hantera event</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={[styles.eventAccent, { backgroundColor: CategoryColors[event.category] || Colors.primary }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>
                {format(new Date(event.start_time), 'd MMM yyyy HH:mm', { locale: sv })}
              </Text>
              <Text style={styles.eventCategory}>{CategoryNames[event.category]}</Text>
            </View>
            <View style={styles.eventActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(event)}>
                <Ionicons name="pencil" size={20} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(event)}>
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
              {editingEvent ? 'Redigera event' : 'Skapa event'}
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
              placeholder="Eventtitel"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Beskrivning</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Beskrivning"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Plats</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Plats"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryPicker}>
              {Object.entries(CategoryNames).map(([key, name]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    formData.category === key && { backgroundColor: CategoryColors[key] },
                  ]}
                  onPress={() => setFormData({ ...formData, category: key })}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      formData.category === key && { color: Colors.textLight },
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Starttid</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('start_time')}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {format(new Date(formData.start_time), 'EEEE d MMM yyyy HH:mm', { locale: sv })}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.label}>Sluttid</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('end_time')}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.dateButtonText}>
                {format(new Date(formData.end_time), 'EEEE d MMM yyyy HH:mm', { locale: sv })}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* DateTimePicker — Android: native dialog, iOS: modal with spinner */}
            {activePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={new Date(formData[activePicker.field])}
                mode={activePicker.mode}
                display="default"
                onChange={handlePickerChange}
                locale="sv-SE"
              />
            )}

            {activePicker && Platform.OS === 'ios' && (
              <Modal transparent animationType="slide" visible>
                <View style={styles.pickerOverlay}>
                  <View style={styles.pickerSheet}>
                    <View style={styles.pickerSheetHeader}>
                      <TouchableOpacity onPress={() => setActivePicker(null)}>
                        <Text style={styles.pickerDone}>Klar</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={new Date(formData[activePicker.field])}
                      mode="datetime"
                      display="spinner"
                      onChange={handlePickerChange}
                      locale="sv-SE"
                      style={styles.iosPicker}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {!editingEvent && (
              <>
                <View style={styles.recurringRow}>
                  <Text style={styles.label}>Återkommande (varje vecka)</Text>
                  <Switch
                    value={recurring}
                    onValueChange={setRecurring}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.surface}
                  />
                </View>

                {recurring && (
                  <>
                    <Text style={styles.label}>Antal veckor</Text>
                    <TextInput
                      style={styles.input}
                      value={recurringWeeks}
                      onChangeText={setRecurringWeeks}
                      keyboardType="number-pad"
                      placeholder="4"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={styles.recurringHint}>
                      Skapar {Math.max(1, Math.min(52, parseInt(recurringWeeks) || 4))} event med start från valt datum, ett per vecka.
                    </Text>
                  </>
                )}
              </>
            )}

            <View style={styles.bottomSpacer} />
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
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventAccent: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  eventActions: {
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
    color: Colors.textOnPrimary,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  recurringHint: {
    fontSize: 13,
    color: Colors.textOnPrimaryMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  pickerSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  iosPicker: {
    backgroundColor: Colors.background,
  },
});
