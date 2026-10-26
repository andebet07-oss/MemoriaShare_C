import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/components/memoriaService', () => ({
  default: { printJobs: { updateStatus: vi.fn() } },
}));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/sentry', () => ({ reportError: vi.fn() }));
vi.mock('@/lib/magnetPrint', () => ({ printJob: vi.fn() }));

import memoriaService from '@/components/memoriaService';
import { toast } from '@/components/ui/use-toast';
import { printJob } from '@/lib/magnetPrint';
import { printAndAdvance, setJobStatus, STATION_ERRORS } from '@/lib/printStation';

const job = { id: 'j1', status: 'pending', copies: 1 };
const event = { id: 'e1' };
const toasted = () => toast.mock.calls.map(([arg]) => arg.description);

describe('printAndAdvance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('advances pending → printing after a successful print', async () => {
    printJob.mockResolvedValue();
    memoriaService.printJobs.updateStatus.mockResolvedValue({ ...job, status: 'printing' });

    const updated = await printAndAdvance({ job, event, copies: 1 });

    expect(printJob).toHaveBeenCalledWith({ job, event, copies: 1 });
    expect(memoriaService.printJobs.updateStatus).toHaveBeenCalledWith('j1', 'printing');
    expect(updated.status).toBe('printing');
    expect(toast).not.toHaveBeenCalled();
  });

  it('leaves the status unchanged and toasts when the print fails', async () => {
    printJob.mockRejectedValue(new Error('image load failed'));

    expect(await printAndAdvance({ job, event, copies: 1 })).toBeNull();
    expect(memoriaService.printJobs.updateStatus).not.toHaveBeenCalled();
    expect(toasted()).toEqual([STATION_ERRORS.printFailed]);
  });

  it('toasts the pop-up hint when the print window is blocked', async () => {
    printJob.mockRejectedValue(new Error('POPUP_BLOCKED'));

    expect(await printAndAdvance({ job, event, copies: 1 })).toBeNull();
    expect(memoriaService.printJobs.updateStatus).not.toHaveBeenCalled();
    expect(toasted()).toEqual([STATION_ERRORS.popupBlocked]);
  });

  it('warns not to reprint when the print went out but the status update failed', async () => {
    printJob.mockResolvedValue();
    memoriaService.printJobs.updateStatus.mockRejectedValue(new Error('network'));

    expect(await printAndAdvance({ job, event, copies: 1 })).toBeNull();
    expect(toasted()).toEqual([STATION_ERRORS.statusAfterPrint]);
  });

  it('reprints without touching the status when advance is false', async () => {
    printJob.mockResolvedValue();

    expect(await printAndAdvance({ job, event, copies: 2, advance: false })).toBeNull();
    expect(printJob).toHaveBeenCalledWith({ job, event, copies: 2 });
    expect(memoriaService.printJobs.updateStatus).not.toHaveBeenCalled();
  });

  it('prints a job only once when triggered twice concurrently (double Space)', async () => {
    let release;
    printJob.mockImplementation(() => new Promise((r) => { release = r; }));
    memoriaService.printJobs.updateStatus.mockResolvedValue({ ...job, status: 'printing' });

    const first = printAndAdvance({ job, event, copies: 1 });
    const second = await printAndAdvance({ job, event, copies: 1 });
    release();
    await first;

    expect(second).toBeNull();
    expect(printJob).toHaveBeenCalledTimes(1);
  });
});

describe('setJobStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null and toasts when the update fails', async () => {
    memoriaService.printJobs.updateStatus.mockRejectedValue(new Error('RLS'));

    expect(await setJobStatus(job, 'ready')).toBeNull();
    expect(toasted()).toEqual([STATION_ERRORS.statusFailed]);
  });
});
