'use client';

interface DrawerToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DrawerToggle({ isOpen, onToggle }: DrawerToggleProps) {
  return (
    <button
      type="button"
      className={`drawer-toggle ${isOpen ? 'drawer-toggle-open' : ''}`}
      onClick={onToggle}
      aria-label={isOpen ? 'おとのへやをとじる' : 'おとのへやをひらく'}
      aria-expanded={isOpen}
      aria-controls="drawer-panel"
    >
      <span className="drawer-toggle-icon" aria-hidden="true">
        {isOpen ? '✕' : '♫'}
      </span>
    </button>
  );
}
