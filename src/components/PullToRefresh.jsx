import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children, disabled = false }) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const startY = useRef(null);
  const THRESHOLD = 70;

  const onTouchStart = (e) => {
    if (disabled || window.scrollY > 5) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || window.scrollY > 5) return;
    const dist = e.touches[0].clientY - startY.current;
    if (dist > 0) {
      setPullDist(Math.min(dist, 120));
      setIsPulling(dist > 20);
    }
  };

  const onTouchEnd = async () => {
    if (pullDist > THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      setPullDist(0);
      await onRefresh();
      setIsRefreshing(false);
    } else {
      setIsPulling(false);
      setPullDist(0);
    }
    startY.current = null;
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {(isPulling || isRefreshing) && (
        <div className="flex justify-center items-center py-3 text-indigo-400">
          <Loader2
            className={`w-6 h-6 transition-transform duration-100 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: isPulling ? `rotate(${Math.min((pullDist / THRESHOLD) * 180, 180)}deg)` : undefined }}
          />
        </div>
      )}
      {children}
    </div>
  );
}