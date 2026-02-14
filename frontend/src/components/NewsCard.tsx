import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Colors } from '../constants/colors';
import { News } from '../stores/dataStore';

interface NewsCardProps {
  news: News;
  onPress?: () => void;
}

export function NewsCard({ news, onPress }: NewsCardProps) {
  const publishDate = new Date(news.publish_date);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {news.image && (
        <Image source={{ uri: news.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.date}>
          {format(publishDate, 'd MMMM yyyy', { locale: sv })}
        </Text>
        <Text style={styles.title}>{news.title}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {news.body}
        </Text>
        <Text style={styles.readMore}>Läs mer</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
});
