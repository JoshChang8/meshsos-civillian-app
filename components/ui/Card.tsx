import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius } from '@/constants/design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string;
}

export function Card({ children, style, borderColor }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        borderColor ? { borderColor } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
});
