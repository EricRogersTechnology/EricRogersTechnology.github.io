const https = require('https');
const fs = require('fs');
const path = require('path');

const CHANNEL_ID = 'UCUNyu_wlTrHuoS0Al3Z6eLw';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const BLOG_INDEX_PATH = path.join(ROOT, 'blog', 'index.html');
const BLOG_DIR = path.join(ROOT, 'blog');
const VIDEO_COUNT = 3;
const CLOCKRINGS_TITLE_MATCH = /clock rings/i;

function fetchFeedOnce(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchFeedOnce(res.headers.location).then(resolve, reject);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeed(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchFeedOnce(url);
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`Feed fetch attempt ${attempt} failed (${err.message}), retrying...`);
      await sleep(attempt * 2000);
    }
  }
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

function parseAllEntries(xml) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map((entry) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)[1];
    const link = entry.match(/<link rel="alternate" href="([^"]+)"/)[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)[1];
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
    return {
      videoId,
      title,
      link,
      published,
      date: formatDate(published),
      description: descMatch ? descMatch[1].trim() : '',
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

function updateYouTubeGrid(videos) {
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
    console.log('No changes needed; YouTube grid already up to date.');
    return;
  }

  fs.writeFileSync(INDEX_PATH, updated);
  console.log(`Updated YouTube grid with ${videos.length} videos.`);
}

function videoAlreadyCovered(videoId) {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html'));
  return files.some((file) => {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    return content.includes(videoId);
  });
}

function descriptionToHtml(description) {
  if (!description) return '';
  const blocks = description.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => `    <p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

const SHARED_HEAD = (title, description) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Eric Rogers Technology</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="theme-color" id="theme-color-meta" content="#ffffff">
  <script>
    (function () {
      try {
        var stored = localStorage.getItem('theme');
        var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (stored === 'light' || stored === 'dark') {
          document.documentElement.setAttribute('data-theme', stored);
        }
        document.getElementById('theme-color-meta').setAttribute('content', isDark ? '#000000' : '#ffffff');
      } catch (e) {}
    })();
  <\/script>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap">
  <link rel="stylesheet" href="/style.css?v=2">
  <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
</head>
<body>

  <nav class="topbar" id="topbar" aria-label="Primary">
    <div class="container topbar-inner">
      <a href="/" class="topbar-brand">
        <img class="topbar-logo logo-dark" src="/ert-logo-dark.png" alt="Eric Rogers Technology">
        <img class="topbar-logo logo-light" src="/ert-logo-light.png" alt="Eric Rogers Technology">
      </a>

      <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="topbar-links" aria-label="Toggle menu">
        <span class="burger"></span>
      </button>

      <div class="topbar-links" id="topbar-links">
        <a href="/#services">Services</a>
        <a href="/#products">Products</a>
        <a href="/#youtube">YouTube</a>
        <a href="/blog/">Blog</a>
        <a href="/#contact">Contact</a>
      </div>
    </div>
  </nav>
`;

const SHARED_FOOTER = `
  <footer id="contact">
    <div class="container">
      <div class="social-row">
        <a class="social-icon" href="https://github.com/EricRogersTechnology" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
        </a>
        <a class="social-icon" href="https://www.youtube.com/@EricRogersTechnology" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5s-.23-1.64-.94-2.36c-.9-.95-1.9-.95-2.36-1.01C16.9 2.8 12 2.8 12 2.8h-.01s-4.9 0-8.2.33c-.46.06-1.46.06-2.36 1.01C.72 4.86.5 6.5.5 6.5S.27 8.42.27 10.34v1.8c0 1.92.23 3.84.23 3.84s.23 1.64.93 2.36c.9.95 2.08.92 2.6 1.02 1.9.19 8.02.32 8.02.32s4.9-.01 8.2-.33c.46-.06 1.46-.06 2.36-1.01.71-.72.94-2.36.94-2.36s.23-1.92.23-3.84v-1.8c0-1.92-.23-3.84-.23-3.84ZM9.6 14.6V7.9l6.2 3.36-6.2 3.35Z"/></svg>
        </a>
        <a class="social-icon" href="https://facebook.com/EricRogersTechnology" target="_blank" rel="noopener" aria-label="Facebook – Eric Rogers Technology" title="Facebook – Eric Rogers Technology">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.68 18.63.5 12 .5S0 5.68 0 12.07c0 5.78 4.39 10.57 10.13 11.43v-8.09H7.08v-3.34h3.05V9.41c0-2.99 1.79-4.65 4.53-4.65 1.31 0 2.68.23 2.68.23v2.92h-1.51c-1.49 0-1.95.92-1.95 1.86v2.24h3.32l-.53 3.34h-2.79v8.09C19.61 22.64 24 17.85 24 12.07Z"/></svg>
        </a>
        <a class="social-icon" href="https://x.com/EricRRogers" target="_blank" rel="noopener" aria-label="X (Twitter)" title="X (Twitter)">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.83-5.97 6.83H1.66l7.73-8.84L1.24 2.25h6.83l4.72 6.24 5.45-6.24Zm-1.16 17.52h1.83L7.02 4.13H5.06l12.02 15.64Z"/></svg>
        </a>
        <a class="social-icon" href="mailto:Eric@EricRogersTechnology.com?subject=Message%20from%20EricRogersTechnology.com" aria-label="Email" title="Eric@EricRogersTechnology.com">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1.5" y="4.5" width="21" height="15" rx="2"/><path d="m2.5 6 9.5 7 9.5-7"/></svg>
        </a>
        <a class="social-icon" href="tel:+12602074335" aria-label="Phone" title="260.207.4335">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"/></svg>
        </a>
        <a class="social-icon" href="https://calendly.com/rogerse/ts" target="_blank" rel="noopener" aria-label="Book on Calendly" title="Book on Calendly">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4" width="19" height="18" rx="2"/><path d="M2.5 9.5h19M7.5 2v4M16.5 2v4"/></svg>
        </a>
        <a class="social-icon" href="https://instagram.com/EricRogersPhotography" target="_blank" rel="noopener" aria-label="Instagram – Eric Rogers Photography" title="Instagram – Eric Rogers Photography">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.8" cy="6.2" r="1.1" fill="currentColor" stroke="none"/></svg>
        </a>
        <a class="social-icon" href="https://facebook.com/EricRogersPhotography" target="_blank" rel="noopener" aria-label="Facebook – Eric Rogers Photography" title="Facebook – Eric Rogers Photography">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.68 18.63.5 12 .5S0 5.68 0 12.07c0 5.78 4.39 10.57 10.13 11.43v-8.09H7.08v-3.34h3.05V9.41c0-2.99 1.79-4.65 4.53-4.65 1.31 0 2.68.23 2.68.23v2.92h-1.51c-1.49 0-1.95.92-1.95 1.86v2.24h3.32l-.53 3.34h-2.79v8.09C19.61 22.64 24 17.85 24 12.07Z"/></svg>
        </a>
        <a class="social-icon" href="https://ericrogersphotography.com" target="_blank" rel="noopener" aria-label="Eric Rogers Photography website" title="EricRogersPhotography.com">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 8.5h15a3 3 0 0 1 3 3V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.5Z"/><path d="M2 8.5V6a2 2 0 0 1 2-2h4l2 2.5"/><circle cx="15" cy="14.5" r="3"/></svg>
        </a>

        <span class="social-divider" aria-hidden="true"></span>

        <button class="social-icon theme-toggle" id="theme-toggle" type="button" aria-label="Toggle dark mode">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/></svg>
        </button>
      </div>

      <p class="copyright">&copy; 2026 Eric Rogers Technology</p>
    </div>
  </footer>

  <script>
    (function () {
      var toggle = document.getElementById('menu-toggle');
      var links = document.getElementById('topbar-links');
      if (!toggle || !links) return;

      toggle.addEventListener('click', function () {
        var isOpen = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      links.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          links.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    })();

    (function () {
      var root = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      var meta = document.getElementById('theme-color-meta');
      if (!toggle) return;

      function effectiveTheme() {
        var explicit = root.getAttribute('data-theme');
        if (explicit === 'light' || explicit === 'dark') return explicit;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      function sync() {
        var theme = effectiveTheme();
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
      }

      sync();

      toggle.addEventListener('click', function () {
        var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try {
          localStorage.setItem('theme', next);
        } catch (e) {}
        sync();
      });

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);
    })();
  <\/script>

  <!-- Calendly badge widget begin -->
  <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async><\/script>
  <script type="text/javascript">
    window.onload = function() {
      Calendly.initBadgeWidget({ url: 'https://calendly.com/rogerse/ts', text: 'Schedule your next Tech Support Session', color: '#0069ff', textColor: '#ffffff', branding: true });
    }
  <\/script>
  <!-- Calendly badge widget end -->
</body>
</html>
`;

function renderVideoPost(video) {
  const description = `A look at ${video.title} in ClockRings.`;
  return (
    SHARED_HEAD(video.title, description) +
    `
  <header class="page-hero">
    <div class="container">
      <h1>${video.title}</h1>
      <p class="page-meta">${video.date}</p>
    </div>
  </header>

  <div class="container back-link-row">
    <a class="back-link" href="/blog/">&larr; Back to Blog</a>
  </div>

  <main class="post-body">

    <div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${video.videoId}" title="${escapeAttr(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>

${descriptionToHtml(video.description)}

    <a class="button secondary" href="${escapeAttr(video.link)}" target="_blank" rel="noopener">Watch on YouTube</a>

  </main>
` +
    SHARED_FOOTER
  );
}

function firstDescriptionLine(description) {
  const line = (description || '').split('\n').find((l) => l.trim().length > 0);
  return line ? line.trim() : '';
}

function prependBlogIndexCard(video) {
  const blogHtml = fs.readFileSync(BLOG_INDEX_PATH, 'utf8');
  const marker = '<!-- BLOG_POSTS_START -->';
  if (!blogHtml.includes(marker)) {
    throw new Error('Could not find BLOG_POSTS_START marker in blog/index.html');
  }

  const excerpt = firstDescriptionLine(video.description).slice(0, 160);

  const card =
    `      <a class="card" href="/blog/video-${video.videoId}.html">\n` +
    `        <p class="post-date">${video.date}</p>\n` +
    `        <h3>${video.title}</h3>\n` +
    `        <p>${excerpt}</p>\n` +
    `      </a>\n`;

  const updated = blogHtml.replace(marker, marker + '\n' + card);
  fs.writeFileSync(BLOG_INDEX_PATH, updated);
}

function generateNewVideoPosts(allVideos) {
  const clockRingsVideos = allVideos.filter((v) => CLOCKRINGS_TITLE_MATCH.test(v.title));
  let created = 0;

  // Oldest first, so the blog index ends up newest-first after repeated prepending.
  const chronological = [...clockRingsVideos].sort(
    (a, b) => new Date(a.published) - new Date(b.published)
  );

  for (const video of chronological) {
    if (videoAlreadyCovered(video.videoId)) continue;

    const postPath = path.join(BLOG_DIR, `video-${video.videoId}.html`);
    fs.writeFileSync(postPath, renderVideoPost(video));
    prependBlogIndexCard(video);
    created += 1;
    console.log(`Created blog post for "${video.title}" (${video.videoId}).`);
  }

  return created;
}

function updateBlogPreview() {
  const blogHtml = fs.readFileSync(BLOG_INDEX_PATH, 'utf8');
  const blogBlockMatch = blogHtml.match(/<!-- BLOG_POSTS_START -->([\s\S]*?)<!-- BLOG_POSTS_END -->/);
  if (!blogBlockMatch) {
    throw new Error('Could not find BLOG_POSTS markers in blog/index.html');
  }

  const cardMatches = blogBlockMatch[1].match(/<a class="card"[\s\S]*?<\/a>/g) || [];
  const topThree = cardMatches.slice(0, 3);
  if (topThree.length === 0) return;

  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  const previewPattern = /<!-- BLOG_PREVIEW_START -->[\s\S]*?<!-- BLOG_PREVIEW_END -->/;
  if (!previewPattern.test(indexHtml)) {
    throw new Error('Could not find BLOG_PREVIEW markers in index.html');
  }

  const replacement =
    `<!-- BLOG_PREVIEW_START -->\n` +
    topThree.map((card) => '          ' + card.trim()).join('\n') +
    `\n          <!-- BLOG_PREVIEW_END -->`;

  const updated = indexHtml.replace(previewPattern, replacement);
  if (updated === indexHtml) {
    console.log('Homepage blog preview already up to date.');
    return;
  }

  fs.writeFileSync(INDEX_PATH, updated);
  console.log('Updated homepage blog preview with the latest 3 posts.');
}

async function main() {
  const xml = await fetchFeed(FEED_URL);
  const allVideos = parseAllEntries(xml);
  if (allVideos.length === 0) throw new Error('No entries found in feed');

  updateYouTubeGrid(allVideos.slice(0, VIDEO_COUNT));

  const created = generateNewVideoPosts(allVideos);
  if (created === 0) {
    console.log('No new Clock Rings videos to blog about.');
  }

  updateBlogPreview();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
