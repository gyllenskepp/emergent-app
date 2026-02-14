import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function InfoScreen() {
  const openMap = () => {
    Linking.openURL('https://www.google.com/maps/place/B.O.R.K.A/@60.6221681,16.7803552');
  };

  const callPatrik = () => Linking.openURL('tel:+46706522431');
  const callNiklas = () => Linking.openURL('tel:+46761683219');
  const sendEmail = () => Linking.openURL('mailto:borka.sandviken@gmail.com');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Information</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om BORKA</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              BORKA (Bräd Och Rollspels Klubben Avskärmad) grundades ur en djup passion för bräd- och rollspel och med visionen att skapa en skärmfri mötesplats där människor i alla åldrar kan samlas, umgås och upptäcka glädjen i spel tillsammans.
            </Text>
            <Text style={[styles.cardText, { marginTop: 12 }]}>
              Hos BORKA är alla välkomna, oavsett erfarenhet. Vi erbjuder en inkluderande miljö där spelglädje står i fokus.
            </Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hur det fungerar</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Öppna spelkvällar</Text>
                <Text style={styles.infoText}>
                  Kom och spela spel med oss varje tisdag och onsdag mellan 18:00 och 21:30. Öppet för alla!
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="people-outline" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Medlemskvällar</Text>
                <Text style={styles.infoText}>
                  Bli medlem och delta i våra exklusiva spelkvällar där du kan träffa likasinnade och upptäcka nya spel.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="cube-outline" size={24} color={Colors.tournament} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Låna spel</Text>
                <Text style={styles.infoText}>
                  Som medlem kan du låna hem spel för att fortsätta ha kul även när du är hemma.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Membership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medlemskap</Text>
          <View style={styles.card}>
            <View style={styles.membershipFeature}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.membershipText}>Tillgång till alla medlemskvällar</Text>
            </View>
            <View style={styles.membershipFeature}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.membershipText}>Låna hem spel från vårt bibliotek</Text>
            </View>
            <View style={styles.membershipFeature}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.membershipText}>Boka lokalen för privata spelkvällar</Text>
            </View>
            <View style={styles.membershipFeature}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.membershipText}>Rabatter hos våra sponsorer</Text>
            </View>
            <TouchableOpacity style={styles.membershipButton} onPress={sendEmail}>
              <Text style={styles.membershipButtonText}>Kontakta oss för att bli medlem</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sponsors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Våra sponsorer</Text>
          <View style={styles.card}>
            <Text style={styles.sponsorText}>
              Vi vill rikta ett stort tack till våra sponsorer:
            </Text>
            <View style={styles.sponsorList}>
              <View style={styles.sponsorItem}>
                <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
                <Text style={styles.sponsorName}>Nya Bokhandeln i Sandviken</Text>
              </View>
              <View style={styles.sponsorItem}>
                <Ionicons name="desktop-outline" size={20} color={Colors.secondary} />
                <Text style={styles.sponsorName}>Data Metropolen</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.contactItem} onPress={sendEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={24} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>E-post</Text>
                <Text style={styles.contactValue}>borka.sandviken@gmail.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactItem} onPress={callPatrik}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Patrik (Tisdagsledare)</Text>
                <Text style={styles.contactValue}>070-652 24 31</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactItem} onPress={callNiklas}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={24} color={Colors.tournament} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Niklas (Onsdagsledare)</Text>
                <Text style={styles.contactValue}>076-168 32 19</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.contactItem} onPress={openMap}>
              <View style={styles.contactIcon}>
                <Ionicons name="location" size={24} color={Colors.specialEvent} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Adress</Text>
                <Text style={styles.contactValue}>Odengatan 31, Sandviken</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
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
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  membershipFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  membershipText: {
    fontSize: 14,
    color: Colors.text,
  },
  membershipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  membershipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
  },
  sponsorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  sponsorList: {
    gap: 12,
  },
  sponsorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomSpacer: {
    height: 32,
  },
});
