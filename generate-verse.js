const fs = require('fs');

async function generateVerse() {
  const jsonUrl = 'https://verse-tv-141bb-default-rtdb.asia-southeast1.firebasedatabase.app/channels.json';

  try {
    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Firebase: ${response.status}`);
    }

    const data = await response.json();
    let m3u = "#EXTM3U\n";

    for (const key in data) {
      const channel = data[key];
      const name = channel.name || 'Unknown Channel';
      const logo = channel.logoUrl || '';
      const group = channel.category || 'Uncategorized';
      const streamUrl = channel.streamUrl || '';

      if (streamUrl) {
        m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${group}",${name}\n`;
        m3u += `${streamUrl}\n`;
      }
    }

    // ফাইলটি গিটহাবে সেভ করা হচ্ছে
    fs.writeFileSync('verse.m3u', m3u);
    console.log("Successfully generated verse.m3u");

  } catch (error) {
    console.error("Error generating Verse M3U:", error.message);
    process.exit(1);
  }
}

generateVerse();
