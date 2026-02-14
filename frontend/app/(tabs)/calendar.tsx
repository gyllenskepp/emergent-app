import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors, CategoryColors, CategoryNames } from '../../src/constants/colors';
import { useDataStore, Event } from '../../src/stores/dataStore';
import { EventCard } from '../../src/components/EventCard';
import { FilterChips } from '../../src/components/FilterChips';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type ViewMode = 'list' | 'month';

export default function CalendarScreen() {
  const router = useRouter();
  const { events, fetchEvents, isLoadingEvents, categories, fetchCategories } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(selectedCategory !== 'all' ? selectedCategory : undefined);
    setRefreshing(false);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter(e => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const filterChips = [
    { id: 'all', label: 'Alla', color: Colors.text },
    { id: 'open_game_night', label: 'Öppna', color: CategoryColors.open_game_night },
    { id: 'member_night', label: 'Medlem', color: CategoryColors.member_night },
    { id: 'tournament', label: 'Turnering', color: CategoryColors.tournament },
    { id: 'special_event', label: 'Special', color: CategoryColors.special_event },
  ];

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kalender</Text>
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribeCalendar}>
          <Ionicons name="cloud-download-outline" size={20} color={Colors.primary} />
          <Text style={styles.subscribeText}>Prenumerera</Text>
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list" size={20} color={viewMode === 'list' ? Colors.textLight : Colors.text} />
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Ionicons name="calendar" size={20} color={viewMode === 'month' ? Colors.textLight : Colors.text} />
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Månad</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FilterChips chips={filterChips} selectedId={selectedCategory} onSelect={handleCategoryChange} />

      {viewMode === 'list' ? (
        <ScrollView
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {isLoadingEvents ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Inga kommande event</Text>
            </View>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/event/${event.id}`)}
              />
            ))
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <MonthView
          currentMonth={currentMonth}
          events={filteredEvents}
          onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          onEventPress={(event) => router.push(`/event/${event.id}`)}
        />
      )}
    </SafeAreaView>
  );
}

function MonthView({
  currentMonth,
  events,
  onPrevMonth,
  onNextMonth,
  onEventPress,
}: {
  currentMonth: Date;
  events: Event[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEventPress: (event: Event) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const today = new Date();
  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

  // Get starting offset for first day of month
  const startDayOffset = (monthStart.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_time), day));
  };

  return (
    <View style={styles.monthView}>
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy', { locale: sv })}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.monthNavButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarGrid}>
        <View style={styles.daysGrid}>
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          
          {/* Day cells */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            
            return (
              <View key={day.toISOString()} style={styles.dayCell}>
                <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  <Text style={[styles.dayNumberText, isToday && styles.dayNumberTextToday]}>
                    {format(day, 'd')}
                  </Text>
                </View>
                {dayEvents.slice(0, 2).map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.eventDot, { backgroundColor: CategoryColors[event.category] || Colors.primary }]}
                    onPress={() => onEventPress(event)}
                  >
                    <Text style={styles.eventDotText} numberOfLines={1}>
                      {event.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {dayEvents.length > 2 && (
                  <Text style={styles.moreEvents}>+{dayEvents.length - 2}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subscribeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleTextActive: {
    color: Colors.textLight,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 32,
  },
  monthView: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  calendarGrid: {
    flex: 1,
    paddingHorizontal: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    minHeight: 80,
    padding: 4,
    borderWidth: 0.5,
    borderColor: Colors.divider,
  },
  dayNumber: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNumberToday: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  dayNumberTextToday: {
    color: Colors.textLight,
  },
  eventDot: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 2,
  },
  eventDotText: {
    fontSize: 9,
    color: Colors.textLight,
    fontWeight: '600',
  },
  moreEvents: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
