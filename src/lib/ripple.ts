/** Soft ripple from the pointer on primary and secondary buttons. */
export function installRipple() {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const btn = (e.target as HTMLElement | null)?.closest?.('.glass-btn-primary, .glass-btn-secondary') as HTMLButtonElement | null;
      if (!btn || btn.disabled) return;
      if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const clip = document.createElement('span');
      clip.className = 'ripple-clip';
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - rect.left - size / 2}px`;
      dot.style.top = `${e.clientY - rect.top - size / 2}px`;
      clip.appendChild(dot);
      btn.appendChild(clip);
      dot.addEventListener('animationend', () => clip.remove());
    },
    { passive: true }
  );
}
