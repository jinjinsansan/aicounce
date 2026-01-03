export interface SinrChunkOptions {
  parentSize?: number;
  parentOverlap?: number;
  childSize?: number;
  childOverlap?: number;
}

export interface ChildChunk {
  content: string;
  index: number;
}

export interface ParentChunk {
  content: string;
  index: number;
  children: ChildChunk[];
}

const DEFAULT_OPTIONS: Required<SinrChunkOptions> = {
  parentSize: 800,
  parentOverlap: 100,
  childSize: 200,
  childOverlap: 50,
};

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  if (chunkSize <= overlap) {
    throw new Error("chunkSize must be greater than overlap");
  }

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const step = chunkSize - overlap;
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const slice = normalized.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end === normalized.length) break;
    start += step;
  }

  return chunks;
}

export function chunkTextSinr(text: string, options: SinrChunkOptions = {}): ParentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const parentContents = splitIntoChunks(text, opts.parentSize, opts.parentOverlap);

  return parentContents.map((parentContent, parentIndex) => {
    const childContents = splitIntoChunks(parentContent, opts.childSize, opts.childOverlap);
    const children: ChildChunk[] = childContents.map((childContent, childIndex) => ({
      content: childContent,
      index: childIndex,
    }));

    return { content: parentContent, index: parentIndex, children };
  });
}
