import { EventEmitter } from 'events';

interface PhoneSessionStatus {
  connected: boolean;
  deviceName: string;
  lastSeen: number;
}

const globalForScanner = globalThis as unknown as {
  scannerEmitter?: EventEmitter;
  scannerSessions?: Map<string, PhoneSessionStatus>;
  mobileSalesQueue?: any[];
};

export const scannerEmitter = globalForScanner.scannerEmitter || new EventEmitter();
scannerEmitter.setMaxListeners(100);
globalForScanner.scannerEmitter = scannerEmitter;

export const scannerSessions = globalForScanner.scannerSessions || new Map<string, PhoneSessionStatus>();
globalForScanner.scannerSessions = scannerSessions;

if (!globalForScanner.mobileSalesQueue) {
  globalForScanner.mobileSalesQueue = [];
}
export const mobileSalesQueue = globalForScanner.mobileSalesQueue;

