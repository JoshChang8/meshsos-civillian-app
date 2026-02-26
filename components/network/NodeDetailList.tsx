import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '@/constants/design';
import { MeshNode } from '@/types';
import { getSignalBars } from '@/constants/ble';
import { Card } from '@/components/ui/Card';

interface NodeDetailListProps {
  nodes: MeshNode[];
  connectedNodeId?: string;
  onNodePress?: (node: MeshNode) => void;
}

const NODE_EMOJI: Record<string, string> = {
  online:  '📡',
  weak:    '📡',
  offline: '📡',
  gateway: '🏛️',
};

const NODE_COLOR: Record<string, string> = {
  online:  colors.green,
  weak:    colors.yellow,
  offline: colors.red,
  gateway: colors.gateway,
};

// Reduced opacity for degraded/offline nodes
const NODE_EMOJI_OPACITY: Record<string, number> = {
  online:  1.0,
  weak:    0.5,
  offline: 0.3,
  gateway: 1.0,
};

function formatLastSeen(lastSeenAt?: number): string {
  if (!lastSeenAt) return 'Unknown';
  const diffMin = Math.floor((Date.now() - lastSeenAt) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  return `${diffMin} min ago`;
}

function SignalBars({ rssi, status }: { rssi: number; status: string }) {
  const filled = getSignalBars(rssi);
  const barColor = NODE_COLOR[status] ?? colors.green;

  return (
    <View style={styles.barsWrap}>
      {[6, 9, 12, 15].map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: h },
            i < filled ? { backgroundColor: barColor } : { backgroundColor: colors.border },
          ]}
        />
      ))}
    </View>
  );
}

export function NodeDetailList({ nodes, connectedNodeId, onNodePress }: NodeDetailListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Node Details</Text>
      <Card>
        {nodes.map((node, i) => {
          const isOffline = node.status === 'offline';
          const isConnected = node.nodeId === connectedNodeId;
          const hasCoordsq = node.latitude != null && node.longitude != null;
          const nameColor =
            node.status === 'gateway'
              ? colors.gateway
              : isOffline
              ? colors.textMuted
              : colors.text;
          const lastSeenStr = formatLastSeen(node.lastSeenAt);

          return (
            <TouchableOpacity
              key={node.nodeId}
              style={[styles.row, i < nodes.length - 1 && styles.rowBorder]}
              onPress={() => hasCoordsq && onNodePress?.(node)}
              activeOpacity={hasCoordsq ? 0.6 : 1}
            >
              <Text
                style={[
                  styles.emoji,
                  { opacity: NODE_EMOJI_OPACITY[node.status] ?? 1 },
                ]}
              >
                {NODE_EMOJI[node.status]}
              </Text>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: nameColor }]}>
                    {node.status === 'gateway' ? 'Gateway' : 'Node'} {node.nodeId}
                  </Text>
                  {isConnected && (
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedBadgeText}>BT Connected</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta}>
                  {node.distanceKm ? `${node.distanceKm.toFixed(1)} km · ` : ''}
                  {node.rssi} dBm · {node.hopCount} hop{node.hopCount !== 1 ? 's' : ''}
                </Text>
                <Text style={[styles.updated, isOffline && styles.updatedOffline]}>
                  {isOffline ? `Last seen ${lastSeenStr}` : `Updated ${lastSeenStr}`}
                </Text>
              </View>
              <SignalBars rssi={node.rssi} status={node.status} />
              {hasCoordsq && <Text style={styles.chevron}>›</Text>}
            </TouchableOpacity>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontFamily: 'DM Sans',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emoji: {
    fontSize: 16,
    width: 28,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  connectedBadge: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  connectedBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: 'DM Sans',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
  meta: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
  },
  updated: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
    fontStyle: 'italic',
  },
  updatedOffline: {
    color: colors.red,
  },
  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
