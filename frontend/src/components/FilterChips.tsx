import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, CategoryColors } from '../constants/colors';

interface FilterChip {
  id: string;
  label: string;
  color?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function FilterChips({ chips, selectedId, onSelect }: FilterChipsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {chips.map((chip) => {
          const isSelected = chip.id === selectedId;
          const chipColor = chip.color || CategoryColors[chip.id] || Colors.primary;
          
          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chip,
                isSelected && { backgroundColor: chipColor },
                !isSelected && styles.chipOutline,
              ]}
              onPress={() => onSelect(chip.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                !isSelected && { color: chipColor },
              ]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 32,
  },
  container: {
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 32,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    height: 26,
    justifyContent: 'center',
  },
  chipOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Colors.textLight,
  },
});
