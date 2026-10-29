/**
 * Universal clipboard utility that works reliably across all browsers,
 * insecure/HTTP contexts, iframes, and mobile devices.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try the modern Clipboard API if supported and permitted
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // If modern API fails (e.g. document not focused, permission denied, or HTTP),
      // seamlessly fall through to execCommand fallback
    }
  }

  // 2. Legacy fallback using an invisible <textarea> and document.execCommand('copy')
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;

      // Prevent scrolling to bottom of page in iOS/Safari
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.width = "2em";
      textarea.style.height = "2em";
      textarea.style.padding = "0";
      textarea.style.border = "none";
      textarea.style.outline = "none";
      textarea.style.boxShadow = "none";
      textarea.style.background = "transparent";
      textarea.setAttribute("readonly", "");

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (successful) return true;
    } catch (_fallbackErr) {
      // Fallback failed
    }
  }

  return false;
}

