import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet, Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMessageStore } from '@/store/messageStore';
import { colors, radius, spacing } from '@/constants/design';
import { GatewayMessage, GatewayMessageType } from '@/types';

const TYPE_COLOR: Record<GatewayMessageType, string> = {
  info:   colors.accent,
  action: colors.green,
  urgent: colors.red,
};

const TYPE_DIM: Record<GatewayMessageType, string> = {
  info:   colors.accentDim,
  action: colors.greenDim,
  urgent: colors.redDim,
};

const TYPE_BORDER: Record<GatewayMessageType, string> = {
  info:   'rgba(167,139,250,0.3)',
  action: colors.greenBorder,
  urgent: colors.redBorder,
};

const TYPE_LABEL: Record<GatewayMessageType, string> = {
  info:   'Info',
  action: 'Action',
  urgent: 'Urgent',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Animated sync dot ────────────────────────────────────────────────────────

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.syncDot, { opacity }]} />;
}

// ─── Message row ─────────────────────────────────────────────────────────────

function MessageCard({ message }: { message: GatewayMessage }) {
  const color  = TYPE_COLOR[message.type];
  const dim    = TYPE_DIM[message.type];
  const border = TYPE_BORDER[message.type];
  const isRead = message.read === true;

  return (
    <View style={[styles.msgRow, isRead && styles.msgRowRead]}>
      <View style={[styles.leftBar, { backgroundColor: color }]} />
      <View style={styles.msgContent}>
        <View style={styles.msgTop}>
          <View style={styles.senderRow}>
            <Text style={styles.sender}>Gateway · {message.fromNodeId}</Text>
            <View style={[styles.badge, { backgroundColor: dim, borderColor: border }]}>
              <Text style={[styles.badgeText, { color }]}>{TYPE_LABEL[message.type]}</Text>
            </View>
          </View>
          <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
        </View>
        <Text style={styles.content}>{message.content}</Text>
      </View>
      {!isRead ? (
        <View style={styles.unreadDot} />
      ) : (
        <View style={styles.unreadDotSpacer} />
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { messages, markAllRead, lastSyncedAt, lastSyncedNodeId } = useMessageStore();

  // Mark all messages read when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      markAllRead();
    }, [markAllRead])
  );

  const syncTimeStr = lastSyncedAt
    ? `Last synced via Node ${lastSyncedNodeId ?? '—'} · ${formatTime(lastSyncedAt)}`
    : 'Not yet synced';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Updates from first responders</Text>
      </View>

      {/* Sync bar */}
      <View style={styles.syncBar}>
        <Text style={styles.syncText}>{syncTimeStr}</Text>
        <PulseDot />
      </View>

      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📻</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyDesc}>
            Updates from first responders and the gateway will appear here once your request is received.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    fontFamily: 'DM Sans',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'DM Sans',
  },
  syncBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
    flex: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  msgRowRead: {
    opacity: 0.7,
  },
  leftBar: {
    width: 3,
    flexShrink: 0,
  },
  msgContent: {
    flex: 1,
    padding: 11,
    gap: 5,
  },
  msgTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  sender: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'DM Sans',
  },
  time: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
    flexShrink: 0,
    marginLeft: 4,
  },
  content: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 14,
    marginRight: 10,
    flexShrink: 0,
  },
  unreadDotSpacer: {
    width: 7,
    marginRight: 10,
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'DM Sans',
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'DM Sans',
  },
});
