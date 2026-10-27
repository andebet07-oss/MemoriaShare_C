import GuestNotice from './GuestNotice';
import MagnetsRow from './MagnetsRow';
import GuestActions from './GuestActions';
import { countJobs } from './guestStyles';

/** First visit: the quota as one short line. */
function QuotaLine({ remaining }) {
  return (
    <p className="text-[15px] font-medium leading-5">
      {remaining === 1
        ? 'הדפסה אחת זמינה לך'
        : <><bdi className="tabular-nums">{remaining}</bdi> הדפסות זמינות לך</>}
    </p>
  );
}

/**
 * The landing sheet. Top to bottom: at most one notice (offline / load error,
 * else a ready magnet, else a rejected print), the guest's magnets (or, before
 * the first job, the quota line), the actions.
 */
export default function GuestSheet({ jobs, quota, remaining, online, loadError, onRetry, onCapture, onStatus }) {
  const counts = countJobs(jobs);
  const used = jobs.length - counts.rejected;
  let notice = null;
  if (!online) notice = 'offline';
  else if (loadError) notice = 'error';
  else if (counts.ready) notice = 'ready';
  else if (counts.rejected) notice = 'rejected';

  let module;
  // A failed load leaves the quota unknown: say nothing rather than guess.
  if (jobs.length === 0) module = loadError ? null : <QuotaLine remaining={remaining} />;
  else {
    module = (
      <>
        <MagnetsRow jobs={jobs} used={used} quota={quota} remaining={remaining} onShowAll={onStatus} onCapture={loadError ? null : onCapture} />
        {counts.printing > 0 && (
          <p className="mt-2 text-xs leading-4 text-guest-ink/55">נעדכן כאן כשמגנט מוכן. האיסוף בעמדת המגנטים.</p>
        )}
        {counts.printing === 0 && counts.rejected > 0 && notice !== 'rejected' && (
          <p className="mt-2 text-xs leading-4 text-guest-ink/55">הדפסה שנדחתה חוזרת למכסה שלך</p>
        )}
      </>
    );
  }

  return (
    <>
      {notice && (
        <div className="mb-5">
          <GuestNotice
            key={notice}
            kind={notice}
            count={notice === 'ready' ? counts.ready : counts.rejected}
            onRetry={onRetry}
          />
        </div>
      )}
      {module}
      {/* Until the jobs load, the quota is unknown: no capture (the server
          would reject a print over quota after the photo is uploaded). */}
      <GuestActions
        capture={loadError ? 'unknown' : remaining > 0 ? 'open' : 'used'}
        onCapture={onCapture}
        onStatus={jobs.length > 0 ? onStatus : null}
      />
    </>
  );
}
