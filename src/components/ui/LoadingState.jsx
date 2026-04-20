import { Loader2 } from 'lucide-react';

export function LoadingState({ message = null, fullScreen = false }) {
  const wrapper = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-background'
    : 'flex items-center justify-center py-16';
  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
