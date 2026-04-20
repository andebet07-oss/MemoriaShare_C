import React, { useState, useMemo } from "react";
import memoriaService from "@/components/memoriaService";
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Home, Image as ImageIcon, AlertTriangle, Search, Filter, Users, Plus, LayoutDashboard, ExternalLink, Copy, Trash2, Check, Camera } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PullToRefresh from "../components/PullToRefresh";

const EventCard = React.memo(function EventCard({ event, onDelete, isAdmin = false, photoCount = 0, guestCount = 0 }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isLive = eventDate >= today;

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${import.meta.env.VITE_SITE_URL || window.location.origin}${createPageUrl(`Event?code=${event.unique_code}`)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl hover:border-foreground/15 transition-all duration-300">
      {/* Hero Image */}
      <div
        className="relative w-full aspect-video bg-cover bg-center cursor-pointer"
        style={{ backgroundImage: `url(${event.cover_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60"})` }}
        onClick={() => navigate(createPageUrl(`Dashboard?id=${event.id}`))}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {isLive && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md animate-pulse tracking-widest shadow-lg">
            שידור חי
          </div>
        )}
        {/* Stats overlay on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white/70 text-xs">
          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{photoCount}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{guestCount}</span>
        </div>
      </div>

      {/* Info + Actions */}
      <div className="p-4">
        <p className="text-indigo-400 text-[10px] tracking-[0.3em] uppercase mb-1 font-bold">
          {new Date(event.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <h3 className="font-heebo font-extrabold text-foreground text-xl leading-tight mb-4 truncate">{event.name}</h3>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(createPageUrl(`Dashboard?id=${event.id}`))}
            className="flex-1 bg-cool-50 text-cool-950 hover:bg-foreground font-semibold text-sm rounded-xl h-10 flex items-center justify-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            דאשבורד
          </Button>
          <Link to={createPageUrl(`EventGallery?code=${event.unique_code}`)} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent border-border text-foreground hover:bg-accent font-semibold text-sm rounded-xl h-10 flex items-center justify-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              גלריה
            </Button>
          </Link>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-10 h-10 p-0 rounded-xl bg-transparent border-border text-foreground hover:bg-accent flex items-center justify-center flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-indigo-400" /> : <Copy className="w-4 h-4" />}
          </Button>
          {isAdmin && (
            <Button
              onClick={(e) => { e.stopPropagation(); onDelete(event); }}
              variant="outline"
              className="w-10 h-10 p-0 rounded-xl bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default function MyEvents() {
  const navigate = useNavigate();
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['my-events', user?.id, user?.role],
    queryFn: async () => {
      if (user.role === 'admin') return memoriaService.events.list('-created_date');
      return memoriaService.events.listByUser(user.id, '-created_date');
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const eventIds = useMemo(() => events.map(e => e.id), [events]);

  const { data: eventStats = {} } = useQuery({
    queryKey: ['my-events-stats', eventIds],
    queryFn: async () => {
      const results = await Promise.allSettled(
        events.map(async (event) => {
          const photos = await memoriaService.photos.getByEvent(event.id);
          const guestCount = new Set(photos.map(p => p.browser_fingerprint || p.device_uuid || p.created_by).filter(Boolean)).size;
          return { eventId: event.id, photoCount: photos.length, guestCount };
        })
      );
      const stats = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') stats[r.value.eventId] = r.value;
      });
      return stats;
    },
    enabled: events.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(term) ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        (e.created_by && e.created_by.toLowerCase().includes(term))
      );
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(e => e.is_active === isActive);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter(e => e.event_type === typeFilter);
    }
    return filtered;
  }, [events, searchTerm, statusFilter, typeFilter]);

  const handleDeleteConfirmed = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      const photosToDelete = await memoriaService.photos.getByEvent(eventToDelete.id);
      await Promise.allSettled(photosToDelete.map(p => memoriaService.photos.delete(p.id)));
      await memoriaService.events.delete(eventToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events-stats'] });
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setEventToDelete(null);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-cool-950">
        <LoadingState fullScreen />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="dark min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground px-6" dir="rtl">
        <h1 className="font-heebo font-extrabold text-4xl md:text-5xl leading-[1.1] text-foreground/90 mb-4">גישה למנהלים בלבד</h1>
        <p className="text-muted-foreground mb-8">עליך להתחבר כדי לראות את האירועים שלך.</p>
        <div className="flex gap-4">
          <Button onClick={() => navigateToLogin()} className="bg-cool-50 text-cool-950 hover:bg-foreground font-semibold text-lg px-8 py-3 h-auto min-h-[44px] shadow-indigo-soft rounded-md">התחברות</Button>
          <Button onClick={() => navigate(createPageUrl("Home"))} variant="outline" className="border-border text-foreground hover:bg-accent min-h-[44px]">
            <Home className="w-4 h-4 ml-2" /> דף הבית
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <>
      <div className="dark min-h-screen bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 text-foreground" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-indigo-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-3"><bdi>01</bdi> · ניהול</p>
              <h1 className="font-heebo font-extrabold text-3xl md:text-4xl leading-[1.1] text-foreground/90 tracking-tight">האירועים שלי</h1>
              <p className="text-muted-foreground text-sm mt-2">{filteredEvents.length} אירועים</p>
            </div>
            <div className="flex items-center gap-3">
              {user?.email === 'effitag@gmail.com' && (
                <Link to={createPageUrl("AdminUsers")}>
                  <button className="p-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </button>
                </Link>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-full transition-colors ${showFilters ? 'bg-indigo-500 text-cool-950' : 'bg-secondary hover:bg-accent'}`}
              >
                <Filter className="w-5 h-5 text-muted-foreground" />
              </button>
              <Link to={createPageUrl("CreateEvent")}>
                <Button className="bg-cool-50 text-cool-950 hover:bg-foreground font-bold text-sm rounded-full px-5 py-2.5 h-auto shadow-indigo-soft active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  אירוע חדש
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חפש לפי שם, תיאור..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card border-border text-foreground pr-11 h-11 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mb-6 bg-card rounded-2xl p-4 border border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">סטטוס</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background border-border text-foreground h-10">
                      <SelectValue placeholder="כל הסטטוסים" />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-border text-foreground">
                      <SelectItem value="all">כל הסטטוסים</SelectItem>
                      <SelectItem value="active">פעילים</SelectItem>
                      <SelectItem value="inactive">סגורים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">סוג אירוע</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-background border-border text-foreground h-10">
                      <SelectValue placeholder="כל הסוגים" />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-border text-foreground">
                      <SelectItem value="all">כל הסוגים</SelectItem>
                      <SelectItem value="wedding">חתונה</SelectItem>
                      <SelectItem value="bar_mitzvah">בר/בת מצווה</SelectItem>
                      <SelectItem value="birthday">יום הולדת</SelectItem>
                      <SelectItem value="corporate">אירוע עסקי</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); setTypeFilter("all"); }} className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 block">
                  נקה סינון
                </button>
              )}
            </div>
          )}

          {/* Events Grid */}
          <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['my-events'] })}>
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onDelete={setEventToDelete}
                  isAdmin={isAdmin}
                  photoCount={eventStats[event.id]?.photoCount || 0}
                  guestCount={eventStats[event.id]?.guestCount || 0}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-28 text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center mb-6 shadow-xl">
                <Camera className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-heebo font-extrabold text-3xl text-foreground/90 mb-3">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? "לא נמצאו אירועים" : "עדיין אין אירועים"}
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "נסה לשנות את הסינון"
                  : "צור את האירוע הראשון שלך ותן לאורחים לשתף רגעים"}
              </p>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
                <Link to={createPageUrl("CreateEvent")}>
                  <Button className="bg-cool-50 text-cool-950 hover:bg-foreground font-bold text-base rounded-full px-8 py-3 h-auto shadow-indigo-soft active:scale-95 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    צור אירוע ראשון
                  </Button>
                </Link>
              )}
            </div>
          )}
          </PullToRefresh>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <DialogContent className="dark bg-cool-950/95 backdrop-blur-md border border-border text-foreground w-[90vw] max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <DialogTitle className="font-playfair text-2xl text-foreground/90">מחיקת אירוע</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 text-sm">
              האם אתה בטוח שברצונך למחוק את <strong className="text-foreground">"{eventToDelete?.name}"</strong>?
              <br />פעולה זו תמחק את כל התמונות לצמיתות.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4 flex-col sm:flex-row">
            <Button onClick={handleDeleteConfirmed} disabled={isDeleting} variant="destructive" className="w-full sm:w-auto min-h-[44px]">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "כן, מחק"}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto min-h-[44px] border border-border hover:bg-accent">ביטול</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}