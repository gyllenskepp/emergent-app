import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors, CategoryColors, CategoryNames } from '../../src/constants/colors';
import { useDataStore, Event } from '../../src/stores/dataStore';
import { Button } from '../../src/components/Button';

export default function HomeScreen() {
  const router = useRouter();
  const { events, fetchEvents, isLoadingEvents, fetchCategories } = useDataStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const nextEvent = events.length > 0 ? events[0] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="dice" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>BORKA</Text>
            <Text style={styles.heroSubtitle}>Brädspel & Rollspel i Sandviken</Text>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardIcon}>
              <Ionicons name="time-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Öppet för allmänheten</Text>
              <Text style={styles.infoCardText}>Tisdag & Onsdag</Text>
              <Text style={styles.infoCardText}>18:00 - 21:30</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardIcon}>
              <Ionicons name="location-outline" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Besök oss</Text>
              <Text style={styles.infoCardText}>Odengatan 31</Text>
              <Text style={styles.infoCardText}>Sandviken</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/calendar')}>
            <Ionicons name="calendar" size={20} color={Colors.textLight} />
            <Text style={styles.quickActionText}>Se kalender</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.quickActionSecondary]} 
            onPress={() => router.push('/info')}
          >
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>Bli medlem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.quickActionSecondary]} 
            onPress={() => Linking.openURL('mailto:borka.sandviken@gmail.com')}
          >
            <Ionicons name="mail" size={20} color={Colors.primary} />
            <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>Kontakta oss</Text>
          </TouchableOpacity>
        </View>

        {/* Next Event */}
        {nextEvent && (
          <View style={styles.nextEventSection}>
            <Text style={styles.sectionTitle}>Nästa event</Text>
            <NextEventCard event={nextEvent} onPress={() => router.push(`/event/${nextEvent.id}`)} />
          </View>
        )}

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Om BORKA</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              BORKA grundades ur en djup passion för bräd- och rollspel och med visionen att skapa en skärmfri mötesplats där människor i alla åldrar kan samlas, umgås och upptäcka glädjen i spel tillsammans.
            </Text>
            <Button
              title="Läs mer"
              variant="ghost"
              size="small"
              onPress={() => router.push('/info')}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NextEventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const startDate = new Date(event.start_time);
  const categoryColor = CategoryColors[event.category] || Colors.primary;
  const categoryName = CategoryNames[event.category] || event.category;

  return (
    <TouchableOpacity style={styles.nextEventCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.nextEventAccent, { backgroundColor: categoryColor }]} />
      <View style={styles.nextEventContent}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryText}>{categoryName}</Text>
        </View>
        <Text style={styles.nextEventTitle}>{event.title}</Text>
        <View style={styles.nextEventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {format(startDate, 'EEEE d MMMM', { locale: sv })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {format(startDate, 'HH:mm')}
            </Text>
          </View>
        </View>
        <View style={styles.nextEventArrow}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: Colors.surface,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  quickActionSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
  quickActionTextSecondary: {
    color: Colors.primary,
  },
  nextEventSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  nextEventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  nextEventAccent: {
    width: 4,
  },
  nextEventContent: {
    flex: 1,
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  nextEventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  nextEventDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  nextEventArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  aboutSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});
