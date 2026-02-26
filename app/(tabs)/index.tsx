import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { useBLEStore } from '@/store/bleStore';
import { bleService } from '@/services/ble';
import { colors, spacing } from '@/constants/design';
import { StatusPill } from '@/components/ui/StatusPill';
import { DisconnectedState } from '@/components/home/DisconnectedState';
import { ConnectedState } from '@/components/home/ConnectedState';

export default function HomeScreen() {
  const { connectionState, connectedNode, scanError } = useBLEStore();

  const isConnected = connectionState === 'connected' && connectedNode;
  const isScanning = connectionState === 'scanning' || connectionState === 'connecting';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Emergency Mode</Text>
            <Text style={styles.appName}>MeshSOS</Text>
          </View>

          {isConnected ? (
            <StatusPill
              label="Node Active"
              color={colors.green}
              dimColor={colors.greenDim}
              borderColor={colors.greenBorder}
              pulse
            />
          ) : (
            <StatusPill
              label="No Node"
              color={colors.red}
              dimColor={colors.redDim}
              borderColor={colors.redBorder}
            />
          )}
        </View>

        {/* Body */}
        {isConnected ? (
          <ConnectedState node={connectedNode} />
        ) : (
          <DisconnectedState
            isScanning={isScanning}
            scanError={scanError}
            onScan={() => bleService.startScan()}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    fontFamily: 'DM Sans',
    lineHeight: 28,
  },
});
