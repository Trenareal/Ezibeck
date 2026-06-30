import { safeStorage } from '../utils/safeStorage';
import { supabase } from './supabase';

const QUEUE_KEY = 'offline_sync_queue';

export interface SyncOperation {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  data: any;
  timestamp: number;
}

export const syncService = {
  async enqueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    queue.push({
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    });
    safeStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[SyncService] Operation enqueued:', operation.action, operation.table);
  },

  getQueue(): SyncOperation[] {
    const raw = safeStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async processQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncService] Processing ${queue.length} operations...`);

    const remaining: SyncOperation[] = [];
    for (const op of queue) {
      try {
        let query = supabase.from(op.table);
        if (op.action === 'upsert') {
          await query.upsert(op.data);
        } else if (op.action === 'delete') {
          await query.delete().eq('id', op.data.id);
        }
        console.log(`[SyncService] Successfully synced: ${op.action} ${op.table}`);
      } catch (error) {
        console.error(`[SyncService] Failed to sync ${op.action} ${op.table}:`, error);
        remaining.push(op);
      }
    }

    safeStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }
};
