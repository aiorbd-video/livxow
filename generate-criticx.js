const fs = require('fs');

// ফোল্ডারের পাথ (আগেরগুলোর মতোই)
const folderPath = 'database/media';

async function generateCriticx() {
  const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/criticx-tv/databases/(default)/documents/channels?pageSize=1000';

  try {
    // বট প্রোটেকশন এড়াতে স্ট্যান্ডার্ড হেডার ব্যবহার করা হলো
    const response = await fetch(firestoreUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Firestore: ${response.status}`);
    }

    const data = await response.json();

    if (!data.documents) {
      throw new Error("No channels found or database permission denied.");
    }

    // JSON ডাটা থেকে চ্যানেলগুলোর ইনফরমেশন বের করা
    let channels = data.documents.map(doc => {
      const fields = doc.fields || {};
      return {
        name: fields.name?.stringValue || 'Unknown Channel',
        logo: fields.logo?.stringValue || '',
        category: fields.category?.stringValue || 'Uncategorized',
        url: fields.url?.stringValue || '',
        order: parseInt(fields.order?.integerValue || '999', 10)
      };
    });

    // 'order' ভ্যালু অনুযায়ী চ্যানেলগুলো ছোট থেকে বড় ক্রমানুসারে সাজানো
    channels.sort((a, b) => a.order - b.order);

    // M3U ফরম্যাটে কনভার্ট করা
    let m3uContent = '#EXTM3U\n';
    channels.forEach(ch => {
      if (ch.url) {
        m3uContent += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${ch.category}",${ch.name}\n`;
        m3uContent += `${ch.url}\n`;
      }
    });

    // ফোল্ডার না থাকলে তৈরি করবে
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // নির্দিষ্ট ফোল্ডারে ফাইল সেভ করবে
    fs.writeFileSync(`${folderPath}/criticx.m3u`, m3uContent);
    console.log(`Successfully generated ${folderPath}/criticx.m3u`);

  } catch (error) {
    console.error("Error generating Criticx M3U:", error.message);
    process.exit(1);
  }
}

generateCriticx();
