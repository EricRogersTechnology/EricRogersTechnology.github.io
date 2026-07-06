const https = require('https');
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = 'UCUNyu_wlTrHuoS0Al3Z6eLw';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const VIDEO_COUNT = 3;

function fetchFeed(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchFeed(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Feed request failed: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseEntries(xml, count) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.slice(0, count).map((entry) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)[1];
    const link = entry.match(/<link rel="alternate" href="([^"]+)"/)[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)[1];
    return {
      videoId,
      title,
      link,
      date: formatDate(published),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  });
}

function renderCard(video) {
  return (
    `        <a class="video-card" href="${escapeAttr(video.link)}" target="_blank" rel="noopener">\n` +
    `          <div class="video-card__thumb-wrap">\n` +
    `            <img class="video-card__thumb" src="${video.thumbnailUrl}" alt="${escapeAttr(video.title)} thumbnail" loading="lazy">\n` +
    `            <div class="video-card__play">\n` +
    `              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>\n` +
    `            </div>\n` +
    `          </div>\n` +
    `          <p class="video-card__title">${video.title}</p>\n` +
    `          <p class="video-card__date">${video.date}</p>\n` +
    `        </a>`
  );
}

async function main() {
  const xml = await fetchFeed(FEED_URL);
  const videos = parseEntries(xml, VIDEO_COUNT);
  if (videos.length === 0) throw new Error('No entries found in feed');

  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  const blockPattern = /<!-- YOUTUBE_GRID_START -->[\s\S]*?<!-- YOUTUBE_GRID_END -->/;
  if (!blockPattern.test(html)) {
    throw new Error('Could not find the YouTube grid markers in index.html');
  }

  const replacement =
    `<!-- YOUTUBE_GRID_START -->\n` +
    `      <div class="video-grid">\n` +
    videos.map(renderCard).join('\n') +
    `\n      </div>\n` +
    `      <!-- YOUTUBE_GRID_END -->`;

  const updated = html.replace(blockPattern, replacement);

  if (updated === html) {
    console.log('No changes needed; videos already up to date.');
    return;
  }

  fs.writeFileSync(INDEX_PATH, updated);
  console.log(`Updated YouTube grid with ${videos.length} videos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
