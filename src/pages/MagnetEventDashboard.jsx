import { useState, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Printer, Copy, Check, ArrowRight, Users, Calendar, Hash, Lock, ImageIcon } from 'lucide-react';
import memoriaService from '@/components/memoriaService';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/system/PageHeader';
import SectionLabel from '@/components/system/SectionLabel';
import Card from '@/components/system/Card';
import EventTemplateCard from '@/components/magnet/templates/EventTemplateCard';

function InfoRow({ icon: Icon, label, value, ltr = false }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <span dir={ltr ? 'ltr' : undefined} className="text-sm font-semibold text-foreground tabular-nums">{value || '—'}</span>
    </div>
  );
}

export default function MagnetEventDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverInputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !event?.id) return;
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    setIsSavingCover(true);
    try {
      const { file_url } = await memoriaService.storage.uploadCoverImage(file, event.id);
      await memoriaService.events.update(event.id, { cover_image: file_url });
      queryClient.invalidateQueries({ queryKey: ['magnet-event', eventId] });
    } catch (err) {
      console.error('[MagnetDashboard] Cover upload failed:', err);
    } finally {
      setIsSavingCover(false);
      URL.revokeObjectURL(objectUrl);
      setCoverPreview(null);
    }
  };

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['magnet-event', eventId],
    queryFn: () => memoriaService.events.get(eventId),
    enabled: !!eventId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['magnet-photos', eventId],
    queryFn: () => memoriaService.photos.getByEvent(eventId),
    enabled: !!eventId,
  });

  const guestLink = event
    ? `${import.meta.env.VITE_SITE_URL || window.location.origin}/magnet/${event.unique_code}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(guestLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (d) => d
    ? new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
    : null;

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="flex flex-col items-center gap-4 text-center py-16">
      <p className="text-muted-foreground text-sm">לא נמצא אירוע.</p>
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/events/magnet')}>
        חזרה לרשימה
      </Button>
    </div>
  );

  if (event.event_type !== 'magnet') return <Navigate to="/admin/events/magnet" replace />;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-16" dir="rtl">

      {/* Back */}
      <Button variant="ghost" size="sm" className="-ms-3 mb-4" onClick={() => navigate('/admin/events/magnet')}>
        <ArrowRight />
        אירועי מגנט
      </Button>

      <PageHeader
        title={event.name}
        subtitle={formatDate(event.date)}
        action={
          <Button className="w-full md:w-auto" onClick={() => navigate(`/admin/events/magnet/${eventId}/print`)}>
            <Printer />
            פתח עמדת הדפסה
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Event details */}
          <Card className="!py-1">
            <InfoRow icon={Calendar} label="תאריך"        value={formatDate(event.date)} />
            <InfoRow icon={Hash}     label="קוד אירוע"    value={event.unique_code} ltr />
            <InfoRow icon={Lock}     label="PIN"          value={event.pin_code}    ltr />
            <InfoRow icon={Users}    label="הדפסות לאורח" value={event.print_quota_per_device ? `${event.print_quota_per_device} הדפסות` : null} />
          </Card>

          <EventTemplateCard event={event} />

          {/* Cover image */}
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h2">תמונת רקע לדף הנחיתה</SectionLabel>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isSavingCover}
              className="relative w-full h-36 rounded-xl overflow-hidden border border-dashed border-border bg-secondary/50 hover:border-brand/50 transition-colors group"
            >
              {(coverPreview || event.cover_image) ? (
                <>
                  <img src={coverPreview || event.cover_image} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-foreground text-sm font-semibold">לחץ להחלפה</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5 text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">+ העלה תמונת רקע</span>
                </div>
              )}
              {isSavingCover && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-foreground animate-spin" />
                </div>
              )}
            </button>
          </Card>
          {/* Guest link */}
          <Card className="flex flex-col gap-3">
            <SectionLabel as="h2">קישור לאורחים</SectionLabel>
            <div className="flex items-center gap-2">
              <p dir="ltr" className="flex-1 h-9 leading-9 text-xs text-muted-foreground truncate bg-secondary rounded-xl px-3 border border-border">
                {guestLink}
              </p>
              <Button variant="secondary" size="icon-sm" onClick={handleCopy} aria-label="העתק קישור">
                {copied ? <Check className="text-status-ready" /> : <Copy />}
              </Button>
            </div>
          </Card>

        </div>

        {/* Photo feed */}
        <section className="flex flex-col gap-3">
          <SectionLabel as="h2">תמונות שנשלחו (<bdi className="tabular-nums">{photos.length}</bdi>)</SectionLabel>
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 18).map(ph => (
                <div key={ph.id} className="aspect-square rounded-xl overflow-hidden bg-secondary">
                  <img src={ph.file_urls?.thumbnail ?? ph.file_url} alt="" className="w-full h-full object-contain p-1.5" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <p className="text-muted-foreground text-sm">אין תמונות עדיין</p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
