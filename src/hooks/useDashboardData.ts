import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Eintraege, Verknuepfungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [eintraege, setEintraege] = useState<Eintraege[]>([]);
  const [verknuepfungen, setVerknuepfungen] = useState<Verknuepfungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [eintraegeData, verknuepfungenData] = await Promise.all([
        LivingAppsService.getEintraege(),
        LivingAppsService.getVerknuepfungen(),
      ]);
      setEintraege(eintraegeData);
      setVerknuepfungen(verknuepfungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [eintraegeData, verknuepfungenData] = await Promise.all([
          LivingAppsService.getEintraege(),
          LivingAppsService.getVerknuepfungen(),
        ]);
        setEintraege(eintraegeData);
        setVerknuepfungen(verknuepfungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const eintraegeMap = useMemo(() => {
    const m = new Map<string, Eintraege>();
    eintraege.forEach(r => m.set(r.record_id, r));
    return m;
  }, [eintraege]);

  return { eintraege, setEintraege, verknuepfungen, setVerknuepfungen, loading, error, fetchAll, eintraegeMap };
}