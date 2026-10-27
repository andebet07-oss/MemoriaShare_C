import { CalendarX2, SearchX } from 'lucide-react';
import GuestShell, { Wordmark } from './GuestShell';
import GuestTitle from './GuestTitle';
import { ICON } from './guestStyles';

function Message({ Icon, text, body }) {
  return (
    <div role="status" className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-guest-ink/10 text-guest-ink/70">
        <Icon {...ICON} className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-medium leading-5">{text}</p>
        {body && <p className="text-[13px] leading-5 text-guest-ink/70">{body}</p>}
      </div>
    </div>
  );
}

/** The event is not active: its photo and title, and one line (it may not have opened yet, or may be over). */
export function GuestClosed({ event }) {
  return (
    <GuestShell cover={event.cover_image} title={<GuestTitle event={event} />}>
      <Message Icon={CalendarX2} text="ההדפסות באירוע אינן פעילות כרגע" />
    </GuestShell>
  );
}

/** No event behind the code: nothing to show above the message, so it sits centred. */
export function GuestNotFound() {
  return (
    <div dir="rtl" className="fixed inset-0 flex flex-col bg-guest-bg font-heebo text-guest-ink">
      <Wordmark />
      <div className="flex flex-1 items-center justify-center px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
        <Message Icon={SearchX} text="לא מצאנו את האירוע" body="נסו לסרוק שוב את הברקוד" />
      </div>
    </div>
  );
}
