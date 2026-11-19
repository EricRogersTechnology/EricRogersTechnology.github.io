// Shows the current App Store screenshots for an app. The images come straight from Apple's public
// lookup API, so they change on their own whenever the screenshots are updated on the App Store.
// Markup: <div class="shots" data-shots="APP_ID" data-store="https://apps.apple.com/app/idAPP_ID">
(function () {
  function resize(url, size) {
    return url.replace(/\/\d+x\d+(bb|w|h)\.(jpg|png|webp)$/, '/' + size + 'bb.webp');
  }

  function render(box, store, kinds) {
    box.textContent = '';
    var tabs = null;
    var row = document.createElement('div');
    row.className = 'shots-row';
    row.setAttribute('role', 'region');
    row.setAttribute('aria-label', 'App Store screenshots');

    function show(kind) {
      row.textContent = '';
      row.scrollLeft = 0;
      kind.urls.forEach(function (url, i) {
        var a = document.createElement('a');
        a.href = store;
        a.target = '_blank';
        a.rel = 'noopener';
        var img = document.createElement('img');
        img.src = resize(url, kind.size);
        img.alt = kind.label + ' screenshot ' + (i + 1);
        img.loading = i < 2 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.className = 'shots-' + kind.key;
        a.appendChild(img);
        row.appendChild(a);
      });
      if (tabs) {
        tabs.querySelectorAll('button').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.key === kind.key ? 'true' : 'false');
        });
      }
    }

    if (kinds.length > 1) {
      tabs = document.createElement('div');
      tabs.className = 'shots-tabs';
      kinds.forEach(function (kind) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = kind.label;
        b.dataset.key = kind.key;
        b.addEventListener('click', function () { show(kind); });
        tabs.appendChild(b);
      });
      box.appendChild(tabs);
    }
    box.appendChild(row);
    show(kinds[0]);
  }

  document.querySelectorAll('[data-shots]').forEach(function (box) {
    var id = box.getAttribute('data-shots');
    var store = box.getAttribute('data-store');
    fetch('https://itunes.apple.com/lookup?id=' + encodeURIComponent(id) + '&country=us&entity=software')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var app = data.results && data.results[0];
        if (!app) return;
        var kinds = [];
        if (app.screenshotUrls && app.screenshotUrls.length) {
          kinds.push({ key: 'iphone', label: 'iPhone', urls: app.screenshotUrls, size: '500x1100' });
        }
        if (app.ipadScreenshotUrls && app.ipadScreenshotUrls.length) {
          kinds.push({ key: 'ipad', label: 'iPad', urls: app.ipadScreenshotUrls, size: '700x1000' });
        }
        if (kinds.length) render(box, store, kinds);
      })
      .catch(function () { /* keep the fallback link */ });
  });
})();
