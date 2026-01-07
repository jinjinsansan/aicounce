type DiaryShareTextInput = {
  title?: string | null;
  snippet: string;
  authorName?: string | null;
  journalDate?: string | null;
};

const SNIPPET_LIMIT = 90;

const normalizeSnippet = (value: string): string => {
  if (!value) return "";
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= SNIPPET_LIMIT) return compact;
  return `${compact.slice(0, SNIPPET_LIMIT)}…`;
};

const formatDiaryDate = (value?: string | null): string => {
  if (!value) return "今日のひとこと";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "今日のひとこと";
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
};

export const buildDiaryShareText = ({ title, snippet, authorName, journalDate }: DiaryShareTextInput) => {
  const sanitized = normalizeSnippet(snippet);
  const dateLabel = formatDiaryDate(journalDate);
  const lines: string[] = [`【AIカウンセラーの日記 ${dateLabel}】`];

  if (authorName?.trim()) {
    lines.push(`担当: ${authorName.trim()}`);
  }

  if (title?.trim()) {
    lines.push(`「${title.trim()}」`);
  }

  if (sanitized) {
    lines.push(`📝 一言: ${sanitized}`);
  }

  lines.push("#メンタルAIチーム");
  lines.push("#メンタルAIカウンセラー");
  return lines.join("\n");
};
