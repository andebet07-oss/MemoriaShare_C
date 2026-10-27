import GuestNotice from './GuestNotice';
import StatStrip from './StatStrip';
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
 * else a ready magnet, else a rejected print), one jobs module, the actions.
 * Jobs module: none yet → the quota line; any in progress → the stat strip;
 * all settled → the row of magnets.
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
  // A failed first load leaves the quota unknown: say nothing rather than guess.
  if (jobs.length === 0) module = loadError ? null : <QuotaLine remaining={remaining} />;
  else if (counts.printing > 0) {
    module = (
      <>
        <StatStrip available={remaining} printing={counts.printing} ready={counts.ready} />
        <p className="mt-3 text-[13px] leading-5 text-guest-ink/70">נעדכן כאן כשמגנט מוכן. האיסוף בעמדת המגנטים.</p>
      </>
    );
  } else {
    module = (
      <>
        <MagnetsRow jobs={jobs} used={used} quota={quota} remaining={remaining} onShowAll={onStatus} onCapture={onCapture} />
        {counts.rejected > 0 && notice !== 'rejected' && (
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
      <GuestActions canCapture={remaining > 0} onCapture={onCapture} onStatus={jobs.length > 0 ? onStatus : null} />
    </>
  );
}
