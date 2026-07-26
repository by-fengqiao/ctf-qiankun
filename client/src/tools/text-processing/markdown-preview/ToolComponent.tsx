import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const escapeHtml = (text: string): string =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');

const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();
  // Strip control chars / whitespace that could obscure the scheme (e.g. "java\tscript:").
  const normalized = trimmed.replace(/[\u0000-\u0020]+/gu, '');
  if (/^(?:javascript|data|vbscript|file|about):/iu.test(normalized)) return '#';
  if (/^(?:https?:|mailto:)/iu.test(normalized)) return trimmed;
  if (normalized.startsWith('#')) return trimmed;
  // Relative paths (no scheme): allow if there is no ':' before the first '/', '?', or '#'.
  const schemeMatch = normalized.match(/^[a-z][a-z0-9+.-]*:/iu);
  if (schemeMatch) return '#';
  return trimmed;
};

const mdToHtml = (md: string): string => {
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  let inCode = false;
  let inQuote = false;
  const inline = (text: string): string => {
    let result = escapeHtml(text);
    result = result.replace(/`([^`]+)`/gu, '<code>$1</code>');
    result = result.replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>');
    result = result.replace(/\*([^*]+)\*/gu, '<em>$1</em>');
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (_m: string, text: string, url: string) => `<a href="${sanitizeUrl(url)}">${text}</a>`);
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, (_m: string, alt: string, url: string) => `<img src="${sanitizeUrl(url)}" alt="${alt}" />`);
    return result;
  };
  const closeBlocks = () => {
    if (inList) { html += '</ul>\n'; inList = false; }
    if (inQuote) { html += '</blockquote>\n'; inQuote = false; }
    if (inCode) { html += '</code></pre>\n'; inCode = false; }
  };
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) { closeBlocks(); }
      else { closeBlocks(); html += '<pre><code>\n'; inCode = true; }
      continue;
    }
    if (inCode) { html += escapeHtml(line) + '\n'; continue; }
    if (/^#{1,6}\s/u.test(line)) {
      closeBlocks();
      const level = line.match(/^#+/u)![0].length;
      const content = line.replace(/^#+\s*/u, '');
      html += `<h${level}>${inline(content)}</h${level}>\n`;
      continue;
    }
    if (/^>\s/u.test(line)) {
      if (!inQuote) { html += '<blockquote>\n'; inQuote = true; }
      html += `<p>${inline(line.replace(/^>\s*/u, ''))}</p>\n`;
      continue;
    }
    if (/^[-*+]\s/u.test(line)) {
      if (!inList) { html += '<ul>\n'; inList = true; }
      html += `<li>${inline(line.replace(/^[-*+]\s*/u, ''))}</li>\n`;
      continue;
    }
    if (line.trim() === '') { closeBlocks(); continue; }
    closeBlocks();
    html += `<p>${inline(line)}</p>\n`;
  }
  closeBlocks();
  return html.trim();
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => mdToHtml(input)}
  />
);

export default ToolComponent;
