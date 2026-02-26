import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '@/constants/design';
import { SupplyType, SUPPLY_TYPE_LABELS, SUPPLY_TYPE_EMOJI } from '@/types';
import { SectionLabel } from '@/components/ui/SectionLabel';

const ALL_TYPES: SupplyType[] = ['water', 'food', 'medical', 'other'];

interface SupplyChipsProps {
  selected: SupplyType[];
  onChange: (types: SupplyType[]) => void;
}

export function SupplyChips({ selected, onChange }: SupplyChipsProps) {
  function toggle(type: SupplyType) {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  }

  return (
    <View style={styles.container}>
      <SectionLabel>
        What do you need?{' '}
        <Text style={styles.hint}>(select all that apply)</Text>
      </SectionLabel>
      <View style={styles.grid}>
        {ALL_TYPES.map((type) => {
          const isSelected = selected.includes(type);
          return (
            <TouchableOpacity
              key={type}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggle(type)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{SUPPLY_TYPE_EMOJI[type]}</Text>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {SUPPLY_TYPE_LABELS[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  hint: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 10,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '47%',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    fontFamily: 'DM Sans',
  },
  chipLabelSelected: {
    color: colors.accent,
  },
});
