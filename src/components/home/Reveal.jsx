import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/**
 * Fades and rises its content once, as it scrolls into view. With "reduce
 * motion" it is always shown, and nothing is ever hidden without the observer
 * (useInView reports true when IntersectionObserver is missing).
 * `delay` (ms) staggers items inside one section.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const ref = useRef(null);
  const shown = useInView(ref, { rootMargin: '0px 0px -60px 0px', once: true });

  return (
    <Tag
      ref={ref}
      className={cn(
        'motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:[transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]',
        shown ? 'opacity-100' : 'motion-safe:translate-y-4 motion-safe:opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
