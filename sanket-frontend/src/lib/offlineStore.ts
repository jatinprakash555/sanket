import Dexie, { Table } from 'dexie';

export interface GroundReport {
  id?: number;
  district_id: string;
  village: string;
  worker_name: string;
  symptom: string;
  cases: number;
  severity: string;
  notes?: string;
  synced: number; // 0 = offline queued, 1 = synced
  timestamp: string;
}

export class SanketDexieDB extends Dexie {
  groundReports!: Table<GroundReport, number>;

  constructor() {
    super('SanketOfflineDB');
    this.version(1).stores({
      groundReports: '++id, district_id, village, symptom, cases, synced, timestamp'
    });
  }
}

export const db = new SanketDexieDB();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Global simulated offline flag for presentation demo on stage
let simulatedOffline = false;

export function setSimulatedOffline(status: boolean) {
  simulatedOffline = status;
}

export function isOffline(): boolean {
  if (simulatedOffline) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return false;
}

export async function submitReport(report: Omit<GroundReport, 'id' | 'synced' | 'timestamp'>) {
  const timestamp = new Date().toISOString();
  
  if (isOffline()) {
    // Store in IndexedDB if offline
    const id = await db.groundReports.add({
      ...report,
      synced: 0,
      timestamp
    });
    return {
      status: 'queued_offline',
      reportId: id,
      message: 'Network unreachable. Report safely stored in local IndexedDB queue.'
    };
  } else {
    // Post directly to FastAPI endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, timestamp })
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      
      // Also cache in local DB as synced for historical review
      await db.groundReports.add({
        ...report,
        synced: 1,
        timestamp
      });
      return { status: 'synced_live', data };
    } catch (err) {
      console.warn('Network call failed, falling back to local queue:', err);
      // Automatic fallback to offline storage on network exception
      const id = await db.groundReports.add({
        ...report,
        synced: 0,
        timestamp
      });
      return {
        status: 'queued_offline',
        reportId: id,
        message: 'Direct API connection failed. Queued in local IndexedDB.'
      };
    }
  }
}

// Background sync on reconnect
export async function syncOfflineReports(): Promise<{ syncedCount: number; errors: number }> {
  try {
    const offlineReports = await db.groundReports.where('synced').equals(0).toArray();
    if (offlineReports.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    const payload = {
      reports: offlineReports.map(r => ({
        district_id: r.district_id,
        village: r.village,
        worker_name: r.worker_name,
        symptom: r.symptom,
        cases: r.cases,
        severity: r.severity,
        notes: r.notes || '',
        timestamp: r.timestamp
      }))
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/reports/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      for (const report of offlineReports) {
        if (report.id) {
          await db.groundReports.update(report.id, { synced: 1 });
        }
      }
      return { syncedCount: offlineReports.length, errors: 0 };
    } else {
      return { syncedCount: 0, errors: offlineReports.length };
    }
  } catch (err) {
    console.error('Offline sync failed:', err);
    return { syncedCount: 0, errors: 1 };
  }
}

// Register browser online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[SANKET PWA] Reconnected to network. Syncing offline reports...');
    await syncOfflineReports();
  });
}
