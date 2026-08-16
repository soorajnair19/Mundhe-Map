function labeledLine(block: string): { label: string; detail: string } | null {
  const match = block.match(/^([^:]{2,80}):\s+(.+)$/);
  if (!match) return null;
  const label = match[1].trim();
  const detail = match[2].trim();
  if (!label || !detail) return null;
  if (label.split(/\s+/).length > 8) return null;
  return { label, detail };
}

function expandInlineLabels(text: string): string {
  if (text.includes("\n")) return text;
  return text.replace(/\.\s+(?=[A-Z][^:]{1,60}:\s)/g, ".\n");
}

export function parseSummary(text: string): {
  intro: string[];
  items: { label: string; detail: string }[];
} {
  const blocks = expandInlineLabels(text)
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const intro: string[] = [];
  const items: { label: string; detail: string }[] = [];

  for (const block of blocks) {
    const item = labeledLine(block);
    if (item) items.push(item);
    else intro.push(block);
  }

  return { intro, items };
}

export function FormattedSummary({ text }: { text: string }) {
  const { intro, items } = parseSummary(text);

  return (
    <div className="space-y-3">
      {intro.map((paragraph, index) => (
        <p key={`intro-${index}`} className="text-sm leading-relaxed text-[var(--ink)]">
          {paragraph}
        </p>
      ))}
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="border-l-2 border-[var(--case-accent,var(--accent))] pl-3 text-sm leading-relaxed"
            >
              <p className="font-medium text-[var(--ink)]">{item.label}</p>
              <p className="text-[var(--ink)]">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
