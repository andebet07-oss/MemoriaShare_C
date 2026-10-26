import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/components/memoriaService', () => ({
  default: { frameMeta: { getById: vi.fn() } },
}));
vi.mock('@/lib/compositePngFrame', () => ({ loadImage: vi.fn() }));
vi.mock('@/lib/detectHoleBbox', () => ({ detectHoleBbox: vi.fn() }));

import memoriaService from '@/components/memoriaService';
import { loadImage } from '@/lib/compositePngFrame';
import { detectHoleBbox } from '@/lib/detectHoleBbox';
import { resolveEventFrame } from '@/lib/framesUtils';

// Each test uses a unique URL/name: resolveEventFrame caches per event frame.
let n = 0;
const customUrl = () => `https://x.supabase.co/storage/v1/object/public/photos/overlays/e${++n}/frame.png`;

describe('resolveEventFrame', () => {
  beforeEach(() => vi.clearAllMocks());

  it('turns an uploaded custom frame into a PNG descriptor with the detected hole', async () => {
    loadImage.mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 });
    detectHoleBbox.mockResolvedValue({ bbox: { x: 0.1, y: 0.1, w: 0.8, h: 0.6 }, confidence: 1 });
    const url = customUrl();

    const frame = await resolveEventFrame({ overlay_frame_url: url, name: 'A' });

    expect(frame).toEqual({
      id: 'custom', isPng: true, image_url: url,
      hole_bbox: { x: 0.1, y: 0.1, w: 0.8, h: 0.6 },
      text_config: null, aspect: 'portrait',
    });
    expect(memoriaService.frameMeta.getById).not.toHaveBeenCalled();
  });

  it('uses the full canvas when the custom PNG has no transparent hole', async () => {
    loadImage.mockResolvedValue({ naturalWidth: 1200, naturalHeight: 800 });
    detectHoleBbox.mockResolvedValue({ bbox: null, confidence: 0 });

    const frame = await resolveEventFrame({ overlay_frame_url: customUrl(), name: 'B' });

    expect(frame.hole_bbox).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(frame.aspect).toBe('landscape');
  });

  it('falls back to the full canvas when hole detection throws (e.g. tainted canvas)', async () => {
    loadImage.mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 });
    detectHoleBbox.mockRejectedValue(new Error('SecurityError'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const frame = await resolveEventFrame({ overlay_frame_url: customUrl(), name: 'C' });

    expect(frame.hole_bbox).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it('resolves a frames_meta id through the approved-frame DB lookup', async () => {
    memoriaService.frameMeta.getById.mockResolvedValue({
      status: 'approved', image_url: 'https://cdn/f.png', hole_bbox: { x: 0, y: 0, w: 1, h: 0.8 }, aspect: 'portrait',
    });

    const frame = await resolveEventFrame({ overlay_frame_url: 'wedding-classic-1', name: 'D' });

    expect(memoriaService.frameMeta.getById).toHaveBeenCalledWith('wedding-classic-1');
    expect(frame).toMatchObject({ id: 'wedding-classic-1', isPng: true, image_url: 'https://cdn/f.png' });
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('returns null when no frame is assigned and the name pack is empty', async () => {
    expect(await resolveEventFrame({ overlay_frame_url: null, name: 'E' })).toBeNull();
  });

  it('resolves each event frame once, so camera, review and print share one result', async () => {
    loadImage.mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 });
    detectHoleBbox.mockResolvedValue({ bbox: null, confidence: 0 });
    const event = { overlay_frame_url: customUrl(), name: 'F' };

    const [a, b] = await Promise.all([resolveEventFrame(event), resolveEventFrame(event)]);

    expect(a).toBe(b);
    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed load — the next call retries', async () => {
    const event = { overlay_frame_url: customUrl(), name: 'G' };
    loadImage.mockRejectedValueOnce(new Error('Frame load failed'));
    await expect(resolveEventFrame(event)).rejects.toThrow('Frame load failed');

    loadImage.mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 });
    detectHoleBbox.mockResolvedValue({ bbox: null, confidence: 0 });
    await expect(resolveEventFrame(event)).resolves.toMatchObject({ isPng: true });
    expect(loadImage).toHaveBeenCalledTimes(2);
  });
});
