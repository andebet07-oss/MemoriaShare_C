import { X, Clock, Printer, CheckCircle2 } from 'lucide-react';
import StatusBadge from '@/components/system/StatusBadge';
import { Button } from '@/components/ui/button';

const STATUS_ICON = { pending: Clock, printing: Printer, ready: CheckCircle2, rejected: X };

export default function PrintStatusModal({ printJobs, onClose }) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end bg-background/70 backdrop-blur-sm" onClick={onClose} dir="rtl">
      <div
        className="bg-card rounded-t-3xl border-t border-border max-h-[75vh] overflow-hidden flex flex-col max-w-md w-full mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="px-4 pt-3 pb-3 border-b border-border">
          <div className="w-10 h-1 bg-foreground/20 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">הבקשות שלי</h2>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="סגור">
              <X />
            </Button>
          </div>
        </div>

        {/* Job List */}
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
          {printJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-10">אין בקשות הדפסה עדיין.</p>
          ) : (
            printJobs.map((job, i) => {
              const thumbUrl = job.photos?.file_urls?.thumbnail ?? job.photos?.file_url;
              return (
                <div key={job.id} className="flex items-center gap-4 bg-secondary/60 border border-border rounded-2xl p-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                    {thumbUrl
                      ? <img src={thumbUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">#{i + 1}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5">
                    <p className="text-sm text-muted-foreground">צילום <bdi className="tabular-nums">{i + 1}</bdi></p>
                    <StatusBadge status={job.status} icon={STATUS_ICON[job.status] ?? Clock} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 pt-3" style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)` }}>
          <p className="text-muted-foreground text-xs text-center">הסטטוס מתעדכן בזמן אמת</p>
        </div>
      </div>
    </div>
  );
}
