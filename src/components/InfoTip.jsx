import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo } from 'react-icons/fi';

/**
 * InfoTip — Icono (i) con tooltip explicativo para términos complejos.
 * Usa createPortal para evitar que padres con overflow:hidden o transform
 * recorten el tooltip.
 * Uso: <InfoTip text="Explicación del término" />
 */
function InfoTip({ text, placement = 'top', size = 14 }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const hideTimeout = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;
    let top, left;

    if (placement === 'top') {
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else {
      top = triggerRect.bottom + gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    }

    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    if (top < 8) {
      top = triggerRect.bottom + gap;
    }

    setPos({ top, left });
  }, [placement]);

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  const show = () => {
    clearTimeout(hideTimeout.current);
    setVisible(true);
  };

  const hide = () => {
    hideTimeout.current = setTimeout(() => setVisible(false), 100);
  };

  const toggle = (e) => {
    e.stopPropagation();
    setVisible(v => !v);
  };

  // Close on outside click (mobile)
  useEffect(() => {
    if (!visible) return;
    const handleClick = (e) => {
      if (triggerRef.current?.contains(e.target) || tooltipRef.current?.contains(e.target)) return;
      setVisible(false);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="info-tip"
        tabIndex={0}
        aria-label="Más información"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={toggle}
        onTouchStart={toggle}
      >
        <FiInfo size={size} />
      </span>
      {visible && createPortal(
        <div
          ref={tooltipRef}
          className="info-tip-popup"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
}

export default InfoTip;
