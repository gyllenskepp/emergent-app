import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors, CategoryColors, CategoryNames } from '../constants/colors';
import { Event } from '../stores/dataStore';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  showAddToCalendar?: boolean;
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export function EventCard({ event, onPress, showAddToCalendar = true }: EventCardProps) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const categoryColor = CategoryColors[event.category] || Colors.primary;
  const categoryName = CategoryNames[event.category] || event.category;

  const handleAddToCalendar = async () => {
    try {
      // Open ICS file URL
      const icsUrl = `${API_URL}/api/calendar/event/${event.id}/ics`;
      
      if (Platform.OS === 'ios') {
        // iOS can directly open ICS files
        await Linking.openURL(icsUrl);
      } else {
        // Android - try Google Calendar
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        await Linking.openURL(gcalUrl);
      }
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte öppna kalendern');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
        <Text style={styles.categoryText}>{categoryName}</Text>
      </View>
      
      <Text style={styles.title}>{event.title}</Text>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          {format(startDate, 'd MMMM yyyy', { locale: sv })}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.infoText}>{event.location}</Text>
      </View>
      
      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}
      
      {showAddToCalendar && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCalendar}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addButtonText}>Lägg till i kalender</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
