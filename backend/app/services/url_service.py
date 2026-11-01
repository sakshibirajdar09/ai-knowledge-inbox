import re
from urllib.parse import urlparse
from typing import Tuple
import httpx
import trafilatura

from app.utils.errors import AppException
from app.utils.logger import logger

def clean_html_fallback(html: str) -> Tuple[str, str]:
    """Fallback naive HTML stripping matching the original TypeScript logic."""
    title = ""
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()

    text = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", " ", html, flags=re.IGNORECASE)
    text = re.sub(r"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<\/(p|div|h[1-6]|li|tr|br)[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*\/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    
    # Common HTML entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n", "\n", text).strip()
    return title, text

async def fetch_url_content(url: str) -> Tuple[str, str]:
    """
    Fetches a webpage, cleans the HTML, and returns (title, clean_text).
    Uses Trafilatura for modern article extraction with fallback.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise AppException(400, "INVALID_URL", "Invalid protocol (must be http or https)")
    except Exception:
        raise AppException(400, "INVALID_URL", "The provided URL is invalid or unreachable")

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching URL: {url}")
        raise AppException(504, "FETCH_TIMEOUT", "The request to fetch the URL timed out")
    except Exception as e:
        logger.error(f"Error fetching URL: {url} - {str(e)}")
        raise AppException(400, "INVALID_URL", "The provided URL is invalid or unreachable")

    if response.status_code >= 400:
        logger.error(f"Failed to fetch URL: {url} - Status: {response.status_code}")
        raise AppException(502, "URL_FETCH_FAILED", f"Failed to fetch URL: HTTP {response.status_code}")

    content_type = response.headers.get("content-type", "")
    if "text/html" not in content_type:
        raise AppException(422, "UNSUPPORTED_CONTENT", "URL must return HTML content")

    html = response.text

    # Extract title
    title = url
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if title_match and title_match.group(1).strip():
        title = title_match.group(1).strip()

    # Try high-quality extraction with trafilatura first
    text = trafilatura.extract(html, include_links=False, include_images=False)
    
    # If trafilatura fails to extract or yields too little, use fallback cleaner
    if not text or len(text.strip()) < 50:
        _, fallback_text = clean_html_fallback(html)
        text = fallback_text

    if not text or len(text.strip()) < 50:
        raise AppException(422, "INSUFFICIENT_CONTENT", "Could not extract enough readable text from this URL")

    # Limit text length to prevent memory saturation
    if len(text) > 20000:
        text = text[:20000] + "... (Content truncated for size)"

    return title, text
