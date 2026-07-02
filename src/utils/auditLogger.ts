import { AuditLogEntry } from '../types';
import { safeStorage } from './safeStorage';

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  const saved = safeStorage.getItem('ezibeck_passcode_audit_logs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing stored audit logs', e);
    }
  }
  return [];
}

export function saveAuditLogs(logs: AuditLogEntry[]) {
  if (typeof window === 'undefined') return;
  safeStorage.setItem('ezibeck_passcode_audit_logs', JSON.stringify(logs));
}

export function logPasscodeEvent(params: {
  studentId: string;
  studentName: string;
  studentClass: string;
  action: 'Created' | 'Manual Reset' | 'Rollover' | 'Self Reset';
  performedBy: string;
  oldPasscode?: string;
  newPasscode: string;
}): AuditLogEntry {
  const logs = getAuditLogs();
  const entry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    studentId: params.studentId,
    studentName: params.studentName,
    studentClass: params.studentClass,
    action: params.action,
    performedBy: params.performedBy,
    oldPasscode: params.oldPasscode,
    newPasscode: params.newPasscode,
  };
  
  // Keep up to 1000 logs for memory performance
  const updatedLogs = [entry, ...logs].slice(0, 1000);
  saveAuditLogs(updatedLogs);

  // Sync with Supabase asynchronously without circular dependency issues at load-time
  import('../lib/supabase').then(({ dbService, isSupabaseConfigured }) => {
    if (isSupabaseConfigured) {
      dbService.saveAuditLog(entry).catch(err => {
        console.warn('[AuditLogger] Failed to sync audit log entry to Supabase:', err);
      });
    }
  }).catch(e => {
    console.debug('[AuditLogger] Supabase not loaded or configured:', e);
  });

  return entry;
}

export function clearAuditLogs() {
  if (typeof window === 'undefined') return;
  safeStorage.removeItem('ezibeck_passcode_audit_logs');

  // Sync deletion with Supabase asynchronously
  import('../lib/supabase').then(({ dbService, isSupabaseConfigured }) => {
    if (isSupabaseConfigured) {
      dbService.clearAuditLogs().catch(err => {
        console.warn('[AuditLogger] Failed to clear audit logs in Supabase:', err);
      });
    }
  }).catch(e => {
    console.debug('[AuditLogger] Supabase not loaded or configured:', e);
  });
}
