import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/framesUtils', () => ({ resolveEventFrame: vi.fn() }));
vi.mock('@/hooks/useFaceCrop', () => ({ loadImageEl: vi.fn(), applyCrop: vi.fn(), composePreview: vi.fn() }));
vi.mock('@/lib/compositePngFrame', () => ({ canvasToJpegBlob: vi.fn() }));
vi.mock('@/functions/applyOverlayFrame', () => ({ applyOverlayFrame: vi.fn(), printCompositedBlob: vi.fn() }));

import { applyOverlayFrame, printCompositedBlob } from '@/functions/applyOverlayFrame';
import { printJob } from '@/lib/magnetPrint';

const customFrameEvent = {
  name: 'Wedding',
  overlay_frame_url: 'https://x.supabase.co/storage/v1/object/public/photos/overlays/e1/frame.png',
};
const job = { id: 'j1', crop_config: null, raw_photo_url: null, photos: { file_url: 'https://x/stored.jpg' } };

describe('printJob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prints the stored composite without drawing the custom overlay on top again', async () => {
    await printJob({ job, event: customFrameEvent, copies: 1 });

    expect(applyOverlayFrame).toHaveBeenCalledWith('https://x/stored.jpg', null, 1);
    expect(printCompositedBlob).not.toHaveBeenCalled();
  });

  it('passes the operator copies through', async () => {
    await printJob({ job, event: customFrameEvent, copies: 3 });
    expect(applyOverlayFrame).toHaveBeenCalledWith('https://x/stored.jpg', null, 3);
  });
});
