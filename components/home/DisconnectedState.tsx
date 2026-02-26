import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '@/constants/design';
import { Card } from '@/components/ui/Card';

interface DisconnectedStateProps {
  isScanning: boolean;
  scanError: string | null;
  onScan: () => void;
}

export function DisconnectedState({ isScanning, scanError, onScan }: DisconnectedStateProps) {
  return (
    <View style={styles.container}>
      {/* Main disconnected card */}
      <Card style={styles.mainCard} borderColor="rgba(248,81,73,0.2)">
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.title}>No LoRa Node Found</Text>
        <Text style={styles.description}>
          Make sure your MeshSOS device is powered on and within Bluetooth range (~10m).
        </Text>

        {scanError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{scanError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonScanning]}
          onPress={onScan}
          disabled={isScanning}
          activeOpacity={0.8}
        >
          {isScanning ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.scanButtonText}>Scanning…</Text>
            </>
          ) : (
            <>
              <Text style={styles.scanButtonIcon}>🔵</Text>
              <Text style={styles.scanButtonText}>Scan for Nearby Node</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>

      {/* Hint card */}
      <Card style={styles.hintCard}>
        <Text style={styles.hintTitle}>Once connected you'll see</Text>
        <View style={styles.hintList}>
          <HintRow icon="📶" text="Signal strength to your node" />
          <HintRow icon="🏛️" text="Gateway connection status" />
          <HintRow icon="✉️" text="Ability to send supply requests" />
        </View>
      </Card>

      {/* Disabled send button */}
      <View style={styles.disabledButton}>
        <Text style={styles.disabledButtonText}>📡 Send Supply Request</Text>
      </View>
    </View>
  );
}

function HintRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.hintRow}>
      <Text style={styles.hintIcon}>{icon}</Text>
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  mainCard: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    fontFamily: 'DM Sans',
  },
  errorBanner: {
    backgroundColor: colors.redDim,
    borderColor: colors.redBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    width: '100%',
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  scanButton: {
    width: '100%',
    backgroundColor: colors.accent2,
    borderRadius: radius.sm,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonScanning: {
    opacity: 0.7,
  },
  scanButtonIcon: {
    fontSize: 14,
  },
  scanButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'DM Sans',
  },
  hintCard: {
    padding: spacing.md,
  },
  hintTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 10,
    fontFamily: 'DM Sans',
  },
  hintList: {
    gap: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
  disabledButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    opacity: 0.5,
    marginTop: 'auto',
  },
  disabledButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
});
