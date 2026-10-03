import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export const fetchUrlContent = async (url: string): Promise<{ title: string, text: string }> => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    
    // In a real app we'd use something like puppeteer or jsdom + readability
    // For this MVP, we do a simple fetch and naive HTML stripping
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AI Knowledge Inbox / 1.0 (MVP)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new AppError(502, 'URL_FETCH_FAILED', `Failed to fetch URL: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new AppError(422, 'UNSUPPORTED_CONTENT', 'URL must return HTML content');
    }
    
    const html = await response.text();
    
    // Naive title extraction
    let title = url;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // Very naive HTML to text conversion (removes scripts, styles, and tags)
    // 1. Remove script and style blocks
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    // 2. Replace common block elements with newlines
    text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, '\n');
    text = text.replace(/<br\s*[\/]?>/gi, '\n');
    // 3. Remove all remaining tags
    text = text.replace(/<[^>]+>/g, ' ');
    // 4. Decode some common HTML entities
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    // 5. Clean up multiple spaces and empty lines
    text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    if (text.length < 50) {
      throw new AppError(422, 'INSUFFICIENT_CONTENT', 'Could not extract enough readable text from this URL');
    }
    
    return { title, text };
  } catch (error: any) {
    logger.error(`Failed to fetch URL: ${url}`, error);
    if (error instanceof AppError) throw error;
    if (error.name === 'AbortError') {
      throw new AppError(504, 'FETCH_TIMEOUT', 'The request to fetch the URL timed out');
    }
    throw new AppError(400, 'INVALID_URL', 'The provided URL is invalid or unreachable');
  }
};
