export const chunkText = (text: string, chunkSize: number = 500, overlap: number = 100): string[] => {
  if (!text || text.trim().length === 0) return [];
  
  const chunks: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    let end = i + chunkSize;
    
    // Don't split words if possible
    if (end < text.length) {
      // Find the last space before the limit
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > i) {
        end = lastSpace;
      }
    }
    
    chunks.push(text.substring(i, end).trim());
    
    if (end >= text.length) {
      break;
    }
    
    // Move forward by chunk size minus overlap
    i = end - overlap;
    
    // Make sure we always make progress to avoid infinite loop
    if (i <= chunks[chunks.length - 1].length - chunkSize + overlap) {
        i = end;
    }
  }
  
  return chunks;
};
