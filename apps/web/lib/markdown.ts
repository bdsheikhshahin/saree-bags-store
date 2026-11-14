/**
 * Small Markdown helpers shared by the storefront.
 *
 * `stripMarkdown` turns Markdown back into plain text for places that must
 * stay one-line plain text: meta descriptions, list items and admin table
 * cells. The rich rendering itself is done by react-markdown.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> link text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^>\s?/gm, '') // quotes
    .replace(/^(\s*[-*+]|\s*\d+\.)\s+/gm, '') // list markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/^[-*_]{3,}\s*$/gm, '') // horizontal rules
    .replace(/\s+/g, ' ')
    .trim();
}
