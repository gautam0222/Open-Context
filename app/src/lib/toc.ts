export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function generateTableOfContents(content: string): TOCItem[] {
  const lines = content.split('\n');
  const toc: TOCItem[] = [];
  let headingCount = 0;

  lines.forEach((line, index) => {
    // Match markdown headings (# Heading)
    const markdownMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (markdownMatch) {
      const level = markdownMatch[1].length;
      const text = markdownMatch[2].trim();
      const id = `heading-${headingCount++}`;
      toc.push({ id, text, level });
      return;
    }

    // Match common heading patterns in plain text
    const trimmed = line.trim();
    
    // ALL CAPS (likely a heading)
    if (trimmed.length > 0 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      const id = `heading-${headingCount++}`;
      toc.push({ id, text: trimmed, level: 2 });
      return;
    }

    // Lines ending with : or - (section markers)
    if (trimmed.length > 0 && trimmed.length < 80 && /[:—]$/.test(trimmed)) {
      const id = `heading-${headingCount++}`;
      toc.push({ id, text: trimmed, level: 3 });
      return;
    }
  });

  return toc;
}

export function injectTOCIds(content: string, toc: TOCItem[]): string {
  let result = content;
  let headingIndex = 0;

  // Replace headings with anchor-ready versions
  const lines = result.split('\n');
  const newLines = lines.map(line => {
    const markdownMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (markdownMatch && headingIndex < toc.length) {
      const item = toc[headingIndex++];
      return `<h${item.level} id="${item.id}">${item.text}</h${item.level}>`;
    }

    const trimmed = line.trim();
    if (
      (trimmed.length > 0 && trimmed.length < 100 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      (trimmed.length > 0 && trimmed.length < 80 && /[:—]$/.test(trimmed))
    ) {
      if (headingIndex < toc.length) {
        const item = toc[headingIndex++];
        return `<h${item.level} id="${item.id}" class="font-bold text-gray-900 mt-8 mb-4">${item.text}</h${item.level}>`;
      }
    }

    return line;
  });

  return newLines.join('\n');
}