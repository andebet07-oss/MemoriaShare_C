import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/polaroid/renderPolaroid', () => ({
  jobRenderSpec: vi.fn((job) => (job.render_snapshot
    ? { templateId: job.render_snapshot.templateId, options: {}, name: 'snap', date: 'd' }
    : { templateId: 'C', options: {}, name: 'event', date: 'd' })),
  renderComposite: vi.fn(async () => ({ id: 'rerendered' })),
  loadImage: vi.fn(async (src) => ({ src })),
}));
vi.mock('@/lib/printImage', () => ({ printImage: vi.fn() }));

import { renderComposite, loadImage, jobRenderSpec } from '@/lib/polaroid/renderPolaroid';
import { printImage } from '@/lib/printImage';
import { printJob, cropOrientation, imageOrientation } from '@/lib/magnetPrint';

const event = { name: 'Sarah & Daniel', template_id: 'C' };
const job = { id: 'j1', crop_config: null, raw_photo_url: 'https://x/raw.jpg', photos: { file_url: 'https://x/stored.jpg' } };

describe('printJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prints the stored composite as is when the operator did not re-crop', async () => {
    await printJob({ job, event, copies: 1 });
    expect(renderComposite).not.toHaveBeenCalled();
    expect(loadImage).toHaveBeenCalledWith('https://x/stored.jpg');
    expect(printImage).toHaveBeenCalledWith({ src: 'https://x/stored.jpg' }, 1);
  });

  it('re-renders from the raw photo + crop with the event template after a re-crop', async () => {
    const crop = { orientation: 'landscape', panX: 0.4, panY: 0.5, zoom: 1.5 };
    await printJob({ job: { ...job, crop_config: crop }, event, copies: 3 });
    expect(loadImage).toHaveBeenCalledWith('https://x/raw.jpg');
    expect(renderComposite).toHaveBeenCalledWith(expect.objectContaining({
      templateId: 'C', orientation: 'landscape', crop, photo: { src: 'https://x/raw.jpg' },
    }));
    expect(printImage).toHaveBeenCalledWith({ id: 'rerendered' }, 3);
  });

  it('re-renders a re-crop from the job\'s render snapshot, not the event\'s current template', async () => {
    const crop = { orientation: 'portrait', panX: 0.5, panY: 0.5, zoom: 1 };
    const snapJob = { ...job, crop_config: crop, render_snapshot: { v: 1, templateId: 'F', options: {}, name: 'n', date: 'd' } };
    await printJob({ job: snapJob, event, copies: 1 });
    expect(jobRenderSpec).toHaveBeenCalledWith(snapJob, event);
    expect(renderComposite).toHaveBeenCalledWith(expect.objectContaining({ templateId: 'F', name: 'snap' }));
  });

  it('prints the stored composite when a crop exists but the raw photo does not', async () => {
    await printJob({ job: { ...job, raw_photo_url: null, crop_config: { orientation: 'portrait' } }, event });
    expect(renderComposite).not.toHaveBeenCalled();
    expect(printImage).toHaveBeenCalledWith({ src: 'https://x/stored.jpg' }, 1);
  });
});

describe('orientation helpers', () => {
  it('reads the crop orientation, including the legacy aspect shape', () => {
    expect(cropOrientation({ orientation: 'landscape' })).toBe('landscape');
    expect(cropOrientation({ aspect: '4:3' })).toBe('landscape');
    expect(cropOrientation({ aspect: '3:4' })).toBe('portrait');
    expect(cropOrientation(null)).toBeNull();
  });

  it('derives a composite\'s orientation from its size', () => {
    expect(imageOrientation({ naturalWidth: 1200, naturalHeight: 900 })).toBe('landscape');
    expect(imageOrientation({ naturalWidth: 900, naturalHeight: 1200 })).toBe('portrait');
  });
});
