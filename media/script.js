(function () {
  const vscode = acquireVsCodeApi();
  const $ = (s) => document.querySelector(s);

  const input = $("#codeInput");
  const output = $("#output");
  const status = $("#status");
  const toast = $("#toast");
  const toastText = $("#toastText");

  // --- Generate Snippet ---
  $("#generate").addEventListener("click", () => {
    const codeText = input.value.trim();
    if (!codeText) {
      showToast("Paste or select some code first!");
      return;
    }
    status.textContent = "Generating…";
    vscode.postMessage({ command: "getSnippet", payload: { fallback: codeText } });
  });

  // --- Clear Input/Output ---
  $("#clear").addEventListener("click", () => {
    input.value = "";
    output.textContent = '💡 Press "Generate" to create a snippet!';
    status.textContent = "";
  });

  // --- Copy Output ---
  $("#copy").addEventListener("click", async () => {
    try {
      const textToCopy = output.textContent?.trim();
      if (!textToCopy || textToCopy === '💡 Press "Generate" to create a snippet!') {
        showToast("Nothing to copy!");
        return;
      }
      await navigator.clipboard.writeText(textToCopy);
      showToast("✅ Snippet copied!");
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("❌ Copy failed");
    }
  });

  // --- Insert Snippet to Editor ---
  $("#insert").addEventListener("click", () => {
    const snippetText = output.textContent?.trim();
    if (!snippetText) {
      showToast("Nothing to insert!");
      return;
    }
    vscode.postMessage({ type: "insertSnippet", text: snippetText });
    showToast("📥 Inserted into editor");
  });

  // --- Handle Messages from Extension ---
  window.addEventListener("message", (e) => {
    const { command, snippet, payload } = e.data || {};

    if (command === "displaySnippet") {
      output.textContent = snippet || "⚠️ No snippet generated.";
      status.textContent = "Done.";
    } else if (command === "displayFormatted") {
      output.textContent = JSON.stringify(payload, null, 2);
      status.textContent = "Done.";
    }
  });

  // --- Show Toast Message ---
  function showToast(msg) {
    toastText.textContent = msg;
    toast.hidden = false;
    toast.style.opacity = "1";
    setTimeout(() => (toast.style.opacity = "0"), 1500);
    setTimeout(() => (toast.hidden = true), 1800);
  }
})();
