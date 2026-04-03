import { useState, useEffect, useRef, useCallback } from "react";
import memoriaService from "@/components/memoriaService";
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from "react-router-dom";
import confetti from 'canvas-confetti';
import { base44 } from "@/api/base44Client";
import { checkGuestQuota } from "@/functions/checkGuestQuota";
import { processImage } from "@/functions/processImage";
import { requestPhotoDeletion } from "@/functions/requestPhotoDeletion";
import { getMyPhotos } from "@/functions/getMyPhotos";

const PHOTOS_PER_PAGE = 30;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const DEVICE_UUID_KEY = 'ms_device_uuid';

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

  const fileInputRef = useRef(null);
  const observerTarget = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Tab-aware displayed photos: admin → adminPhotos; owner → legacy photos; guest → per-tab
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
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleNextPhoto = (e) => { if (e) e.stopPropagation(); if (selectedIndex < displayedPhotos.length - 1) setSelectedIndex(i => i + 1); };
  const handlePrevPhoto = (e) => { if (e) e.stopPropagation(); if (selectedIndex > 0) setSelectedIndex(i => i - 1); };

  // ─── Fetch photos ─────────────────────────────────────────────────────────
  // Sort: '-created_date' + stable secondary sort by id ensures consistent pagination
  // even when multiple photos share the same timestamp (e.g. batch uploads).
  const STABLE_SORT = '-created_date,id';

  // Helper: fetches ALL of the current user's photos via backend (service role)
  // bypassing the is_approved filter. Falls back to device_uuid when email is missing.
  const fetchMyPhotosFromBackend = useCallback(async (eventId, userEmail) => {
    const deviceUUID = !userEmail ? (localStorage.getItem(DEVICE_UUID_KEY) || null) : null;
    if (!userEmail && !deviceUUID) return [];
    try {
      const res = await getMyPhotos({ event_id: eventId, device_uuid: deviceUUID });
      return res?.data?.photos || [];
    } catch (err) {
      console.error('fetchMyPhotos failed:', err);
      return [];
    }
  }, []);

  const fetchPhotosByPage = useCallback(async (eventId, pageNum, userIsOwner, eventData, userEmail = currentUser?.email) => {
    try {
      setIsFetchingMore(true);
      let newPhotos = [];

      if (userIsOwner) {
        // מנהל האירוע רואה את כל התמונות (כולל לא מאושרות)
        newPhotos = await memoriaService.photos.getByEvent(eventId, {}, STABLE_SORT, {
          limit: PHOTOS_PER_PAGE, offset: (pageNum - 1) * PHOTOS_PER_PAGE
        });
      } else {
        // ─── Tabbed guest view ────────────────────────────────────────────
        // Always fetch the user's own photos for the "My Photos" tab.
        // Only fetch shared (approved) photos when auto_publish_guest_photos is on.
        const myAllPhotos = await fetchMyPhotosFromBackend(eventId, userEmail);

        // Populate myPhotos state (all statuses, client-side hidden filter).
        // Note: getMyPhotos backend returns ALL user photos in one call (not paginated),
        // so we only need to set it on the first load. Subsequent pages only affect sharedPhotos.
        if (pageNum === 1) {
          setMyPhotos(myAllPhotos.filter(p => p.is_hidden !== true));
        }

        if (eventData?.auto_publish_guest_photos) {
          // Shared gallery: approved photos, client-side is_hidden filter
          const rawApprovedPhotos = await memoriaService.photos.getByEvent(
            eventId, { is_approved: true }, STABLE_SORT,
            { limit: PHOTOS_PER_PAGE, offset: (pageNum - 1) * PHOTOS_PER_PAGE }
          );
          const approvedVisible = rawApprovedPhotos.filter(p => p.is_hidden !== true);

          if (pageNum === 1) {
            setSharedPhotos(approvedVisible);
            setSharedHasMore(approvedVisible.length >= PHOTOS_PER_PAGE);
          } else {
            setSharedPhotos(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNew = approvedVisible.filter(p => !existingIds.has(p.id));
              return [...prev, ...uniqueNew];
            });
            if (approvedVisible.length < PHOTOS_PER_PAGE) setSharedHasMore(false);
          }

          // Legacy "photos" array: merge my + approved (reuse fetched data)
          const myIds = new Set(myAllPhotos.map(p => p.id));
          newPhotos = [...myAllPhotos, ...approvedVisible.filter(p => !myIds.has(p.id))];
        } else {
          newPhotos = myAllPhotos;
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
        // Strict deduplication: never add a photo whose id already exists
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

  // ─── Load event ───────────────────────────────────────────────────────────
  const loadEventAndPhotos = useCallback(async () => {
    const eventCode = propEventCode || new URLSearchParams(window.location.search).get('code');
    if (!eventCode) { setIsLoading(false); return; }
    // snapshot the email at call time — avoids closure staleness
    const emailSnapshot = currentUser?.email || null;
    try {
      const currentEventData = await memoriaService.events.getByCode(eventCode);
      if (currentEventData) {
        setEvent(currentEventData);
        let ownerOrAdmin = false;
        if (currentUser) {
          const isCoHost = Array.isArray(currentEventData.co_hosts) && currentEventData.co_hosts.includes(currentUser.email);
          ownerOrAdmin = currentUser.role === 'admin' || currentEventData.created_by === currentUser.email || isCoHost;
          setIsOwner(ownerOrAdmin);
        }
        // ספירת תמונות לפי אימייל — דרך backend כדי לעקוף פילטר is_approved
        // Fallback to device_uuid when no email is available
        const myAllPhotos = await fetchMyPhotosFromBackend(currentEventData.id, emailSnapshot);
        setUserUploadedCount(myAllPhotos.length);
        if (!isAdminView) {
          setPage(1);
          setSharedPage(1);
          setHasMore(true);
          setSharedHasMore(true);
          await fetchPhotosByPage(currentEventData.id, 1, ownerOrAdmin, currentEventData, emailSnapshot);
        }
      }
    } catch (error) {
      console.error('שגיאה בטעינת הנתונים:', error);
      setPageError('LOAD_ERROR');
    }
    setIsLoading(false);
  }, [propEventCode, currentUser, isAdminView, fetchPhotosByPage, fetchMyPhotosFromBackend]);

  useEffect(() => {
    if (!isLoadingAuth) {
      loadEventAndPhotos();
    }
  }, [currentUser, isLoadingAuth]);

  // ─── Real-time photo subscription (guest gallery) ─────────────────────────
  useEffect(() => {
    if (isAdminView) return;
    const unsubscribe = base44.entities.Photo.subscribe((evt) => {
      const photo = evt.data;
      if (!photo) return;

      if (evt.type === "create") {
        // Only show notification for other users' uploads
        if (photo.created_by && photo.created_by === currentUser?.email) return;
        const uploaderName = photo.guest_name || (photo.created_by ? photo.created_by.split("@")[0] : "אורח");
        setLiveNotification({ id: Date.now(), message: `${uploaderName} העלה תמונה חדשה 📸`, icon: "📸" });
        setTimeout(() => setLiveNotification(null), 5000);
      }

      if (evt.type === "update" && photo.is_approved) {
        const oldData = evt.old_data;
        if (oldData && !oldData.is_approved) {
          // Add the newly approved photo to the legacy gallery and shared tab
          setPhotos(prev => {
            if (prev.find(p => p.id === photo.id)) return prev.map(p => p.id === photo.id ? photo : p);
            return [photo, ...prev];
          });
          setSharedPhotos(prev => {
            if (prev.find(p => p.id === photo.id)) return prev.map(p => p.id === photo.id ? photo : p);
            return [photo, ...prev];
          });
          // Update the photo in myPhotos if it's the user's own
          if (photo.created_by === currentUser?.email) {
            setMyPhotos(prev => prev.map(p => p.id === photo.id ? photo : p));
          }
          setLiveNotification({ id: Date.now(), message: "תמונה חדשה עלתה לגלריה!", icon: "🖼️" });
          setTimeout(() => setLiveNotification(null), 5000);
        }
      }
    });
    return () => unsubscribe();
  }, [isAdminView, currentUser?.email]);

  // ─── Fetch next page (called by VirtuosoGrid endReached) ─────────────────
  const fetchNextPage = useCallback(() => {
    if (isFetchingMore || !event) return;
    // Owner and "my-photos" tab use the standard page counter
    if (isOwner || activeTab === 'my-photos') {
      if (!hasMore) return;
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchPhotosByPage(event.id, nextPage, isOwner, event);
        return nextPage;
      });
    } else {
      // Shared tab pagination
      if (!sharedHasMore) return;
      setSharedPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchPhotosByPage(event.id, nextPage, isOwner, event);
        return nextPage;
      });
    }
  }, [hasMore, sharedHasMore, isFetchingMore, event, isOwner, activeTab, fetchPhotosByPage]);

  // ─── Image utils ──────────────────────────────────────────────────────────
  const getDisplayUploaderName = (photo) => {
    if (!photo) return "אורח";
    const email = photo.created_by || "";
    if (email.includes("privaterelay.appleid.com")) return photo.guest_name || "משתמש אפל";
    return photo.guest_name || (email && email !== "anonymous" ? email.split('@')[0] : "אורח");
  };

  const drawDateStamp = (ctx, width, height) => {
    const now = new Date();
    const dateStr = `'${now.getFullYear().toString().slice(-2)}  ${(now.getMonth() + 1).toString().padStart(2, '0')}  ${now.getDate().toString().padStart(2, '0')}`;
    const fontSize = Math.floor(width * 0.038);
    ctx.save();
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255, 120, 0, 0.92)";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(200, 80, 0, 0.5)";
    ctx.translate(width * 0.06, height * 0.92);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "left";
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
    const isSuperAdmin = currentUser.email === 'effitag@gmail.com';
    if (isSuperAdmin) return 200;
    const isCreator = event.created_by === currentUser.email;
    if (isCreator) return 200;
    const isCoHost = Array.isArray(event.co_hosts) && event.co_hosts.includes(currentUser.email);
    if (isCoHost) return 50;
    return event.max_uploads_per_user || 15;
  }, [event, currentUser]);

  const addToPendingPhotos = async (file, isFrontCamera = false, filterType = 'none') => {
    if (!file.type.startsWith('image/')) {
      alert('יש לבחור קובץ תמונה בלבד.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('גודל הקובץ חייב להיות עד 50MB.');
      return;
    }
    if (event) {
      const maxPhotos = getUserMaxUploads();
      if (userUploadedCount + pendingPhotos.length >= maxPhotos) {
        alert(`הגעת למכסה המקסימלית (${maxPhotos} תמונות) לאירוע זה.`);
        return;
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
    setPendingPhotos(prev => {
      prev.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
      return [];
    });
    setShowPendingGallery(false);
  }, []);

  const uploadAllPendingPhotos = async () => {
    if (pendingPhotos.length === 0) return;

    // ── Server-side quota check before uploading ──────────────────────────
    // device_uuid is sent so per-device limit is enforced correctly
    const quota = await checkGuestQuota({ event_id: event.id });
    if (!quota?.data?.allowed) {
      const reason = quota?.data?.reason || 'לא ניתן להעלות תמונות לאירוע זה.';
      alert(reason);
      return;
    }

    setIsUploadingBatch(true);
    setUploadProgress({ current: 0, total: pendingPhotos.length });

    const photosToUpload = [...pendingPhotos];
    const newlyUploaded = [];
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 3;

    for (let i = 0; i < photosToUpload.length; i += batchSize) {
      const batch = photosToUpload.slice(i, i + batchSize);
      await Promise.all(batch.map(async (photo) => {
        try {
          // Convert file to base64 and process via backend (creates 3 resized versions)
          const arrayBuffer = await photo.file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let c = 0; c < uint8Array.length; c += chunkSize) {
            binary += String.fromCharCode(...uint8Array.subarray(c, c + chunkSize));
          }
          const base64 = btoa(binary);
          console.log("🟡 Calling processImage for:", photo.originalName || photo.file.name, "| base64 length:", base64.length);
          const processed = await processImage({ file_base64: base64, file_name: photo.originalName || photo.file.name });
          console.log("🟣 processImage response:", JSON.stringify(processed));
          const processedData = processed?.data;

          let photoData = {
            event_id: event.id,
            filter_applied: photo.filter || 'none',
            is_approved: false,
            is_hidden: false,
            guest_name: currentUser?.full_name || currentUser?.email || "אורח",
          };

          if (processedData?.thumbnail_url) {
            // New path: save multi-resolution versions
            photoData.file_urls = {
              thumbnail: processedData.thumbnail_url,
              medium: processedData.medium_url,
              original: processedData.original_url,
            };
            photoData.file_url = processedData.original_url; // legacy fallback
          } else {
            // Fallback: direct upload if processImage failed
            const { file_url } = await memoriaService.storage.upload(photo.file);
            photoData.file_url = file_url;
          }

          const created = await memoriaService.photos.create(photoData);
          if (created) newlyUploaded.push(created);
          successCount++;
        } catch (err) {
          console.error('❌ Failed to upload photo:', err?.message || err, '| photo:', photo.originalName);
          errorCount++;
        } finally {
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }));
    }

    pendingPhotos.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setPendingPhotos([]);
    setShowPendingGallery(false);
    setIsUploadingBatch(false);
    setUploadProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      // Confetti + Haptic at the exact end of a successful batch
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#f3f3f3', '#e5e5e5', '#c4c4c4', '#ffffff', '#25D366'] });
      if (navigator.vibrate) navigator.vibrate(200);

      setUploadSuccess(true);
      setUserUploadedCount(prev => prev + successCount);
      if (!isAdminView) {
        // הצג מיידית את כל התמונות שהאורח העלה (גם לפני אישור) —
        // בשני המצבים (ציבורי + פרטי) המשתמש תמיד רואה את שלו
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

    if (errorCount > 0) alert(`${successCount} תמונות הועלו בהצלחה. ${errorCount} תמונות נכשלו.`);
  };

  const handleUploadClick = async (mode) => {
    if (!event) return;
    if (!currentUser) { memoriaService.auth.redirectToLogin(window.location.href); return; }
    if (mode === 'camera') {
      setShowCamera(true);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.dataset.cameraMode = 'gallery';
        fileInputRef.current.click();
      }
    }
  };

  const handleCameraCapture = async (file, filterType) => {
    await addToPendingPhotos(file, false, 'none');
  };

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

  // ─── Guest direct delete (unapproved photos — frees quota immediately) ───
  const handleGuestDeletePhoto = async (photoId) => {
    const photo = photos.find(p => p.id === photoId) || myPhotos.find(p => p.id === photoId);
    if (!photo || photo.is_approved) return; // מגן: לא ניתן למחוק מאושרות
    setDeletingId(photoId);
    setConfirmDeleteId(null);
    await memoriaService.photos.delete(photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setMyPhotos(prev => prev.filter(p => p.id !== photoId));
    setUserUploadedCount(prev => Math.max(0, prev - 1));
    setSelectedIndex(null);
    setDeletingId(null);
  };

  // ─── Guest deletion request (approved photos — moderation workflow) ──────
  const handleRequestDeletion = async (photoId) => {
    await requestPhotoDeletion({ photo_id: photoId });
    // הסתר מיידית בממשק המקומי
    const markRequested = p =>
      p.id === photoId ? { ...p, is_hidden: true, deletion_status: 'requested' } : p;
    setPhotos(prev => prev.map(markRequested));
    setMyPhotos(prev => prev.map(markRequested));
    setSharedPhotos(prev => prev.map(markRequested));
    setSelectedIndex(null);
  };

  // ─── Admin ────────────────────────────────────────────────────────────────
  const handleAdminDelete = async (photoId) => {
    setDeletingId(photoId);
    setConfirmDeleteId(null);
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

  // ─── Derived values ───────────────────────────────────────────────────────
  const isSuperAdmin = currentUser?.email === 'effitag@gmail.com';
  const isOriginalCreator = !!(currentUser?.email && event?.created_by === currentUser.email);
  const isCoHost = !!(Array.isArray(event?.co_hosts) && event.co_hosts.includes(currentUser?.email));

  let eventMaxPhotos;
  if (isSuperAdmin || isOriginalCreator) {
    eventMaxPhotos = 200;
  } else if (isCoHost) {
    eventMaxPhotos = 50;
  } else {
    eventMaxPhotos = event?.max_uploads_per_user || 15;
  }

  const remainingPhotos = Math.max(0, eventMaxPhotos - userUploadedCount);
  const isQuotaExhausted = userUploadedCount >= eventMaxPhotos;
  const cameraMaxPhotos = remainingPhotos;

  const getCameraFormattedDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };

  return {
  // state
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
    // derived
    isSuperAdmin, eventMaxPhotos, remainingPhotos, isQuotaExhausted, cameraMaxPhotos,
    // refs
    fileInputRef,
    // handlers
    loadEventAndPhotos, fetchNextPage, handleUploadClick, handleCameraCapture, handleFinalUploadFromCamera,
    handleFileChange, addToPendingPhotos, changePhotoFilter, removeFromPendingPhotos, clearAllPendingPhotos,
    uploadAllPendingPhotos, sharePhoto, handleDownloadPhoto,
    handleAdminDelete, handleDeleteFromFullScreen,
    handleNextPhoto, handlePrevPhoto,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    getDisplayUploaderName, getCameraFormattedDate,
  };
}