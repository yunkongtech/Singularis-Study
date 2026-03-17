/**
 * Utility to render inline LaTeX formulas within HTML content.
 *
 * Scans for LaTeX delimiters:
 *   - \( ... \)  → inline math
 *   - \[ ... \]  → display math
 *   - $...$      → inline math (single dollar)
 *   - $$...$$    → display math (double dollar)
 *
 * Replaces matched LaTeX with KaTeX-rendered HTML.
 */

import katex from 'katex';

/**
 * Process HTML string and render any LaTeX delimiters into KaTeX HTML.
 * Safe to call on content that has no LaTeX — returns unchanged.
 */
export function renderLatexInHtml(html: string): string {
  if (!html) return html;

  // Quick check — skip processing if no LaTeX markers found
  if (
    !html.includes('\\(') &&
    !html.includes('\\[') &&
    !html.includes('$') &&
    !html.includes('\\text') &&
    !html.includes('\\frac') &&
    !html.includes('\\color')
  ) {
    return html;
  }

  let result = html;

  // 1. Display math: \[ ... \]  (must be before inline to avoid partial matches)
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, latex: string) => {
    return renderKatex(latex.trim(), true);
  });

  // 2. Inline math: \( ... \)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, latex: string) => {
    return renderKatex(latex.trim(), false);
  });

  // 3. Display math: $$...$$  (must be before single $)
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex: string) => {
    return renderKatex(latex.trim(), true);
  });

  // 4. Inline math: $...$  (avoid matching $$ or currency like $100)
  //    Only match if content contains LaTeX-like commands (\, ^, _, {, })
  result = result.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+)\$/g, (_match, latex: string) => {
    if (/[\\^_{}]/.test(latex)) {
      return renderKatex(latex.trim(), false);
    }
    return _match; // Not LaTeX, leave as-is (e.g. "$100")
  });

  return result;
}

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  } catch {
    // If KaTeX fails, return the original text wrapped in a code element
    return `<code>${latex}</code>`;
  }
}
