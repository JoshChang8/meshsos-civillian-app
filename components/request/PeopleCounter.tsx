import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/constants/design';
import { PeopleCount } from '@/types';
import { SectionLabel } from '@/components/ui/SectionLabel';

interface PeopleCounterProps {
  value: PeopleCount;
  onChange: (count: PeopleCount) => void;
}

interface CounterFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function CounterField({ label, value, onChange }: CounterFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value === 0 ? '' : String(value)}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          onChange(isNaN(n) || n < 0 ? 0 : n);
        }}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        maxLength={3}
      />
    </View>
  );
}

export function PeopleCounter({ value, onChange }: PeopleCounterProps) {
  return (
    <View style={styles.container}>
      <SectionLabel>People to provide for</SectionLabel>
      <View style={styles.row}>
        <CounterField
          label="ADULTS"
          value={value.adults}
          onChange={(v) => onChange({ ...value, adults: v })}
        />
        <CounterField
          label="CHILDREN"
          value={value.children}
          onChange={(v) => onChange({ ...value, children: v })}
        />
        <CounterField
          label="ELDERLY"
          value={value.elderly}
          onChange={(v) => onChange({ ...value, elderly: v })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'DM Sans',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'DM Mono',
  },
});
