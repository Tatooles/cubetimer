type ClipboardWriter = {
  writeText: (text: string) => Promise<void>;
};

type CopyEnvironment = {
  clipboard?: ClipboardWriter;
  legacyCopy?: (text: string) => boolean;
};

function getBrowserClipboard(): ClipboardWriter | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.clipboard;
}

function legacyCopyText(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";

  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export async function copyTextToClipboard(
  text: string,
  environment: CopyEnvironment = {},
): Promise<boolean> {
  const clipboard = environment.clipboard ?? getBrowserClipboard();
  const legacyCopy = environment.legacyCopy ?? legacyCopyText;

  if (clipboard) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return legacyCopy(text);
    }
  }

  return legacyCopy(text);
}
