import urllib.request
import re

req = urllib.request.Request('https://rocketdesigners.com/', headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
})

try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    fonts = re.findall(r'family=([^&"\']+)', html)
    print("FONTS FOUND:")
    for font in fonts:
        print(font)
except Exception as e:
    print(f"Error: {e}")
