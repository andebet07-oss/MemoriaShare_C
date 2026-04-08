import { useState, useEffect, useRef, useCallback } from "react";
import memoriaService from "@/components/memoriaService";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from "react-router-dom";
import confetti from 'canvas-confetti';
import { supabase } from "@/lib/supabase";
import { checkGuestQuota } from "@/functions/checkGuestQuota";
import { requestPhotoDeletion } from "@/functions/requestPhotoDeletion";
import { getMyPhotos } from "@/functions/getMyPhotos";
 
const PHOTOS_PER_PAGE = 30;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const DEVICE_UUID_KEY = 'ms_device_uuid';
 
/** Returns the persisted device UUID for anonymous guests, generating one on first call. */
function getOrCreateDeviceUUID() {
  let uuid = localStorage.getItem(DEVICE_UUID_KEY);
  if (!uuid) {
    uuid = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem(DEVICE_UUID_KEY, uuid);
  }
  return uuid;
}
 
export default function useEventGallery({ propEventCode, isAdminView, adminPhotos, onAdminPhotosChange }) {
  const navigate = useNavigate();
  const { user: currentUser, isLoadingAuth } = useAuth();
 
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('my-photos');
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [userUploadedCount, setUserUploadedCount] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
 
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [isPreparingFiles, setIsPreparingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showPendingGallery, setShowPendingGallery] = useState(false);
  const [processingFilterId, setProcessingFilterId] = useState(null);
  const [selectedPendingIndex, setSelectedPendingIndex] = useState(null);
 
  const [showCamera, setShowCamera] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
 
  const [page, setPage] = useState(1);
  const [sharedPage, setSharedPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sharedHasMore, setSharedHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());

  const fileInputRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
 
  // Tab-aware displayed photos
  const displayedPhotos = isAdminView
    ? (adminPhotos || [])
    : isOwner
      ? photos
      : activeTab === 'my-photos'
        ? myPhotos
        : sharedPhotos;
  const selectedPhoto = selectedIndex !== null ? displayedPhotos[selectedIndex] : null;
 
  // ─── FAB scroll visibility ───────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setShowFAB(window.scrollY > 350);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  // ─── Keyboard navigation ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') handlePrevPhoto();
      if (e.key === 'ArrowLeft') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayedPhotos.length]);
 
  // ─── Touch swipe ──────────────────────────────────────────────────────────
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNextPhoto();
    else if (diff < -50) handlePrevPhoto();
    touchStartX.current = null; touchEndX.current = null;
  };
 
  const handleNextPhoto = (e) => { if (e) e.stopPropagation(); if (selectedIndex < displayedPhotos.length - 1) setSelectedIndex(i => i + 1); };
  const handlePrevPhoto = (e) => { if (e) e.stopPropagation(); if (selectedIndex > 0) setSelectedIndex(i => i - 1); };
 
  // ─── Fetch helpers ────────────────────────────────────────────────────────
  const STABLE_SORT = '-created_date,id';
 
  const fetchMyPhotosFromBackend = useCallback(async (eventId, userId) => {
    if (!userId) return [];
    try {
      const res = await getMyPhotos({ event_id: eventId, user_id: userId });
      return res?.data?.photos || [];
    } catch (err) {
      console.error('fetchMyPhotos failed:', err);
      return [];
    }
  }, []);
 
  const fetchPhotosByPage = useCallback(async (eventId, pageNum, userIsOwner, eventData, userId = currentUser?.id) => {
    try {
      setIsFetchingMore(true);
      let newPhotos = [];
 
      if (userIsOwner) {
        newPhotos = await memoriaService.photos.getByEvent(eventId, {}, STABLE_SORT, {
          limit: PHOTOS_PER_PAGE, offset: (pageNum - 1) * PHOTOS_PER_PAGE
        });
      } else {
        const myAllPhotos = await fetchMyPhotosFromBackend(eventId, userId);
        if (pageNum === 1) setMyPhotos(myAllPhotos);

        // When the host has disabled the public gallery, guests see only their own photos.
        // Skip the shared fetch entirely so no other guest's photos leak through.
        if (!eventData?.auto_publish_guest_photos) {
          if (pageNum === 1) { setSharedPhotos([]); setSharedHasMore(false); }
          newPhotos = myAllPhotos;
        } else {
          const rawApprovedPhotos = await memoriaService.photos.getByEvent(
            eventId, { is_approved: true }, STABLE_SORT,
            { limit: PHOTOS_PER_PAGE, offset: (pageNum - 1) * PHOTOS_PER_PAGE }
          );
          const publicPhotos = rawApprovedPhotos.filter(p => p.is_hidden !== true);
          const myIds = new Set(myAllPhotos.map(p => p.id));
          const sharedCombined = [...myAllPhotos, ...publicPhotos.filter(p => !myIds.has(p.id))];

          if (pageNum === 1) {
            setSharedPhotos(sharedCombined);
            setSharedHasMore(rawApprovedPhotos.length >= PHOTOS_PER_PAGE);
          } else {
            setSharedPhotos(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNew = publicPhotos.filter(p => !existingIds.has(p.id));
              return [...prev, ...uniqueNew];
            });
            if (rawApprovedPhotos.length < PHOTOS_PER_PAGE) setSharedHasMore(false);
          }
          newPhotos = sharedCombined;
        }
      }
 
      if (newPhotos.length < PHOTOS_PER_PAGE) setHasMore(false);
 
      if (pageNum === 1) {
        setPhotos(prev => {
          const fetchedMap = new Map(newPhotos.map(p => [p.id, p]));
          const optimisticPhotos = prev.filter(p => !fetchedMap.has(p.id));
          return [...optimisticPhotos, ...newPhotos];
        });
      } else {
        setPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPhotos.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      console.error('שגיאה בטעינת תמונות:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [currentUser, fetchMyPhotosFromBackend]);
 
  // ═══════════════════════════════════════════════════════════════════════════
  // SQUAD FIX: Phase 1 — Load event IMMEDIATELY (no auth needed).
  // events_select_public RLS allows anyone to read active events.
  // This ensures g.event is available for the Guest Book modal instantly,
  // and the loading spinner resolves in <1s.
  // ═══════════════════════════════════════════════════════════════════════════
  const hasLoadedEvent = useRef(false);
  useEffect(() => {
    if (hasLoadedEvent.current) return;
    hasLoadedEvent.current = true;
    (async () => {
      const eventCode = propEventCode || new URLSearchParams(window.location.search).get('code');
      if (!eventCode) { setIsLoading(false); return; }
      try {
        const currentEventData = await memoriaService.events.getByCode(eventCode);
        if (currentEventData) {
          setEvent(currentEventData);
        } else {
          setPageError('LOAD_ERROR');
        }
      } catch (err) {
        console.error('[Phase1] Event load failed:', err);
        setPageError('LOAD_ERROR');
      }
      setIsLoading(false); // ← Spinner stops HERE, even before photos load
    })();
  }, [propEventCode]);
 
  // ═══════════════════════════════════════════════════════════════════════════
  // SQUAD FIX: Phase 2 — Load photos AFTER auth resolves.
  // Needs currentUser for ownership checks and myPhotos fetching.
  // Re-runs when currentUser changes (e.g., after signInAnonymously resolves).
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isLoadingAuth || !event) return;
    const userIdSnapshot = currentUser?.id || null;
    (async () => {
      try {
        let ownerOrAdmin = false;
        if (currentUser) {
          const isCoHost = Array.isArray(event.co_hosts) && event.co_hosts.includes(currentUser.email);
          ownerOrAdmin = currentUser.role === 'admin' || event.created_by === currentUser.id || isCoHost;
          setIsOwner(ownerOrAdmin);
        }
        const myAllPhotos = await fetchMyPhotosFromBackend(event.id, userIdSnapshot);
        setUserUploadedCount(myAllPhotos.length);
        if (!isAdminView) {
          setPage(1);
          setSharedPage(1);
          setHasMore(true);
          setSharedHasMore(true);
          await fetchPhotosByPage(event.id, 1, ownerOrAdmin, event, userIdSnapshot);
        }
      } catch (err) {
        console.error('[Phase2] Photos load failed:', err);
      }
    })();
  }, [currentUser, isLoadingAuth, event?.id]);
 
  // ─── Full reload (kept for PullToRefresh) ─────────────────────────────────
  const loadEventAndPhotos = useCallback(async () => {
    const eventCode = propEventCode || new URLSearchParams(window.location.search).get('code');
    if (!eventCode) { setIsLoading(false); return; }
    const userIdSnapshot = currentUser?.id || null;
    try {
      const currentEventData = await memoriaService.events.getByCode(eventCode);
      if (currentEventData) {
        setEvent(currentEventData);
        let ownerOrAdmin = false;
        if (currentUser) {
          const isCoHost = Array.isArray(currentEventData.co_hosts) && currentEventData.co_hosts.includes(currentUser.email);
          ownerOrAdmin = currentUser.role === 'admin' || currentEventData.created_by === currentUser.id || isCoHost;
          setIsOwner(ownerOrAdmin);
        }
        const myAllPhotos = await fetchMyPhotosFromBackend(currentEventData.id, userIdSnapshot);
        setUserUploadedCount(myAllPhotos.length);
        if (!isAdminView) {
          setPage(1); setSharedPage(1); setHasMore(true); setSharedHasMore(true);
          await fetchPhotosByPage(currentEventData.id, 1, ownerOrAdmin, currentEventData, userIdSnapshot);
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת הנתונים:', error);
      setPageError('LOAD_ERROR');
    }
    setIsLoading(false);
  }, [propEventCode, currentUser, isAdminView, fetchPhotosByPage, fetchMyPhotosFromBackend]);
 
  // ─── Real-time photo subscription ─────────────────────────────────────────
  useEffect(() => {
    if (isAdminView || !event?.id) return;
    const eventId = event.id;
    const channel = supabase
      .channel(`photos-realtime-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
        (payload) => {
          const eventType = payload.eventType;
          const photo = payload.new;
          const oldData = payload.old;
 
          if (eventType === 'INSERT') {
            if (!photo) return;
            if (photo.created_by && photo.created_by === currentUser?.id) return;
            const uploaderName = photo.guest_name || 'אורח';
            setLiveNotification({ id: Date.now(), message: `${uploaderName} העלה תמונה חדשה 📸`, icon: '📸' });
            setTimeout(() => setLiveNotification(null), 5000);
          }
 
          if (eventType === 'UPDATE' && photo) {
            const becameApproved = photo.is_approved && oldData && !oldData.is_approved;
            const becameVisible = !photo.is_hidden && oldData && oldData.is_hidden;
            const becameHidden = photo.is_hidden && oldData && !oldData.is_hidden;
 
            if (becameApproved || becameVisible) {
              if (!photo.is_hidden) {
                setSharedPhotos(prev => prev.find(p => p.id === photo.id) ? prev.map(p => p.id === photo.id ? photo : p) : [photo, ...prev]);
                setPhotos(prev => prev.find(p => p.id === photo.id) ? prev.map(p => p.id === photo.id ? photo : p) : [photo, ...prev]);
              }
              if (photo.created_by === currentUser?.id) setMyPhotos(prev => prev.map(p => p.id === photo.id ? photo : p));
              setLiveNotification({ id: Date.now(), message: 'תמונה חדשה עלתה לגלריה!', icon: '🖼️' });
              setTimeout(() => setLiveNotification(null), 5000);
            }
 
            if (becameHidden) {
              setSharedPhotos(prev => prev.filter(p => p.id !== photo.id));
              setPhotos(prev => prev.filter(p => p.id !== photo.id));
              if (photo.created_by === currentUser?.id) setMyPhotos(prev => prev.map(p => p.id === photo.id ? photo : p));
            }
          }
 
          if (eventType === 'DELETE' && oldData?.id) {
            setPhotos(prev => prev.filter(p => p.id !== oldData.id));
            setSharedPhotos(prev => prev.filter(p => p.id !== oldData.id));
            setMyPhotos(prev => prev.filter(p => p.id !== oldData.id));
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [isAdminView, event?.id, currentUser?.id]);
 
  // ─── Fetch next page ──────────────────────────────────────────────────────
  const fetchNextPage = useCallback(() => {
    if (isFetchingMore || !event) return;
    if (isOwner || activeTab === 'my-photos') {
      if (!hasMore) return;
      setPage(prev => { const n = prev + 1; fetchPhotosByPage(event.id, n, isOwner, event); return n; });
    } else {
      if (!sharedHasMore) return;
      setSharedPage(prev => { const n = prev + 1; fetchPhotosByPage(event.id, n, isOwner, event); return n; });
    }
  }, [hasMore, sharedHasMore, isFetchingMore, event, isOwner, activeTab, fetchPhotosByPage]);
 
  // ─── Image utils ──────────────────────────────────────────────────────────
  const getDisplayUploaderName = (photo) => {
    if (!photo) return null;
    return photo.guest_name || null;
  };
 
  const drawDateStamp = (ctx, width, height) => {
    const now = new Date();
    const dateStr = `'${now.getFullYear().toString().slice(-2)}  ${(now.getMonth() + 1).toString().padStart(2, '0')}  ${now.getDate().toString().padStart(2, '0')}`;
    const fontSize = Math.floor(width * 0.038);
    ctx.save();
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255, 120, 0, 0.92)";
    ctx.shadowBlur = 6; ctx.shadowColor = "rgba(200, 80, 0, 0.5)";
    ctx.translate(width * 0.06, height * 0.92);
    ctx.rotate(-Math.PI / 2); ctx.textAlign = "left";
    ctx.fillText(dateStr, 0, 0);
    ctx.restore();
  };
 
  const compressImage = (file, shouldFlip = false, filter = 'none') => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 1920;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio; height *= ratio;
        }
        canvas.width = width; canvas.height = height;
        ctx.save();
        if (shouldFlip) { ctx.translate(width, 0); ctx.scale(-1, 1); }
        if (filter === 'vintage') ctx.filter = 'sepia(40%) contrast(85%) brightness(110%) saturate(120%)';
        else if (filter === 'black_white') ctx.filter = 'grayscale(100%) contrast(120%)';
        ctx.drawImage(img, 0, 0, width, height);
        if (filter === 'vintage') drawDateStamp(ctx, width, height);
        ctx.restore();
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Failed to compress image')); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
      img.src = objectUrl;
    });
  };
 
  const generateWatermarkedBlob = (photo, eventName) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const centerX = canvas.width / 2;
        const bottomY = canvas.height;
        ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 2;
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.font = `italic ${canvas.width * 0.045}px Georgia, serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(eventName, centerX, bottomY - (canvas.width * 0.08));
        ctx.shadowBlur = 0;
        ctx.font = `600 ${canvas.width * 0.022}px "Courier New", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("C A P T U R E D   V I A   M E M O R I A", centerX, bottomY - (canvas.width * 0.03));
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Failed watermark blob')); return; }
          resolve(blob);
        }, 'image/jpeg', 0.92);
      };
      img.onerror = reject;
      img.src = photo.file_urls?.original || photo.file_url;
    });
  };
 
  // ─── Upload actions ───────────────────────────────────────────────────────
  const getUserMaxUploads = useCallback(() => {
    if (!event || !currentUser) return event?.max_uploads_per_user || 15;
    if (currentUser.email === 'effitag@gmail.com') return 200;
    if (event.created_by === currentUser.id) return 200;
    if (Array.isArray(event.co_hosts) && event.co_hosts.includes(currentUser.email)) return 50;
    return event.max_uploads_per_user || 15;
  }, [event, currentUser]);
 
  const addToPendingPhotos = async (file, isFrontCamera = false, filterType = 'none') => {
    if (!file.type.startsWith('image/')) { alert('יש לבחור קובץ תמונה בלבד.'); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { alert('גודל הקובץ חייב להיות עד 50MB.'); return; }
    if (event) {
      const maxPhotos = getUserMaxUploads();
      if (userUploadedCount + pendingPhotos.length >= maxPhotos) {
        alert(`הגעת למכסה המקסימלית (${maxPhotos} תמונות) לאירוע זה.`); return;
      }
    }
    try {
      const compressedFile = await compressImage(file, false, filterType);
      const previewUrl = URL.createObjectURL(compressedFile);
      setPendingPhotos(prev => [...prev, { id: Date.now() + Math.random(), file: compressedFile, originalFile: file, previewUrl, isFrontCamera, originalName: file.name, size: compressedFile.size, filter: filterType }]);
      setShowPendingGallery(true);
    } catch (error) {
      console.error('שגיאה בעיבוד התמונה:', error);
      alert('שגיאה בעיבוד התמונה. אנא נסה שוב.');
    }
  };
 
  const changePhotoFilter = async (photoId, newFilter) => {
    const photo = pendingPhotos.find(p => p.id === photoId);
    if (!photo) return;
    setProcessingFilterId(photoId);
    const processedFile = await compressImage(photo.originalFile, false, newFilter);
    const newPreviewUrl = URL.createObjectURL(processedFile);
    if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    setPendingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, file: processedFile, previewUrl: newPreviewUrl, filter: newFilter } : p));
    setProcessingFilterId(null);
  };
 
  const removeFromPendingPhotos = (photoId) => {
    setPendingPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      const updated = prev.filter(p => p.id !== photoId);
      if (updated.length === 0) setShowPendingGallery(false);
      return updated;
    });
  };
 
  const clearAllPendingPhotos = useCallback(() => {
    setPendingPhotos(prev => { prev.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); }); return []; });
    setShowPendingGallery(false);
  }, []);
 
  const uploadAllPendingPhotos = async () => {
    if (pendingPhotos.length === 0) return;

    let liveUserId = null;

    try {
      // ── Step 1: Resolve user ID — three-tier fallback, zero blocking ────────
      //
      // WHY: Supabase JS v2 auth uses an internal mutex to serialize operations.
      // TIER 1 — currentUser from AuthContext React state (zero Supabase calls).
      // TIER 2 — getSession() with 2s timeout (localStorage read, no network).
      // TIER 3 — signInAnonymously() as last resort (truly no session).

      // Tier 1: AuthContext state — already set, no Supabase call needed
      liveUserId = currentUser?.id ?? null;

      if (!liveUserId) {
        // Tier 2: getSession() with timeout to avoid mutex contention hang
        liveUserId = await Promise.race([
          supabase.auth.getSession().then(({ data }) => data?.session?.user?.id ?? null).catch(() => null),
          new Promise(resolve => setTimeout(() => resolve(null), 2000)),
        ]);
      }

      if (!liveUserId) {
        // Tier 3: last resort — sign in fresh
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw new Error(`signInAnonymously failed: ${signInError.message}`);
        liveUserId = signInData?.user?.id ?? null;
      }

      // ── Step 2: Quota check — pure function, zero network calls ─────────
      const quota = checkGuestQuota({
        event,
        user_id: liveUserId,
        user_upload_count: userUploadedCount,
        photos,
      });
      if (!quota?.data?.allowed) {
        alert(quota?.data?.reason || 'לא ניתן להעלות תמונות לאירוע זה.');
        return;
      }

      // ── Step 3: Upload batch ─────────────────────────────────────────────
      // @ts-ignore — event is typed as null by useState(null) inference; runtime guard below covers the null case
      const eventId = event?.id;
      if (!eventId) throw new Error('אירוע לא נמצא — לא ניתן להעלות תמונות.');
      setIsUploadingBatch(true);
      setUploadProgress({ current: 0, total: pendingPhotos.length });
      const photosToUpload = [...pendingPhotos];
      const newlyUploaded = [];
      let successCount = 0, errorCount = 0;
      const batchSize = 3;

      for (let i = 0; i < photosToUpload.length; i += batchSize) {
        const batch = photosToUpload.slice(i, i + batchSize);
        await Promise.all(batch.map(async (photo) => {
          try {
            const { file_url, path } = await memoriaService.storage.upload(photo.file, eventId);

            const photoData = {
              event_id: eventId,
              file_url,
              path,
              filter_applied: photo.filter || 'none',
              is_approved: false,
              is_hidden: false,
              guest_name: localStorage.getItem('ms_guest_name')
                || currentUser?.user_metadata?.display_name
                || currentUser?.full_name
                || null,
              guest_greeting: localStorage.getItem('ms_guest_greeting') || currentUser?.user_metadata?.guest_greeting || null,
              created_by: liveUserId,
              device_uuid: null,
            };

            const created = await memoriaService.photos.create(photoData);
            if (created) newlyUploaded.push(created);
            successCount++;
          } catch (err) {
            console.error('MemoriaService [upload]: per-photo error:', err instanceof Error ? err.message : err);
            errorCount++;
          } finally {
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
        }));
      }

      pendingPhotos.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
      setPendingPhotos([]); setShowPendingGallery(false);
      setIsUploadingBatch(false); setUploadProgress({ current: 0, total: 0 });

      if (successCount > 0) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#f3f3f3', '#e5e5e5', '#c4c4c4', '#ffffff', '#25D366'] });
        if (navigator.vibrate) navigator.vibrate(200);
        setUploadSuccess(true);
        setUserUploadedCount(prev => prev + successCount);
        if (!isAdminView) {
          const uploaded = newlyUploaded.filter(p => p);
          if (uploaded.length > 0) {
            const addOptimistic = prev => {
              const existingIds = new Set(prev.map(p => p.id));
              return [...uploaded.filter(p => !existingIds.has(p.id)).reverse(), ...prev];
            };
            setPhotos(addOptimistic);
            setMyPhotos(addOptimistic);
          }
        }
      }
      if (errorCount > 0) alert(`${successCount} תמונות הועלו בהצלחה.\n${errorCount} תמונות נכשלו.`);

    } catch (outerErr) {
      // Catches any exception thrown BEFORE or AFTER the batch loop —
      // e.g. getUser() network failure, signInAnonymously() error, quota check throw.
      console.error('[Upload Trace] ❌ OUTER CATCH — upload aborted before batch started:', outerErr?.message || outerErr);
      setIsUploadingBatch(false);
      setUploadProgress({ current: 0, total: 0 });
      alert('שגיאה בתהליך ההעלאה. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
    }
  };
 
  const handleUploadClick = async (mode) => {
    if (!event) return;

    // Ensure a session exists before opening camera/picker.
    // getSession() reads from localStorage — no network, no mutex contention.
    if (!currentUser) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    }

    if (mode === 'camera') { setShowCamera(true); }
    else {
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.dataset.cameraMode = 'gallery';
        fileInputRef.current.click();
      }
    }
  };
 
  const handleCameraCapture = async (file, filterType) => { await addToPendingPhotos(file, false, 'none'); };
 
  const handleFinalUploadFromCamera = async () => {
    setShowCamera(false);
    await uploadAllPendingPhotos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
 
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !event) return;
    setIsPreparingFiles(true);
    setTimeout(async () => {
      const isFrontCamera = fileInputRef.current?.dataset.cameraMode === 'front';
      for (const file of files) await addToPendingPhotos(file, isFrontCamera);
      if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.dataset.cameraMode = ''; }
      setIsPreparingFiles(false);
    }, 50);
  };
 
  // ─── Share / Download ─────────────────────────────────────────────────────
  const sharePhoto = async (photo) => {
    if (!navigator.share) return;
    setIsProcessingAction(true);
    try {
      const blob = await generateWatermarkedBlob(photo, event.name);
      const file = new File([blob], `memoria-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await navigator.share({ title: `תמונה מ${event.name}`, files: [file] });
    } catch (error) { console.error('שגיאה בשיתוף:', error); }
    finally { setIsProcessingAction(false); }
  };
 
  const handleDownloadPhoto = async (photo) => {
    setIsProcessingAction(true);
    try {
      const blob = await generateWatermarkedBlob(photo, event.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `memoria-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { window.open(photo.file_url, '_blank'); }
    finally { setIsProcessingAction(false); }
  };
 
  // ─── Delete handlers ──────────────────────────────────────────────────────
  const handleGuestDeletePhoto = async (photoId) => {
    const photo = photos.find(p => p.id === photoId) || myPhotos.find(p => p.id === photoId);
    if (!photo || photo.is_approved) return;
    setDeletingId(photoId); setConfirmDeleteId(null);
    await memoriaService.photos.delete(photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setMyPhotos(prev => prev.filter(p => p.id !== photoId));
    setUserUploadedCount(prev => Math.max(0, prev - 1));
    setSelectedIndex(null); setDeletingId(null);
  };
 
  const handleRequestDeletion = async (photoId) => {
    await requestPhotoDeletion({ photo_id: photoId });
    const markRequested = p => p.id === photoId ? { ...p, is_hidden: true, deletion_status: 'requested' } : p;
    setPhotos(prev => prev.map(markRequested));
    setMyPhotos(prev => prev.map(markRequested));
    setSharedPhotos(prev => prev.map(markRequested));
    setSelectedIndex(null);
  };
 
  const handleAdminDelete = async (photoId) => {
    setDeletingId(photoId); setConfirmDeleteId(null);
    await memoriaService.photos.delete(photoId);
    if (onAdminPhotosChange) onAdminPhotosChange((adminPhotos || []).filter(p => p.id !== photoId));
    setDeletingId(null);
  };
 
  const handleDeleteFromFullScreen = async () => {
    if (!selectedPhoto) return;
    const currentIndex = selectedIndex;
    const remaining = (adminPhotos || []).filter(p => p.id !== selectedPhoto.id);
    setDeletingId(selectedPhoto.id);
    await memoriaService.photos.delete(selectedPhoto.id);
    if (onAdminPhotosChange) onAdminPhotosChange(remaining);
    setDeletingId(null);
    if (remaining.length === 0) setSelectedIndex(null);
    else if (currentIndex >= remaining.length) setSelectedIndex(remaining.length - 1);
  };
 
  // ─── Bulk selection & action ──────────────────────────────────────────────
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) setSelectedPhotoIds(new Set());
      return !prev;
    });
  }, []);

  const togglePhotoSelection = useCallback((photoId) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const handleBulkAction = useCallback(async (actionType) => {
    const ids = [...selectedPhotoIds];
    if (ids.length === 0) return;

    // Optimistic UI — update local state immediately
    if (actionType === 'approve') {
      const patch = p => ids.includes(p.id) ? { ...p, is_approved: true, is_hidden: false } : p;
      setPhotos(prev => prev.map(patch));
      setSharedPhotos(prev => prev.map(patch));
      setMyPhotos(prev => prev.map(patch));
    } else if (actionType === 'hide') {
      const patch = p => ids.includes(p.id) ? { ...p, is_hidden: true } : p;
      setPhotos(prev => prev.map(patch));
      setSharedPhotos(prev => prev.filter(p => !ids.includes(p.id)));
      setMyPhotos(prev => prev.map(patch));
    } else if (actionType === 'delete') {
      setPhotos(prev => prev.filter(p => !ids.includes(p.id)));
      setSharedPhotos(prev => prev.filter(p => !ids.includes(p.id)));
      setMyPhotos(prev => prev.filter(p => !ids.includes(p.id)));
    }

    // Clear selection immediately so the bar disappears
    setSelectedPhotoIds(new Set());
    setIsSelectionMode(false);

    // Concurrent DB calls, batched into chunks of 50 to avoid mobile network overload
    const CHUNK = 50;
    try {
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        if (actionType === 'approve') {
          await Promise.all(chunk.map(id =>
            memoriaService.photos.update(id, { is_approved: true, is_hidden: false })
          ));
        } else if (actionType === 'hide') {
          await Promise.all(chunk.map(id =>
            memoriaService.photos.update(id, { is_hidden: true })
          ));
        } else if (actionType === 'delete') {
          await Promise.all(chunk.map(id => memoriaService.photos.delete(id)));
        }
      }
    } catch (err) {
      console.error('[BulkAction] Failed:', err.message);
    }
  }, [selectedPhotoIds]);

  // ─── Derived values ───────────────────────────────────────────────────────
  const isSuperAdmin = currentUser?.email === 'effitag@gmail.com';
  const isOriginalCreator = !!(currentUser?.id && event?.created_by === currentUser.id);
  const isCoHost = !!(Array.isArray(event?.co_hosts) && event.co_hosts.includes(currentUser?.email));
 
  let eventMaxPhotos;
  if (isSuperAdmin || isOriginalCreator) eventMaxPhotos = 200;
  else if (isCoHost) eventMaxPhotos = 50;
  else eventMaxPhotos = event?.max_uploads_per_user || 15;
 
  const remainingPhotos = Math.max(0, eventMaxPhotos - userUploadedCount);
  const isQuotaExhausted = userUploadedCount >= eventMaxPhotos;
  const cameraMaxPhotos = remainingPhotos;
 
  const getCameraFormattedDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };
 
  return {
    event, photos, myPhotos, sharedPhotos, activeTab, setActiveTab,
    isLoading, pageError, isOwner, currentUser, navigate,
    handleGuestDeletePhoto, handleRequestDeletion,
    liveNotification, setLiveNotification,
    userUploadedCount, uploadSuccess, setUploadSuccess,
    confirmDeleteId, setConfirmDeleteId, deletingId,
    pendingPhotos, isUploadingBatch, isPreparingFiles, uploadProgress,
    showPendingGallery, setShowPendingGallery,
    processingFilterId, selectedPendingIndex, setSelectedPendingIndex,
    showCamera, setShowCamera, showFAB, isProcessingAction,
    selectedIndex, setSelectedIndex, selectedPhoto,
    page, hasMore, sharedHasMore, isFetchingMore,
    displayedPhotos,
    isSuperAdmin, eventMaxPhotos, remainingPhotos, isQuotaExhausted, cameraMaxPhotos,
    fileInputRef,
    loadEventAndPhotos, fetchNextPage, handleUploadClick, handleCameraCapture, handleFinalUploadFromCamera,
    handleFileChange, addToPendingPhotos, changePhotoFilter, removeFromPendingPhotos, clearAllPendingPhotos,
    uploadAllPendingPhotos, sharePhoto, handleDownloadPhoto,
    isSelectionMode, selectedPhotoIds, toggleSelectionMode, togglePhotoSelection, handleBulkAction,
    handleAdminDelete, handleDeleteFromFullScreen,
    handleNextPhoto, handlePrevPhoto,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    getDisplayUploaderName, getCameraFormattedDate,
  };
}
 
