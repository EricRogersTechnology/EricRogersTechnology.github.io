// Shows the current App Store screenshots for an app on every device it supports (iPhone, iPad, Mac,
// Apple TV, Apple Watch). The list comes from products/screenshots.json, which a GitHub Action
// refreshes from the App Store pages every few hours, so the gallery follows the App Store on its own.
// If that file can't be loaded, it falls back to Apple's lookup API (iPhone and iPad only).
// Markup: <div class="shots" data-shots="APP_ID" data-store="https://apps.apple.com/app/idAPP_ID">
(function () {
  var DEVICES = [
    { key: 'iphone', label: 'iPhone', height: 420 },
    { key: 'ipad', label: 'iPad', height: 380 },
    { key: 'mac', label: 'Mac', height: 270 },
    { key: 'tv', label: 'Apple TV', height: 230 },
    { key: 'watch', label: 'Apple Watch', height: 300 }
  ];

  // shots: [{url (App Store template with {w}x{h}{c}.{f}), w, h}]
  function imageUrl(shot, displayHeight) {
    var h = displayHeight * 2;
    var w = Math.round(h * shot.w / shot.h);
    return shot.url.replace('{w}', w).replace('{h}', h).replace('{c}', 'bb').replace('{f}', 'webp');
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
      kind.shots.forEach(function (shot, i) {
        var a = document.createElement('a');
        a.href = store;
        a.target = '_blank';
        a.rel = 'noopener';
        var img = document.createElement('img');
        img.src = imageUrl(shot, kind.height);
        img.alt = kind.label + ' screenshot ' + (i + 1);
        img.style.height = kind.height + 'px';
        img.style.width = Math.round(kind.height * shot.w / shot.h) + 'px';
        img.loading = i < 2 ? 'eager' : 'lazy';
        img.decoding = 'async';
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

  function kindsFrom(byDevice) {
    var kinds = [];
    DEVICES.forEach(function (d) {
      var shots = byDevice[d.key];
      if (shots && shots.length) kinds.push({ key: d.key, label: d.label, height: d.height, shots: shots });
    });
    return kinds;
  }

  // Fallback: Apple's lookup API, which only knows iPhone and iPad.
  function fromLookup(id) {
    return fetch('https://itunes.apple.com/lookup?id=' + encodeURIComponent(id) + '&country=us&entity=software')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var app = data.results && data.results[0];
        if (!app) return {};
        function convert(urls) {
          return (urls || []).map(function (u) {
            return { url: u.replace(/\/\d+x\d+(bb|w|h)\.(jpg|png|webp)$/, '/{w}x{h}{c}.{f}'), w: 1, h: 2.17 };
          });
        }
        var out = { iphone: convert(app.screenshotUrls) };
        // iPad screenshots are roughly 3:4
        out.ipad = convert(app.ipadScreenshotUrls).map(function (s) { s.h = 1.333; return s; });
        return out;
      });
  }

  var filePromise = null;
  function loadFile() {
    if (!filePromise) {
      filePromise = fetch('/products/screenshots.json')
        .then(function (r) { if (!r.ok) throw new Error('no file'); return r.json(); });
    }
    return filePromise;
  }

  document.querySelectorAll('[data-shots]').forEach(function (box) {
    var id = box.getAttribute('data-shots');
    var store = box.getAttribute('data-store');
    loadFile()
      .then(function (all) {
        var kinds = kindsFrom(all[id] || {});
        if (!kinds.length) throw new Error('no screenshots in file');
        return kinds;
      })
      .catch(function () { return fromLookup(id).then(kindsFrom); })
      .then(function (kinds) { if (kinds && kinds.length) render(box, store, kinds); })
      .catch(function () { /* keep the fallback link */ });
  });
})();
