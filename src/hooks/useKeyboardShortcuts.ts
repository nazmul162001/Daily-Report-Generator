import { useEffect, useRef } from "react";

interface UseKeyboardShortcutsOptions {
  onCopy?: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onCopy,
  onSave,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const copyRef = useRef(onCopy);
  const saveRef = useRef(onSave);

  useEffect(() => {
    copyRef.current = onCopy;
    saveRef.current = onSave;
  }, [onCopy, onSave]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "Enter" && copyRef.current) {
        event.preventDefault();
        copyRef.current();
        return;
      }

      if ((event.key === "s" || event.key === "S") && saveRef.current) {
        // Allow Ctrl+S even when typing so save works while editing
        event.preventDefault();
        saveRef.current();
        return;
      }

      // Avoid handling other shortcuts while typing
      if (isTyping) {
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
