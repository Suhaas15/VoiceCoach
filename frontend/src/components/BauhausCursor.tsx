import { useEffect, useRef } from 'react';

export default function BauhausCursor() {
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return null;
    }
  }

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.body.classList.add('cursor-active');

    const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: mousePos.x, y: mousePos.y };
    let rafId: number | null = null;

    const setDotPos = (x: number, y: number) => {
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.opacity = '1';
    };

    const setRingPos = (x: number, y: number) => {
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
    };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      setDotPos(mousePos.x, mousePos.y);
      if (!rafId) {
        const loop = () => {
          ringPos.x += (mousePos.x - ringPos.x) * 0.12;
          ringPos.y += (mousePos.y - ringPos.y) * 0.12;
          setRingPos(ringPos.x, ringPos.y);
          rafId = window.requestAnimationFrame(loop);
        };
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const clearHoverStates = () => {
      ring.classList.remove('is-hover', 'is-hover-btn', 'is-input');
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      if (target.matches('input, textarea')) {
        ring.classList.add('is-hover', 'is-input');
        ring.classList.remove('is-hover-btn');
      } else if (target.matches('button, [data-cursor="hover"]')) {
        ring.classList.add('is-hover', 'is-hover-btn');
        ring.classList.remove('is-input');
      } else if (target.matches('.skch, .metric-card, [role="button"]')) {
        ring.classList.add('is-hover');
        ring.classList.remove('is-hover-btn', 'is-input');
      } else {
        clearHoverStates();
      }
    };

    const onMouseOut = () => {
      clearHoverStates();
    };

    const onMouseDown = () => {
      dot.classList.add('is-clicking');
      ring.classList.add('is-clicking');
    };

    const onMouseUp = () => {
      dot.classList.remove('is-clicking');
      ring.classList.remove('is-clicking');
    };

    const onMouseLeave = () => {
      dot.style.opacity = '0';
    };

    const onMouseEnter = () => {
      dot.style.opacity = '1';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      document.body.classList.remove('cursor-active');
      if (rafId != null) window.cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

