import { useNavigate } from "react-router-dom";
import { Check, Copy, Monitor } from "lucide-react";

/** Shown after a magnet event is created: guest QR + link, and next steps. */
export default function EventCreatedScreen({ success }) {
  const navigate = useNavigate();
  const eventUrl = `${window.location.origin}/magnet/${success.event_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&format=png&color=0a0a0a&bgcolor=ffffff&data=${encodeURIComponent(eventUrl)}`;
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cool-950 via-cool-900 to-cool-950 flex items-center justify-center" dir="rtl">
      <div className="text-center px-6 max-w-sm w-full">
        {/* Check circle */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-brand" />
        </div>
        <p className="text-brand text-xs font-semibold mb-3">מגנט · מוכן</p>
        <h3 className="font-heebo font-semibold text-3xl text-foreground/90 mb-2">אירוע מגנט נוצר</h3>
        <p className="text-muted-foreground text-sm mb-6">שתפו את הקישור או ה-QR עם האורחים</p>

        {/* QR code */}
        <div className="mx-auto w-fit bg-foreground rounded-2xl p-3 mb-5 shadow-2xl">
          <img src={qrUrl} alt="QR" width={160} height={160} className="block rounded-lg" />
        </div>

        {/* Event URL copy row */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 mb-6">
          <span className="text-foreground/75 text-xs truncate flex-1 text-right" dir="ltr">
            {eventUrl}
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText(eventUrl)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="העתק קישור"
          >
            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(`/PrintStation/${success.event_id}`)}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors"
          >
            <Monitor className="w-4 h-4" />
            פתח Print Station
          </button>
          <button
            onClick={() => navigate('/AdminDashboard')}
            className="w-full px-5 py-3 bg-card border border-border text-muted-foreground text-sm rounded-xl hover:bg-accent transition-colors"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    </div>
  );
}
