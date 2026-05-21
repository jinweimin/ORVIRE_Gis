import { useEffect } from 'react';
import { useAppStore } from '../store';

let globalMapRef: { current: any } = { current: null };
export const setGlobalMapRef = (ref: any) => { globalMapRef.current = ref; };

export function useKeyboard() {
  const { toggleCommandPalette, commandPaletteOpen, wizardOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (wizardOpen) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (commandPaletteOpen) return;

      const map = globalMapRef.current;

      switch (e.key) {
        case 'Escape':
          useAppStore.getState().setContextMenu(null);
          useAppStore.getState().setActiveTool('select');
          break;
        case 'Home':
          map?.fitBounds([[114.043, 30.527], [114.054, 30.531]], { padding: 50 });
          break;
        case '1': useAppStore.getState().setViewMode('2d'); break;
        case '2': useAppStore.getState().setViewMode('3d'); break;
        case '3': useAppStore.getState().setViewMode('profile'); break;
        case '4': useAppStore.getState().setViewMode('split'); break;
        case 'v': case 'V':
          if (!e.ctrlKey && !e.metaKey) useAppStore.getState().setActiveTool('select');
          break;
        case 'l': case 'L':
          if (!e.ctrlKey) useAppStore.getState().setActiveTool('drawpipe');
          break;
        case 'p': case 'P':
          if (!e.ctrlKey) useAppStore.getState().setActiveTool('drawmanhole');
          break;
        case 'm': case 'M':
          if (!e.ctrlKey) useAppStore.getState().setActiveTool('measure');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, commandPaletteOpen, wizardOpen]);
}
