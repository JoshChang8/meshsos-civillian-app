import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/design';

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: 'DM Sans',
    marginBottom: 6,
  },
});
