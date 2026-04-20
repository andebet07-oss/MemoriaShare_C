import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ message = 'אירעה שגיאה בטעינת הנתונים.', onRetry, fullScreen = false }) {
  const wrapper = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-background'
    : 'flex items-center justify-center py-16';
  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
        <AlertCircle className="w-8 h-8 text-destructive/70" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            נסה שוב
          </Button>
        )}
      </div>
    </div>
  );
}
