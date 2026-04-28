import { useRef, useCallback } from 'react';
import './ScrollTouch.css';

/**
 * Gorizontal scroll: barmoq bilan surish va sichqoncha bosib surish (pointer drag).
 * Scrollbar yashirin — `scroll-touch` klassi orqali.
 */
export default function ScrollTouch({ children, className = '', ...rest }) {
  const elRef = useRef(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    pointerId: null,
  });

  const endDrag = useCallback((e) => {
    const el = elRef.current;
    const d = dragRef.current;
    if (!d.active) return;
    if (e && e.pointerId !== d.pointerId) return;
    const { pointerId } = d;
    if (el && pointerId != null) {
      try {
        if (el.hasPointerCapture(pointerId)) {
          el.releasePointerCapture(pointerId);
        }
      } catch {
        /* ignore */
      }
    }
    dragRef.current = {
      active: false,
      startX: 0,
      startScroll: 0,
      pointerId: null,
    };
    el?.classList.remove('scroll-touch--dragging');
  }, []);

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    if (e.button !== 0) return;
    const el = elRef.current;
    if (!el) return;

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    };
    el.classList.add('scroll-touch--dragging');
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!dragRef.current.active || e.pointerId !== dragRef.current.pointerId) return;
    const el = elRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScroll - dx;
  };

  const mergedClass = ['scroll-touch', className].filter(Boolean).join(' ');

  return (
    <div
      ref={elRef}
      className={mergedClass}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      {...rest}
    >
      {children}
    </div>
  );
}
