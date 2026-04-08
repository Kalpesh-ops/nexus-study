import os
import re
import httpx
from urllib.parse import urlparse


async def verify_urls_safe_browsing(text: str) -> bool:
    """
    Extract URLs from text and verify them against Google Safe Browsing API.
    
    Args:
        text: String that may contain URLs
        
    Returns:
        bool: True if all URLs are safe, False if any URL is malicious
    """
    # Extract URLs from text
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, text)
    
    if not urls:
        return True  # No URLs found, so text is safe
    
    # Check each URL against Google Safe Browsing API
    for url in urls:
        is_safe = await _check_url_with_google_safe_browsing(url)
        if not is_safe:
            return False  # Found a malicious URL
    
    return True  # All URLs are safe


async def _check_url_with_google_safe_browsing(url: str) -> bool:
    """
    Check a single URL against Google Safe Browsing API.
    
    Args:
        url: The URL to check
        
    Returns:
        bool: True if URL is safe, False if it's malicious
    """
    api_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")
    
    if not api_key:
        # If API key is not set, default to treating URLs as safe
        return True
    
    try:
        # Validate URL format
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return True  # Invalid URL format, treat as safe
        
        # Google Safe Browsing API endpoint
        endpoint = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        
        payload = {
            "client": {
                "clientId": "nexus-study",
                "clientVersion": "0.1.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "POTENTIALLY_HARMFUL_APPLICATION",
                    "UNWANTED_SOFTWARE"
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                json=payload,
                params={"key": api_key},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                # If matches are found, the URL is malicious
                return "matches" not in data or len(data.get("matches", [])) == 0
            else:
                # On API error, default to treating as safe
                return True
                
    except Exception as e:
        # Log error and default to safe
        print(f"Error checking URL with Google Safe Browsing API: {e}")
        return True
