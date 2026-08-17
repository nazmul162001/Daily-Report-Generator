import { useEffect, useRef } from "react";

interface UseKeyboardShortcutsOptions {
  onCopy?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onCopy,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const copyRef = useRef(onCopy);

  useEffect(() => {
    copyRef.current = onCopy;
  }, [onCopy]);

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

      // Avoid handling other shortcuts while typing
      if (isTyping) {
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
