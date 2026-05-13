import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVerknuepfungen } from '@/lib/enrich';
import type { EnrichedVerknuepfungen } from '@/types/enriched';
import type { Eintraege } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EintraegeDialog } from '@/components/dialogs/EintraegeDialog';
import { VerknuepfungenDialog } from '@/components/dialogs/VerknuepfungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconPlus, IconPencil, IconTrash, IconLink, IconAlertCircle,
  IconCheck, IconClock, IconCircleDot, IconRefresh, IconTool,
  IconCalendar, IconFileText, IconChevronRight,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a0452d6524c751685429b37';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  offen: {
    label: 'Offen',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <IconCircleDot size={12} />,
  },
  in_bearbeitung: {
    label: 'In Bearbeitung',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <IconClock size={12} />,
  },
  abgeschlossen: {
    label: 'Abgeschlossen',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <IconCheck size={12} />,
  },
};

export default function DashboardOverview() {
  const {
    eintraege, verknuepfungen,
    eintraegeMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedVerknuepfungen = enrichVerknuepfungen(verknuepfungen, { eintraegeMap });

  const [selectedEintrag, setSelectedEintrag] = useState<Eintraege | null>(null);
  const [eintragDialogOpen, setEintragDialogOpen] = useState(false);
  const [editEintrag, setEditEintrag] = useState<Eintraege | null>(null);
  const [deleteEintragTarget, setDeleteEintragTarget] = useState<Eintraege | null>(null);

  const [verknuepfungDialogOpen, setVerknuepfungDialogOpen] = useState(false);
  const [editVerknuepfung, setEditVerknuepfung] = useState<EnrichedVerknuepfungen | null>(null);
  const [deleteVerknuepfungTarget, setDeleteVerknuepfungTarget] = useState<EnrichedVerknuepfungen | null>(null);

  const verknuepfungenForSelected = useMemo(() => {
    if (!selectedEintrag) return [];
    return enrichedVerknuepfungen.filter(v => {
      const url = v.fields.eintrag_referenz;
      return typeof url === 'string' && url.includes(selectedEintrag.record_id);
    });
  }, [selectedEintrag, enrichedVerknuepfungen]);

  const stats = useMemo(() => {
    const total = eintraege.length;
    const offen = verknuepfungen.filter(v => v.fields.status?.key === 'offen').length;
    const inBearbeitung = verknuepfungen.filter(v => v.fields.status?.key === 'in_bearbeitung').length;
    const abgeschlossen = verknuepfungen.filter(v => v.fields.status?.key === 'abgeschlossen').length;
    return { total, offen, inBearbeitung, abgeschlossen };
  }, [eintraege, verknuepfungen]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreateEintrag = async (fields: Eintraege['fields']) => {
    await LivingAppsService.createEintraegeEntry(fields);
    fetchAll();
  };

  const handleUpdateEintrag = async (fields: Eintraege['fields']) => {
    if (!editEintrag) return;
    await LivingAppsService.updateEintraegeEntry(editEintrag.record_id, fields);
    fetchAll();
    if (selectedEintrag?.record_id === editEintrag.record_id) {
      setSelectedEintrag({ ...editEintrag, fields });
    }
  };

  const handleDeleteEintrag = async () => {
    if (!deleteEintragTarget) return;
    await LivingAppsService.deleteEintraegeEntry(deleteEintragTarget.record_id);
    if (selectedEintrag?.record_id === deleteEintragTarget.record_id) setSelectedEintrag(null);
    fetchAll();
    setDeleteEintragTarget(null);
  };

  const handleCreateVerknuepfung = async (fields: EnrichedVerknuepfungen['fields']) => {
    await LivingAppsService.createVerknuepfungenEntry(fields);
    fetchAll();
  };

  const handleUpdateVerknuepfung = async (fields: EnrichedVerknuepfungen['fields']) => {
    if (!editVerknuepfung) return;
    await LivingAppsService.updateVerknuepfungenEntry(editVerknuepfung.record_id, fields);
    fetchAll();
  };

  const handleDeleteVerknuepfung = async () => {
    if (!deleteVerknuepfungTarget) return;
    await LivingAppsService.deleteVerknuepfungenEntry(deleteVerknuepfungTarget.record_id);
    fetchAll();
    setDeleteVerknuepfungTarget(null);
  };

  const statusOpts = LOOKUP_OPTIONS['verknuepfungen']?.['status'] ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Einträge gesamt"
          value={String(stats.total)}
          description="Alle Einträge"
          icon={<IconFileText size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Offen"
          value={String(stats.offen)}
          description="Verknüpfungen"
          icon={<IconCircleDot size={18} className="text-amber-500" />}
        />
        <StatCard
          title="In Bearbeitung"
          value={String(stats.inBearbeitung)}
          description="Verknüpfungen"
          icon={<IconClock size={18} className="text-blue-500" />}
        />
        <StatCard
          title="Abgeschlossen"
          value={String(stats.abgeschlossen)}
          description="Verknüpfungen"
          icon={<IconCheck size={18} className="text-green-500" />}
        />
      </div>

      {/* Main workspace: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Einträge Liste */}
        <div className="rounded-[20px] bg-card shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <IconFileText size={18} className="text-primary shrink-0" />
              <h2 className="font-semibold text-base">Einträge</h2>
              <Badge variant="secondary" className="text-xs">{eintraege.length}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => { setEditEintrag(null); setEintragDialogOpen(true); }}
              className="gap-1 shrink-0"
            >
              <IconPlus size={14} />
              <span className="hidden sm:inline">Neu</span>
            </Button>
          </div>

          {eintraege.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <IconFileText size={40} stroke={1.5} />
              <p className="text-sm">Noch keine Einträge vorhanden</p>
              <Button variant="outline" size="sm" onClick={() => { setEditEintrag(null); setEintragDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1" />Ersten Eintrag anlegen
              </Button>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[520px]">
              {eintraege.map(eintrag => {
                const isSelected = selectedEintrag?.record_id === eintrag.record_id;
                const linkCount = enrichedVerknuepfungen.filter(v =>
                  typeof v.fields.eintrag_referenz === 'string' && v.fields.eintrag_referenz.includes(eintrag.record_id)
                ).length;
                return (
                  <div
                    key={eintrag.record_id}
                    onClick={() => setSelectedEintrag(isSelected ? null : eintrag)}
                    className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors border-b border-border last:border-b-0 group ${
                      isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {eintrag.fields.titel ?? '(Kein Titel)'}
                        </span>
                        {linkCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <IconLink size={11} />
                            {linkCount}
                          </span>
                        )}
                      </div>
                      {eintrag.fields.datum && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <IconCalendar size={11} />
                          {formatDate(eintrag.fields.datum)}
                        </div>
                      )}
                      {eintrag.fields.beschreibung && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {eintrag.fields.beschreibung}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        onClick={e => { e.stopPropagation(); setEditEintrag(eintrag); setEintragDialogOpen(true); }}
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} className="text-muted-foreground" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        onClick={e => { e.stopPropagation(); setDeleteEintragTarget(eintrag); }}
                        title="Löschen"
                      >
                        <IconTrash size={14} className="text-destructive" />
                      </button>
                      <IconChevronRight
                        size={14}
                        className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90 text-primary' : ''}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Verknüpfungen Detail */}
        <div className="rounded-[20px] bg-card shadow-sm border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <IconLink size={18} className="text-primary shrink-0" />
              <h2 className="font-semibold text-base truncate">
                {selectedEintrag
                  ? (selectedEintrag.fields.titel ?? 'Eintrag')
                  : 'Verknüpfungen'}
              </h2>
              {selectedEintrag && (
                <Badge variant="secondary" className="text-xs shrink-0">{verknuepfungenForSelected.length}</Badge>
              )}
            </div>
            {selectedEintrag && (
              <Button
                size="sm"
                onClick={() => { setEditVerknuepfung(null); setVerknuepfungDialogOpen(true); }}
                className="gap-1 shrink-0"
              >
                <IconPlus size={14} />
                <span className="hidden sm:inline">Neu</span>
              </Button>
            )}
          </div>

          {!selectedEintrag ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <IconLink size={40} stroke={1.5} />
              <p className="text-sm text-center px-6">Wähle einen Eintrag aus, um die zugehörigen Verknüpfungen zu sehen</p>
            </div>
          ) : verknuepfungenForSelected.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <IconLink size={40} stroke={1.5} />
              <p className="text-sm">Noch keine Verknüpfungen</p>
              <Button variant="outline" size="sm" onClick={() => { setEditVerknuepfung(null); setVerknuepfungDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1" />Verknüpfung anlegen
              </Button>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[520px]">
              {verknuepfungenForSelected.map(v => {
                const statusKey = v.fields.status?.key ?? '';
                const statusCfg = STATUS_CONFIG[statusKey];
                return (
                  <div
                    key={v.record_id}
                    className="flex items-start gap-3 px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {statusCfg && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mb-2 ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      )}
                      {!statusCfg && v.fields.status && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted border mb-2">
                          {v.fields.status.label}
                        </span>
                      )}
                      {v.fields.notizen ? (
                        <p className="text-sm text-foreground line-clamp-3">{v.fields.notizen}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Keine Notizen</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => { setEditVerknuepfung(v); setVerknuepfungDialogOpen(true); }}
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} className="text-muted-foreground" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        onClick={() => setDeleteVerknuepfungTarget(v)}
                        title="Löschen"
                      >
                        <IconTrash size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All verknuepfungen summary if nothing selected */}
          {!selectedEintrag && verknuepfungen.length > 0 && (
            <div className="px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Alle Verknüpfungen nach Status</p>
              <div className="space-y-2">
                {statusOpts.map(opt => {
                  const count = verknuepfungen.filter(v => v.fields.status?.key === opt.key).length;
                  const cfg = STATUS_CONFIG[opt.key];
                  return (
                    <div key={opt.key} className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg?.color ?? 'bg-muted'}`}>
                        {cfg?.icon}
                        {opt.label}
                      </span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">Gesamt</span>
                  <span className="text-sm font-semibold">{verknuepfungen.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EintraegeDialog
        open={eintragDialogOpen}
        onClose={() => { setEintragDialogOpen(false); setEditEintrag(null); }}
        onSubmit={editEintrag ? handleUpdateEintrag : handleCreateEintrag}
        defaultValues={editEintrag?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Eintraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Eintraege']}
      />

      <VerknuepfungenDialog
        open={verknuepfungDialogOpen}
        onClose={() => { setVerknuepfungDialogOpen(false); setEditVerknuepfung(null); }}
        onSubmit={editVerknuepfung ? handleUpdateVerknuepfung : handleCreateVerknuepfung}
        defaultValues={
          editVerknuepfung
            ? editVerknuepfung.fields
            : selectedEintrag
              ? { eintrag_referenz: createRecordUrl(APP_IDS.EINTRAEGE, selectedEintrag.record_id) }
              : undefined
        }
        eintraegeList={eintraege}
        enablePhotoScan={AI_PHOTO_SCAN['Verknuepfungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Verknuepfungen']}
      />

      <ConfirmDialog
        open={!!deleteEintragTarget}
        title="Eintrag löschen"
        description={`Soll "${deleteEintragTarget?.fields.titel ?? 'dieser Eintrag'}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteEintrag}
        onClose={() => setDeleteEintragTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteVerknuepfungTarget}
        title="Verknüpfung löschen"
        description="Soll diese Verknüpfung wirklich gelöscht werden?"
        onConfirm={handleDeleteVerknuepfung}
        onClose={() => setDeleteVerknuepfungTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-[20px]" />
        <Skeleton className="h-80 rounded-[20px]" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
