// « 👀 English » : maintenir le bouton pour voir l'écran en anglais, relâcher pour revenir au français.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';

let peeking = false;
const listeners = new Set<() => void>();

function setPeek(v: boolean) {
  if (peeking === v) return;
  peeking = v;
  document.documentElement.classList.toggle('peeking', v);
  listeners.forEach((fn) => fn());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const usePeek = () => useSyncExternalStore(subscribe, () => peeking);

/** `t('Bonjour', 'Hello')` : le français d'habitude, l'anglais pendant que le bouton est maintenu. */
export interface Translate {
  (fr: string, en: string): string;
  (fr: ReactNode, en: ReactNode): ReactNode;
}

export function useT(): Translate {
  const en = usePeek();
  return ((fr: ReactNode, english: ReactNode) => (en ? english : fr)) as Translate;
}

export function PeekButton() {
  const on = usePeek();

  // Relâcher partout (doigt qui glisse hors du bouton, onglet qui perd le focus…).
  useEffect(() => {
    const stop = () => setPeek(false);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
      setPeek(false);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={`peek-btn${on ? ' on' : ''}`}
        aria-pressed={on}
        aria-label="Maintenir pour voir l’écran en anglais"
        onPointerDown={(e) => {
          e.preventDefault();
          setPeek(true);
        }}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setPeek(true);
          }
        }}
        onKeyUp={() => setPeek(false)}
      >
        <span className="eyes" aria-hidden>
          👀
        </span>
        English
      </button>
      <AnimatePresence>
        {on && (
          <motion.div className="peek-banner" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.15 }}>
            👀 English preview — let go to switch back to French
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
