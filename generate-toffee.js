const fs = require('fs');

// আপনার পছন্দমতো ফোল্ডারের পাথ দিন
const folderPath = 'database/media'; 

async function generateToffee() {
  const SOURCE_URL = "https://raw.githubusercontent.com/BINOD-XD/Toffee-Auto-Update-Playlist/refs/heads/main/toffee_OTT_Navigator.m3u";

  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    let m3uText = await response.text();

    m3uText = m3uText
      .replace(/(#EXTVLCOPT)/gi, "\n$1")
      .replace(/(#EXTHTTP)/gi, "\n$1")
      .replace(/}(https?:\/\/)/gi, "}\n$1");

    const lines = m3uText.split(/\r?\n/);

    let ua = "";
    let cookie = "";
    const m3u = ["#EXTM3U"];
    let currentExtinf = "";

    for (const raw of lines) {
      const line = raw.trim();

      if (!line || line.toUpperCase() === "#EXTM3U") continue;

      if (line.startsWith("#EXTVLCOPT:http-user-agent=")) {
        ua = line.substring(27).trim();
        continue;
      }

      if (line.startsWith("#EXTHTTP:")) {
        try {
          const obj = JSON.parse(line.substring(9).trim());
          cookie = obj.cookie || "";
        } catch {}
        continue;
      }

      if (line.toUpperCase().startsWith("#EXTINF")) {
        currentExtinf = line;
        m3u.push(line);
        continue;
      }

      if (line.startsWith("http")) {
        let suffix = "";

        if (ua || cookie) {
          const arr = [];
          if (ua) arr.push(`User-Agent=${ua}`);
          if (cookie) arr.push(`Cookie=${cookie}`);
          suffix = "|" + arr.join("&");
        }

        m3u.push(line + suffix);
        currentExtinf = "";
        ua = "";
        cookie = "";
      }
    }

    // ফোল্ডার না থাকলে তৈরি করবে
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // নির্দিষ্ট ফোল্ডারে ফাইল সেভ করবে
    fs.writeFileSync(`${folderPath}/toffee.m3u`, m3u.join("\n"));
    console.log(`Successfully generated ${folderPath}/toffee.m3u`);

  } catch (e) {
    console.error("Error generating Toffee M3U:", e.message);
    process.exit(1);
  }
}

generateToffee();
