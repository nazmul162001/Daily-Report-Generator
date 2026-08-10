export type ClipboardResult =
  | { success: true }
  | { success: false; error: string };

function blobPromise(value: string, type: string): Promise<Blob> {
  return Promise.resolve(new Blob([value], { type }));
}

/**
 * Copy plain text, optionally with HTML for rich-text paste (e.g. Slack compositor).
 * HTML is preferred when pasting into Slack so <pre> becomes a real code block.
 */
export async function copyToClipboard(
  text: string,
  html?: string,
): Promise<ClipboardResult> {
  if (!text.trim()) {
    return { success: false, error: "Nothing to copy." };
  }

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.write &&
      typeof ClipboardItem !== "undefined" &&
      html
    ) {
      // Safari requires ClipboardItem values to be Promises
      const item = new ClipboardItem({
        "text/plain": blobPromise(text, "text/plain"),
        "text/html": blobPromise(html, "text/html"),
      });
      await navigator.clipboard.write([item]);
      return { success: true };
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }

    if (typeof document === "undefined") {
      return { success: false, error: "Clipboard is not available." };
    }

    // Fallback: selectable contenteditable with HTML when available
    if (html) {
      const holder = document.createElement("div");
      holder.contentEditable = "true";
      holder.style.position = "fixed";
      holder.style.left = "-9999px";
      holder.innerHTML = html;
      document.body.appendChild(holder);
      const range = document.createRange();
      range.selectNodeContents(holder);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      const succeeded = document.execCommand("copy");
      selection?.removeAllRanges();
      document.body.removeChild(holder);
      if (succeeded) {
        return { success: true };
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (succeeded) {
      return { success: true };
    }

    return { success: false, error: "Clipboard copy failed." };
  } catch {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return { success: true };
      }
    } catch {
      // ignore and report below
    }

    return {
      success: false,
      error: "Unable to copy. Clipboard may be blocked by the browser.",
    };
  }
}
