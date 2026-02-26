/**
 * BLE Service — manages connection to MeshSOS LoRa node.
 *
 * DEV_MOCK=true simulates a connected node so the full UI can be developed
 * and tested on the iOS simulator (which has no real Bluetooth).
 * Set DEV_MOCK=false when testing on a real device with actual hardware.
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import { useBLEStore } from '@/store/bleStore';
import { useRequestStore } from '@/store/requestStore';
import {
  MESHSOS_SERVICE_UUID,
  CHARACTERISTICS,
  SCAN_TIMEOUT_MS,
  RSSI_POLL_INTERVAL_MS,
} from '@/constants/ble';
import { NetworkStatus, NodeInfo, RequestAck, SupplyRequest } from '@/types';
import { useMessageStore } from '@/store/messageStore';

// ─── Mock data for simulator / development ───────────────────────────────────
const DEV_MOCK = true; // flip to false for real hardware

const MOCK_NODE: NodeInfo = {
  deviceId: 'mock-device-001',
  nodeId: 'A2F4',
  firmwareVersion: '1.0.0-mock',
};

function buildMockNetwork(baseLat: number, baseLon: number): NetworkStatus {
  const now = Date.now();
  return {
    rssi: -71,
    hopCount: 3,
    gatewayReachable: true,
    totalDistanceKm: 4.1,
    hopChain: ['you', 'B91C', 'D7E2', 'GW-01'],
    nodes: [
      { nodeId: 'B91C', status: 'online',  rssi: -68,  hopCount: 1, distanceKm: 0.8, mapX: 0.72, mapY: 0.30, latitude: baseLat + 0.003, longitude: baseLon + 0.005, lastSeenAt: now },
      { nodeId: 'C44D', status: 'weak',    rssi: -84,  hopCount: 1, distanceKm: 1.3, mapX: 0.25, mapY: 0.33, latitude: baseLat - 0.004, longitude: baseLon - 0.003, lastSeenAt: now - 8 * 60 * 1000 },
      { nodeId: 'D7E2', status: 'online',  rssi: -76,  hopCount: 2, distanceKm: 2.4, mapX: 0.75, mapY: 0.67, latitude: baseLat + 0.006, longitude: baseLon + 0.008, lastSeenAt: now - 3 * 60 * 1000 },
      { nodeId: 'F5A1', status: 'offline', rssi: -115, hopCount: 1, distanceKm: 2.1, mapX: 0.25, mapY: 0.73, latitude: baseLat - 0.007, longitude: baseLon - 0.006, lastSeenAt: now - 31 * 60 * 1000 },
      { nodeId: 'GW-01', status: 'gateway', rssi: -82, hopCount: 3, distanceKm: 4.1, mapX: 0.88, mapY: 0.18, latitude: baseLat + 0.010, longitude: baseLon + 0.015, lastSeenAt: now - 5 * 60 * 1000 },
    ],
    links: [
      { fromNodeId: 'you', toNodeId: 'B91C', rssi: -68 },
      { fromNodeId: 'you', toNodeId: 'C44D', rssi: -84 },
      { fromNodeId: 'you', toNodeId: 'D7E2', rssi: -76 },
      { fromNodeId: 'you', toNodeId: 'F5A1', rssi: -115 },
      { fromNodeId: 'B91C', toNodeId: 'GW-01', rssi: -72 },
      { fromNodeId: 'D7E2', toNodeId: 'GW-01', rssi: -80 },
    ],
  };
}

// ─── BLE Service class ────────────────────────────────────────────────────────

class BLEService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private rssiTimer: ReturnType<typeof setInterval> | null = null;
  private mockRssiTimer: ReturnType<typeof setInterval> | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  initialize() {
    if (DEV_MOCK) return; // no-op in mock mode
    if (Platform.OS === 'web') return;
    this.manager = new BleManager();
  }

  destroy() {
    this.stopScan();
    this.clearTimers();
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }

  // ─── Scanning ──────────────────────────────────────────────────────────────

  async startScan() {
    const { setConnectionState, setScanError, setConnectedNode, setNetwork } = useBLEStore.getState();

    if (DEV_MOCK) {
      setConnectionState('scanning');
      setScanError(null);
      await new Promise((r) => setTimeout(r, 2000)); // simulate scan delay

      // Get real GPS to place mock nodes relative to user's actual location
      let baseLat = 37.7749;
      let baseLon = -122.4194;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          baseLat = loc.coords.latitude;
          baseLon = loc.coords.longitude;
        }
      } catch {}

      setConnectionState('connected');
      setConnectedNode(MOCK_NODE);
      setNetwork(buildMockNetwork(baseLat, baseLon));
      this.startMockRssiPoll();
      this.scheduleMockMessages();
      return;
    }

    if (!this.manager) return;
    setConnectionState('scanning');
    setScanError(null);

    this.scanTimer = setTimeout(() => {
      this.stopScan();
      const state = useBLEStore.getState();
      if (state.connectionState === 'scanning') {
        setConnectionState('idle');
        setScanError('No MeshSOS node found nearby. Make sure the device is powered on and within 10m.');
      }
    }, SCAN_TIMEOUT_MS);

    this.manager.startDeviceScan(
      [MESHSOS_SERVICE_UUID],
      { allowDuplicates: false },
      (error: BleError | null, device: Device | null) => {
        if (error) {
          setScanError(error.message);
          setConnectionState('error');
          return;
        }
        if (device) {
          this.stopScan();
          this.connectToDevice(device);
        }
      }
    );
  }

  stopScan() {
    if (this.manager) this.manager.stopDeviceScan();
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  private async connectToDevice(device: Device) {
    const { setConnectionState, setConnectedNode, setNetwork, setScanError } = useBLEStore.getState();

    try {
      setConnectionState('connecting');
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connected;

      // Read node info
      const nodeInfoChar = await connected.readCharacteristicForService(
        MESHSOS_SERVICE_UUID,
        CHARACTERISTICS.NODE_INFO
      );
      const nodeInfo: NodeInfo = JSON.parse(
        Buffer.from(nodeInfoChar.value ?? '', 'base64').toString('utf8')
      );

      // Read initial network status
      const netChar = await connected.readCharacteristicForService(
        MESHSOS_SERVICE_UUID,
        CHARACTERISTICS.NETWORK_STATUS
      );
      const network: NetworkStatus = JSON.parse(
        Buffer.from(netChar.value ?? '', 'base64').toString('utf8')
      );

      setConnectedNode({ ...nodeInfo, deviceId: device.id });
      setNetwork(network);
      setConnectionState('connected');

      // Subscribe to network status updates
      this.subscribeNetworkStatus(connected);
      // Subscribe to request ACKs
      this.subscribeRequestAck(connected);
      // Start RSSI polling
      this.startRssiPoll(connected);
    } catch (err: any) {
      setScanError(err.message ?? 'Failed to connect to node');
      setConnectionState('error');
    }
  }

  private subscribeNetworkStatus(device: Device) {
    device.monitorCharacteristicForService(
      MESHSOS_SERVICE_UUID,
      CHARACTERISTICS.NETWORK_STATUS,
      (err: BleError | null, char: Characteristic | null) => {
        if (err || !char?.value) return;
        const network: NetworkStatus = JSON.parse(
          Buffer.from(char.value, 'base64').toString('utf8')
        );
        useBLEStore.getState().setNetwork(network);
      }
    );
  }

  private subscribeRequestAck(device: Device) {
    device.monitorCharacteristicForService(
      MESHSOS_SERVICE_UUID,
      CHARACTERISTICS.REQUEST_ACK,
      (err: BleError | null, char: Characteristic | null) => {
        if (err || !char?.value) return;
        const ack: RequestAck = JSON.parse(
          Buffer.from(char.value, 'base64').toString('utf8')
        );
        useRequestStore.getState().applyAck(ack);
      }
    );
  }

  private startRssiPoll(device: Device) {
    this.rssiTimer = setInterval(async () => {
      try {
        const updatedDevice = await device.readRSSI();
        const rssi = updatedDevice.rssi ?? 0;
        const current = useBLEStore.getState().network;
        if (current) {
          useBLEStore.getState().setNetwork({ ...current, rssi });
        }
      } catch {
        // device may have disconnected
        this.handleDisconnect();
      }
    }, RSSI_POLL_INTERVAL_MS);
  }

  private scheduleMockMessages() {
    const session = Date.now();
    const { addMessage, setLastSynced, markAllRead } = useMessageStore.getState();

    // Seed historical messages immediately so the activity feed is populated on connect
    const t = session;
    addMessage({ id: `mock-hist-${session}-a`, timestamp: t - 13 * 60 * 1000, fromNodeId: 'GW-01', content: 'Request received. Emergency teams are being coordinated for your area.', type: 'info' });
    addMessage({ id: `mock-hist-${session}-b`, timestamp: t - 9 * 60 * 1000,  fromNodeId: 'GW-01', content: 'Supply drop (water + food rations) is en route to your location. ETA: ~25 minutes.', type: 'action' });
    addMessage({ id: `mock-hist-${session}-c`, timestamp: t - 3 * 60 * 1000,  fromNodeId: 'GW-01', content: 'URGENT: Please move to Oak Street Community Center. Medical assistance and additional supplies are available there.', type: 'urgent' });
    // Mark historical messages as read (they're "already seen")
    markAllRead();
    setLastSynced('B91C', t - 60 * 1000);

    // Schedule new incoming messages during the session (these arrive unread)
    setTimeout(() => {
      addMessage({
        id: `mock-msg-${session}-1`,
        timestamp: Date.now(),
        fromNodeId: 'GW-01',
        content: 'Update: A second supply team has been dispatched. Estimated arrival in 10 minutes.',
        type: 'action',
      });
      setLastSynced('B91C', Date.now());
    }, 20000);
    setTimeout(() => {
      addMessage({
        id: `mock-msg-${session}-2`,
        timestamp: Date.now(),
        fromNodeId: 'GW-01',
        content: 'All clear in your sector. Please confirm you have received supplies.',
        type: 'info',
      });
      setLastSynced('B91C', Date.now());
    }, 40000);
  }

  private startMockRssiPoll() {
    // Simulate gentle RSSI drift for realism in mock mode
    this.mockRssiTimer = setInterval(() => {
      const current = useBLEStore.getState().network;
      if (!current) return;
      const drift = Math.floor(Math.random() * 5) - 2; // -2 to +2 dBm
      const newRssi = Math.max(-95, Math.min(-50, current.rssi + drift));
      useBLEStore.getState().setNetwork({ ...current, rssi: newRssi });
    }, RSSI_POLL_INTERVAL_MS);
  }

  private clearTimers() {
    if (this.rssiTimer) { clearInterval(this.rssiTimer); this.rssiTimer = null; }
    if (this.mockRssiTimer) { clearInterval(this.mockRssiTimer); this.mockRssiTimer = null; }
  }

  private handleDisconnect() {
    this.clearTimers();
    useBLEStore.getState().disconnect();
  }

  // ─── Sending requests ──────────────────────────────────────────────────────

  async sendRequest(request: SupplyRequest): Promise<boolean> {
    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 1000));
      // Simulate ACK after 3s
      setTimeout(() => {
        useRequestStore.getState().applyAck({
          requestId: request.id,
          status: 'relayed',
          relayNodeId: 'B91C',
          timestamp: Date.now(),
        });
      }, 3000);
      setTimeout(() => {
        useRequestStore.getState().applyAck({
          requestId: request.id,
          status: 'received',
          timestamp: Date.now(),
        });
      }, 8000);
      return true;
    }

    if (!this.connectedDevice) return false;

    try {
      const payload = JSON.stringify(request);
      const encoded = Buffer.from(payload, 'utf8').toString('base64');
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        MESHSOS_SERVICE_UUID,
        CHARACTERISTICS.SEND_REQUEST,
        encoded
      );
      return true;
    } catch {
      return false;
    }
  }

  disconnect() {
    if (DEV_MOCK) {
      this.clearTimers();
      useBLEStore.getState().disconnect();
      return;
    }
    this.connectedDevice?.cancelConnection();
    this.handleDisconnect();
  }

  get isConnected(): boolean {
    return useBLEStore.getState().connectionState === 'connected';
  }
}

export const bleService = new BLEService();
