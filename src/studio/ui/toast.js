// Short Hebrew messages in the studio, shown by Memoria's toaster (src/components/ui/toaster.jsx).
import { toast } from '@/components/ui/use-toast';

/** Show a short Hebrew message to the user. `tone`: 'error' | 'info'. */
export function notify(message, tone = 'error') {
  toast({ description: message, variant: tone === 'error' ? 'destructive' : 'default', duration: 5000 });
}
