const https = require('https');
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = 'UCUNyu_wlTrHuoS0Al3Z6eLw';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  const xml = await fetchFeed(FEED_URL);
  const entryMatch = xml.match(/<entry>[\s\S]*?<\/entry>/);
  if (!entryMatch) throw new Error('No entries found in feed');
  const entry = entryMatch[0];

  const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
  if (!videoIdMatch || !titleMatch) throw new Error('Could not parse video id/title from feed entry');

  const videoId = videoIdMatch[1];
  const title = titleMatch[1];
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  const blockPattern = /<div class="video-embed" data-video-id="[^"]*">[\s\S]*?<\/div>\s*<h3>[^<]*<\/h3>/;
  if (!blockPattern.test(html)) {
    throw new Error('Could not find the video-embed block in index.html');
  }

  const replacement =
    `<div class="video-embed" data-video-id="${videoId}">\n` +
    `            <img src="${thumbnailUrl}" alt="${escapeHtml(title)} video thumbnail" loading="lazy">\n` +
    `            <button class="play-button" aria-label="Play video"></button>\n` +
    `          </div>\n` +
    `          <h3>${escapeHtml(title)}</h3>`;

  const updated = html.replace(blockPattern, replacement);

  if (updated === html) {
    console.log('No changes needed; video already up to date.');
    return;
  }

  fs.writeFileSync(INDEX_PATH, updated);
  console.log(`Updated YouTube section to latest video: "${title}" (${videoId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
