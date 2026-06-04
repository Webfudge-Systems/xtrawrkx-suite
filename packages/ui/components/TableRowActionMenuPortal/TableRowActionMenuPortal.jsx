'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

/**
 * Renders a row action menu in a portal (document.body) with fixed positioning
 * so it is not clipped by table overflow-x-auto containers.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {{ top: number, left: number, triggerEl?: Element | null } | null} props.anchor - viewport coords; optional `triggerEl` so outside-clicks ignore the menu button (toggle still works)
 * @param {() => void} props.onClose
 * @param {React.ReactNode} props.children
 * @param {string} [props.menuClassName] - panel width / extras (default: w-44)
 * @param {number} [props.menuWidthPx] - used to keep menu inside viewport horizontally
 */
export function TableRowActionMenuPortal({
  open,
  anchor,
  onClose,
  children,
  menuClassName,
  menuWidthPx = 176,
}) {
  const menuRef = useRef(null);
  const [menuTop, setMenuTop] = useState(anchor?.top ?? 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => onClose();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => onClose();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !anchor) return;
    const pad = 8;
    const gap = 4;
    const menuEl = menuRef.current;
    if (!menuEl) {
      setMenuTop(anchor.top);
      return;
    }

    const rect = menuEl.getBoundingClientRect();
    let nextTop = anchor.top;
    const wouldOverflowBottom = nextTop + rect.height > window.innerHeight - pad;
    if (wouldOverflowBottom) {
      const triggerTop = anchor.triggerEl?.getBoundingClientRect?.().top ?? anchor.top;
      nextTop = Math.max(pad, triggerTop - rect.height - gap);
    }
    setMenuTop(nextTop);
  }, [open, anchor, children]);

  useEffect(() => {
    if (!open) return;
    const triggerEl = anchor?.triggerEl;
    const onDocMouseDown = (e) => {
      const t = e.target;
      if (menuRef.current?.contains(t)) return;
      if (triggerEl && (triggerEl === t || (typeof triggerEl.contains === 'function' && triggerEl.contains(t))))
        return;
      onClose();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, onClose, anchor]);

  if (!open || !anchor || typeof document === 'undefined') return null;

  const pad = 8;
  const left = Math.min(anchor.left, Math.max(pad, window.innerWidth - menuWidthPx - pad));

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={clsx(
        'fixed z-[200] rounded-lg border border-slate-200 bg-white py-1 shadow-lg',
        menuClassName ?? 'w-44'
      )}
      style={{ top: menuTop || anchor.top, left }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

export default TableRowActionMenuPortal;
