const fs = require('fs');

const folderPath = 'database/media';

async function generateSMLive() {
  const SOURCE_URL = "https://raw.githubusercontent.com/sm-monirulislam/SM-Live-TV/refs/heads/main/Combined_Live_TV.m3u";

  // যেসব চ্যানেল বা ক্যাটাগরি হাইড করতে চান সেগুলোর নাম (ছোট হাতের অক্ষরে) এখানে কমা দিয়ে দিয়ে লিখুন।
  // ভবিষ্যতে কোনো ডেড চ্যানেল হাইড করতে চাইলে শুধু তার নামটা এখানে বসিয়ে দেবেন।
  const hideKeywords = [
    "tapmad", 
    "toffee"
    "fancode"
  ];

  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch SM Live TV: ${response.status}`);
    }

    const m3uText = await response.text();
    const lines = m3uText.split(/\r?\n/);

    const newM3uLines = ["#EXTM3U\n"];
    let currentBlock = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.toUpperCase() === "#EXTM3U") continue;

      // যদি লাইনটি http দিয়ে শুরু হয় (অর্থাৎ স্ট্রিমিং লিংক), তখন পুরো ব্লকটি প্রসেস করবে
      if (line.startsWith("http") || line.startsWith("rtmp") || line.startsWith("acestream")) {
        currentBlock.push(line);

        // ব্লকের ভেতর থেকে #EXTINF লাইনটি খোঁজা
        let extinfIndex = currentBlock.findIndex(l => l.toUpperCase().startsWith("#EXTINF"));
        
        if (extinfIndex !== -1) {
          let extinfLine = currentBlock[extinfIndex];
          let lowerExtinf = extinfLine.toLowerCase();

          // ১. হাইড করার শর্ত চেক (tapmad, toffee বা লিস্টের অন্য কিছু আছে কিনা)
          let shouldHide = hideKeywords.some(keyword => lowerExtinf.includes(keyword));

          if (!shouldHide) {
            // ২. রিনেম (Rename) করা
            // SM All TV কে All in one reborn করা
            extinfLine = extinfLine.replace(/group-title=["']?SM All TV["']?/gi, 'group-title="All in one reborn"');
            
            // SM_IPTV কে IPTV করা
            extinfLine = extinfLine.replace(/group-title=["']?SM_IPTV["']?/gi, 'group-title="IPTV"');

            // মডিফাই করা লাইনটি ব্লকে আপডেট করা
            currentBlock[extinfIndex] = extinfLine;
            
            // ফাইনাল প্লেলিস্টে ব্লকটি যুক্ত করা
            newM3uLines.push(currentBlock.join("\n"));
          }
        } else {
          // যদি #EXTINF না থাকে, তবুও লিংকটি রেখে দেবে
          newM3uLines.push(currentBlock.join("\n"));
        }

        // পরবর্তী ব্লকের জন্য রিসেট করা
        currentBlock = [];
      } else {
        // লিংক না হলে (যেমন: #EXTINF, #EXTVLCOPT ইত্যাদি) ব্লকে জমা করতে থাকবে
        currentBlock.push(line);
      }
    }

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(`${folderPath}/sm-live.m3u`, newM3uLines.join("\n\n"));
    console.log(`Successfully generated ${folderPath}/sm-live.m3u`);

  } catch (error) {
    console.error("Error generating SM Live M3U:", error.message);
    process.exit(1);
  }
}

generateSMLive();
