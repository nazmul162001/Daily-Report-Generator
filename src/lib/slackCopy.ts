/**
 * Build clipboard payloads so Slack rich-text paste becomes a real code block.
 * Markdown fences (```) do not convert in Slack's composer — HTML <pre> does.
 */
export function buildSlackCodeReport(input: {
  title: string;
  date: string;
  codeBlock: string;
}): { text: string; html: string } {
  const text = [input.title, input.date, "", input.codeBlock].join("\n");

  const titleHtml = input.title
    .split("\n")
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");

  // CF_HTML-style fragment so desktop apps (incl. Slack) detect rich paste
  const fragment = [
    titleHtml,
    `<div>${escapeHtml(input.date)}</div>`,
    "<div><br></div>",
    `<pre style="white-space:pre-wrap;font-family:Menlo,Monaco,Consolas,monospace">${escapeHtml(input.codeBlock)}</pre>`,
  ].join("");

  const html = [
    "<html><body>",
    "<!--StartFragment-->",
    fragment,
    "<!--EndFragment-->",
    "</body></html>",
  ].join("");

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
