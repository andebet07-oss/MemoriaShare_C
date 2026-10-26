import memoriaService from '@/components/memoriaService';
import { toast } from '@/components/ui/use-toast';
import { reportError } from '@/lib/sentry';
import { printJob } from '@/lib/magnetPrint';

/** Operator-facing failure messages for the print station. */
export const STATION_ERRORS = {
  popupBlocked:     'הדפדפן חסם את חלון ההדפסה — אפשרו חלונות קופצים ונסו שוב.',
  printFailed:      'ההדפסה נכשלה — הסטטוס לא שונה. נסו שוב.',
  statusAfterPrint: 'ההדפסה נשלחה אך עדכון הסטטוס נכשל — אל תדפיסו שוב, רעננו את הרשימה.',
  statusFailed:     'עדכון הסטטוס נכשל — הסטטוס לא שונה. נסו שוב.',
  copiesFailed:     'שינוי מספר העותקים נכשל — הערך לא נשמר.',
  bulkFailed:       'סימון כמוכן נכשל עבור חלק מהבקשות — הרשימה רועננה.',
};

/** Report to Sentry and show the operator a destructive toast. */
export function stationError(key, err, extra = {}) {
  reportError(`printStation.${key}`, err, extra);
  toast({ description: STATION_ERRORS[key], variant: 'destructive', duration: 6000 });
}

// Jobs with a print in progress — shared by the card buttons and keyboard
// fast-print, so a double press can never print the same job twice.
const inFlight = new Set();

/**
 * Print a job and, when `advance` is set, move it pending → printing.
 * Any print failure leaves the status untouched. Returns the updated job when
 * the status changed, otherwise null (failures have already been toasted).
 */
export async function printAndAdvance({ job, event, copies, advance = true }) {
  if (!job || inFlight.has(job.id)) return null;
  inFlight.add(job.id);
  try {
    try {
      await printJob({ job, event, copies });
    } catch (err) {
      stationError(err?.message === 'POPUP_BLOCKED' ? 'popupBlocked' : 'printFailed', err, { jobId: job.id });
      return null;
    }
    if (!advance) return null;
    try {
      return await memoriaService.printJobs.updateStatus(job.id, 'printing');
    } catch (err) {
      stationError('statusAfterPrint', err, { jobId: job.id });
      return null;
    }
  } finally {
    inFlight.delete(job.id);
  }
}

/** Set a job's status; on failure the status is unchanged and the operator is told. */
export async function setJobStatus(job, status) {
  try {
    return await memoriaService.printJobs.updateStatus(job.id, status);
  } catch (err) {
    stationError('statusFailed', err, { jobId: job.id, status });
    return null;
  }
}
