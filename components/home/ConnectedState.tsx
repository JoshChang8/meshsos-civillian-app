import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/constants/design';
import { NodeInfo, GatewayMessage, SupplyRequest, GatewayMessageType, RequestStatus, SUPPLY_TYPE_EMOJI, SUPPLY_TYPE_LABELS } from '@/types';
import { NodeCard } from './NodeCard';
import { bleService } from '@/services/ble';
import { useMessageStore } from '@/store/messageStore';
import { useRequestStore } from '@/store/requestStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Message config ───────────────────────────────────────────────────────────

const MSG_COLOR: Record<GatewayMessageType, string> = {
  urgent: colors.red,
  action: colors.green,
  info:   colors.accent,
};
const MSG_DIM: Record<GatewayMessageType, string> = {
  urgent: colors.redDim,
  action: colors.greenDim,
  info:   colors.accentDim,
};
const MSG_BORDER: Record<GatewayMessageType, string> = {
  urgent: colors.redBorder,
  action: colors.greenBorder,
  info:   'rgba(167,139,250,0.2)',
};
const MSG_LABEL: Record<GatewayMessageType, string> = {
  urgent: 'Urgent',
  action: 'Action',
  info:   'Info',
};

// ─── Request status config ────────────────────────────────────────────────────

const REQ_STATUS_LABEL: Record<RequestStatus, string> = {
  draft:    'Draft',
  pending:  'Pending',
  sent:     'Sent',
  relayed:  'Relayed',
  received: 'Received ✓',
  failed:   'Failed',
};
const REQ_STATUS_COLOR: Record<RequestStatus, string> = {
  draft:    colors.textMuted,
  pending:  colors.textMuted,
  sent:     colors.textMuted,
  relayed:  colors.yellow,
  received: colors.green,
  failed:   colors.red,
};
const REQ_STATUS_DIM: Record<RequestStatus, string> = {
  draft:    'rgba(125,135,144,0.12)',
  pending:  'rgba(125,135,144,0.12)',
  sent:     'rgba(125,135,144,0.12)',
  relayed:  'rgba(210,153,34,0.15)',
  received: colors.greenDim,
  failed:   colors.redDim,
};

// ─── From Responders ──────────────────────────────────────────────────────────

function MessageRow({ msg, isLast }: { msg: GatewayMessage; isLast: boolean }) {
  const color  = MSG_COLOR[msg.type];
  const dim    = MSG_DIM[msg.type];
  const border = MSG_BORDER[msg.type];

  return (
    <View style={[row.wrap, !isLast && row.border]}>
      <View style={[row.bar, { backgroundColor: color }]} />
      <View style={row.body}>
        <View style={row.top}>
          <View style={[row.badge, { backgroundColor: dim, borderColor: border }]}>
            <Text style={[row.badgeText, { color }]}>{MSG_LABEL[msg.type]}</Text>
          </View>
          <Text style={row.time}>{formatTime(msg.timestamp)}</Text>
        </View>
        <Text style={row.text} numberOfLines={2}>{msg.content}</Text>
        <Text style={row.sub}>via {msg.fromNodeId}</Text>
      </View>
      {!msg.read && <View style={row.unreadDot} />}
    </View>
  );
}

function RespondersSection() {
  const { messages, unreadCount } = useMessageStore();
  const router = useRouter();
  const recent = messages.slice(0, 3);

  return (
    <View>
      <View style={sec.header}>
        <View style={sec.headerLeft}>
          <Text style={sec.label}>Incoming Messages</Text>
          {unreadCount > 0 && (
            <View style={sec.unreadBadge}>
              <Text style={sec.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/status')}>
          <Text style={sec.link}>See all →</Text>
        </TouchableOpacity>
      </View>

      <View style={sec.card}>
        {recent.length === 0 ? (
          <View style={sec.empty}>
            <Text style={sec.emptyText}>No messages yet. Waiting for responders.</Text>
          </View>
        ) : (
          recent.map((msg, i) => (
            <MessageRow key={msg.id} msg={msg} isLast={i === recent.length - 1} />
          ))
        )}
      </View>
    </View>
  );
}

// ─── Sent Requests ────────────────────────────────────────────────────────────

function RequestRow({ req, isLast, expanded, onToggle }: {
  req: SupplyRequest;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = REQ_STATUS_COLOR[req.status];
  const dim   = REQ_STATUS_DIM[req.status];
  const total = req.people.adults + req.people.children + req.people.elderly;

  return (
    <View style={[row.wrap, !isLast && !expanded && row.border]}>
      <View style={[row.bar, { backgroundColor: colors.accent, opacity: 0.4 }]} />
      <View style={{ flex: 1 }}>
        <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
          <View style={row.body}>
            <View style={row.top}>
              <View style={row.supplyChips}>
                {req.supplyTypes.map((t) => (
                  <Text key={t} style={row.supplyEmoji}>{SUPPLY_TYPE_EMOJI[t]}</Text>
                ))}
                <Text style={row.peopleText}>
                  {total} {total === 1 ? 'person' : 'people'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={row.time}>{formatTime(req.createdAt)}</Text>
                <Text style={row.chevron}>{expanded ? '∧' : '∨'}</Text>
              </View>
            </View>
            <View style={[row.badge, { backgroundColor: dim, borderColor: `${color}33` }]}>
              <Text style={[row.badgeText, { color }]}>{REQ_STATUS_LABEL[req.status]}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={[exp.container, !isLast && row.border]}>
            {/* Supply types */}
            <View style={exp.section}>
              <Text style={exp.sectionLabel}>Supplies Requested</Text>
              <View style={exp.chipRow}>
                {req.supplyTypes.map((t) => (
                  <View key={t} style={exp.chip}>
                    <Text style={exp.chipText}>{SUPPLY_TYPE_EMOJI[t]} {SUPPLY_TYPE_LABELS[t]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* People breakdown */}
            <View style={exp.section}>
              <Text style={exp.sectionLabel}>People</Text>
              <View style={exp.row}>
                {req.people.adults > 0 && (
                  <Text style={exp.stat}>{req.people.adults} adult{req.people.adults !== 1 ? 's' : ''}</Text>
                )}
                {req.people.children > 0 && (
                  <Text style={exp.stat}>{req.people.children} child{req.people.children !== 1 ? 'ren' : ''}</Text>
                )}
                {req.people.elderly > 0 && (
                  <Text style={exp.stat}>{req.people.elderly} elderly</Text>
                )}
              </View>
            </View>

            {/* Additional info */}
            {req.additionalInfo.trim().length > 0 && (
              <View style={exp.section}>
                <Text style={exp.sectionLabel}>Notes</Text>
                <Text style={exp.notes}>{req.additionalInfo.trim()}</Text>
              </View>
            )}

            {/* Location */}
            {req.latitude != null && req.longitude != null && (
              <View style={exp.section}>
                <Text style={exp.sectionLabel}>Location</Text>
                <Text style={exp.mono}>
                  {req.latitude.toFixed(5)}, {req.longitude.toFixed(5)}
                </Text>
              </View>
            )}

            {/* Delivery timeline */}
            <View style={exp.section}>
              <Text style={exp.sectionLabel}>Delivery</Text>
              <View style={exp.timeline}>
                <View style={exp.timelineStep}>
                  <View style={[exp.timelineDot, req.sentAt ? exp.timelineDotDone : {}]} />
                  <Text style={[exp.timelineLabel, req.sentAt ? exp.timelineLabelDone : {}]}>Sent</Text>
                  {req.sentAt ? <Text style={exp.timelineSub}>{formatTime(req.sentAt)}</Text> : null}
                </View>
                <View style={exp.timelineLine} />
                <View style={exp.timelineStep}>
                  <View style={[exp.timelineDot, req.relayedAt ? exp.timelineDotDone : {}]} />
                  <Text style={[exp.timelineLabel, req.relayedAt ? exp.timelineLabelDone : {}]}>Relayed</Text>
                  {req.relayedAt ? <Text style={exp.timelineSub}>{formatTime(req.relayedAt)}</Text> : null}
                </View>
                <View style={exp.timelineLine} />
                <View style={exp.timelineStep}>
                  <View style={[exp.timelineDot, req.receivedAt ? exp.timelineDotReceived : {}]} />
                  <Text style={[exp.timelineLabel, req.receivedAt ? exp.timelineLabelReceived : {}]}>Received</Text>
                  {req.receivedAt ? <Text style={exp.timelineSub}>{formatTime(req.receivedAt)}</Text> : null}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function SentRequestsSection() {
  const { requests } = useRequestStore();
  const router = useRouter();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (requests.length === 0) return null;

  const recent = [...requests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <View>
      <View style={sec.header}>
        <Text style={sec.label}>Sent Requests</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/request')}>
          <Text style={sec.link}>New →</Text>
        </TouchableOpacity>
      </View>

      <View style={sec.card}>
        {recent.map((req, i) => (
          <RequestRow
            key={req.id}
            req={req}
            isLast={i === recent.length - 1}
            expanded={expandedId === req.id}
            onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── ConnectedState ───────────────────────────────────────────────────────────

interface ConnectedStateProps {
  node: NodeInfo;
}

export function ConnectedState({ node }: ConnectedStateProps) {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <NodeCard node={node} onReplace={() => bleService.disconnect()} />

      <SentRequestsSection />

      <RespondersSection />

      <TouchableOpacity
        style={styles.cta}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/request')}
      >
        <View>
          <Text style={styles.ctaTitle}>Send Supply Request</Text>
          <Text style={styles.ctaSub}>Reach emergency responders now</Text>
        </View>
        <Text style={styles.ctaArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  cta: {
    backgroundColor: colors.accent2,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'DM Sans',
  },
  ctaSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontFamily: 'DM Sans',
  },
  ctaArrow: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.8)',
  },
});

// Section chrome styles
const sec = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
  unreadBadge: {
    backgroundColor: colors.red,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'DM Mono',
  },
  link: {
    fontSize: 10,
    color: colors.accent,
    fontFamily: 'DM Sans',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  empty: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'DM Sans',
    lineHeight: 18,
  },
});

// Row styles (shared between message and request rows)
const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    width: 3,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    padding: 10,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
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
  },
  text: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
    fontFamily: 'DM Sans',
  },
  sub: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 12,
    marginRight: 10,
    flexShrink: 0,
  },
  supplyChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  supplyEmoji: {
    fontSize: 14,
  },
  peopleText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
  },
});

// Expanded detail styles
const exp = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
    color: colors.text,
    fontFamily: 'DM Sans',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  stat: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'DM Sans',
  },
  notes: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'DM Sans',
    lineHeight: 16,
  },
  mono: {
    fontSize: 10,
    color: colors.text,
    fontFamily: 'DM Mono',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  timelineLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 5,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineDotDone: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },
  timelineDotReceived: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  timelineLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: 'DM Sans',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timelineLabelDone: {
    color: colors.text,
  },
  timelineLabelReceived: {
    color: colors.green,
  },
  timelineSub: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: 'DM Mono',
  },
});
