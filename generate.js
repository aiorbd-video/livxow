const fs = require('fs');

async function generateM3U() {
    const eventsUrl = "https://ratulxadia-playz-cats-event.hf.space/api/events";
    const streamsUrl = "https://ratul-liv-default-rtdb.asia-southeast1.firebasedatabase.app/playz-streams.json";

    try {
        // ডেটা ফেচ করা (বট প্রোটেকশন বাইপাস করতে ফেক User-Agent ব্যবহার করা হয়েছে)
        const fetchOptions = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            }
        };

        const [eventsRes, streamsRes] = await Promise.all([
            fetch(eventsUrl, fetchOptions),
            fetch(streamsUrl, fetchOptions)
        ]);

        const eventsData = await eventsRes.json();
        const streamsData = await streamsRes.json();

        let m3u = `#EXTM3U\n\n` +
                  `#EXTINF:-1 tvg-logo="https://telegram.org/img/t_logo.png" group-title="📢 SOCIAL MEDIA", 🚀 JOIN TELEGRAM CHANNEL\n` +
                  `https://raw.githubusercontent.com/aiorbd-video/video/refs/heads/main/test1/output.m3u8\n\n` +
                  `#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" group-title="📢 SOCIAL MEDIA", 🌐 JOIN FACEBOOK GROUP\n` +
                  `https://raw.githubusercontent.com/aiorbd-video/video/refs/heads/main/Allinonesocialvid/output.m3u8\n\n`;

        for (const item of eventsData) {
            const event = item.event;
            if (event.visible === false) continue;

            let slug = null;
            if (event.links) {
                const match = event.links.match(/pro\/(.*?)\.txt/);
                if (match && match[1]) slug = match[1];
            }

            if (slug && streamsData[slug] && streamsData[slug].streams) {
                const category = event.category || 'Live Sports';
                const eventName = event.eventName || 'Live Event';
                const teamA = event.teamAName || '';
                const teamB = event.teamBName || '';
                const logo = event.eventLogo || '';
                
                let matchTitle = eventName;
                if (teamA && teamB) matchTitle += ` (${teamA} vs ${teamB})`;
                const folderName = `${category}: ${matchTitle}`;

                for (const stream of streamsData[slug].streams) {
                    const streamName = stream.name || 'Live Stream';
                    const linkTag = stream.linkTag ? ` [${stream.linkTag}]` : '';
                    let streamUrl = stream.link || '';
                    const drmKey = stream.api || '';

                    if (!streamUrl || streamUrl === 'https://no.link') continue;

                    let streamHeaders = "";
                    if (streamUrl.includes('|')) {
                        let [u, h] = streamUrl.split('|');
                        h = h.replace(/user-agent=/gi, "User-Agent=")
                             .replace(/referer=/gi, "Referer=")
                             .replace(/origin=/gi, "Origin=")
                             .replace(/cookie=/gi, "Cookie=");
                        streamUrl = u + "|" + h; 
                        streamHeaders = h;       
                    }

                    m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${folderName}", ${streamName}${linkTag}\n`;
                    
                    if (drmKey) {
                        m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
                        m3u += `#KODIPROP:inputstream.adaptive.license_key=${drmKey}\n`;
                    }
                    if (streamHeaders) {
                        m3u += `#KODIPROP:inputstream.adaptive.stream_headers=${streamHeaders}\n`;
                    }
                    
                    m3u += `${streamUrl}\n\n`;
                }
            }
        }

        // M3U ফাইলটি সেভ করা
        fs.writeFileSync('playlist.m3u', m3u);
        console.log("Successfully generated playlist.m3u");

    } catch (error) {
        console.error("Error generating M3U:", error);
        process.exit(1);
    }
}

generateM3U();
