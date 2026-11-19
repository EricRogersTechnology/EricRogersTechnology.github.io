#!/usr/bin/env python3
"""Refreshes products/screenshots.json with every App Store screenshot (iPhone, iPad, Mac, Apple TV,
Apple Watch) for each app. Apple's public lookup API only returns iPhone and iPad, so this reads the
App Store web page instead. If a page can't be fetched, that app's previous data is kept.

Usage: python3 scripts/update_screenshots.py [--root PATH]
"""
import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

APPS = {
    '6778179121': 'Clock Rings',
    '6790443097': 'Merit',
    '6792591069': 'Orbit',
}

SHELVES = [  # (shelf key in the page data, name used in the json)
    ('product_media_phone_', 'iphone'),
    ('product_media_pad_', 'ipad'),
    ('product_media_mac_', 'mac'),
    ('product_media_tv_', 'tv'),
    ('product_media_watch_', 'watch'),
]

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/125.0.0.0 Safari/537.36')


def fetch_app(app_id):
    req = urllib.request.Request(f'https://apps.apple.com/us/app/id{app_id}',
                                 headers={'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        page = resp.read().decode('utf-8', 'replace')
    m = re.search(r'<script type="application/json" id="serialized-server-data">(.*?)</script>', page, re.S)
    if not m:
        raise RuntimeError('no serialized-server-data block in the page')
    data = json.loads(m.group(1))
    shelves = data['data'][0]['data']['shelfMapping']
    out = {}
    for key, name in SHELVES:
        items = (shelves.get(key) or {}).get('items') or []
        shots = []
        for it in items:
            art = it.get('screenshot') or {}
            if art.get('template') and art.get('width') and art.get('height'):
                shots.append({'url': art['template'], 'w': art['width'], 'h': art['height']})
        if shots:
            out[name] = shots
    if not out:
        raise RuntimeError('page had no screenshots')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    args = ap.parse_args()

    path = Path(args.root) / 'products' / 'screenshots.json'
    try:
        current = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        current = {}

    result = dict(current)
    for app_id, name in APPS.items():
        try:
            shots = fetch_app(app_id)
        except Exception as e:  # keep the old data for this app
            print(f'{name}: could not refresh ({e}); keeping previous data')
            continue
        counts = ', '.join(f'{k} {len(v)}' for k, v in shots.items())
        print(f'{name}: {counts}')
        result[app_id] = shots

    text = json.dumps(result, indent=1, sort_keys=True) + '\n'
    if path.exists() and path.read_text(encoding='utf-8') == text:
        print('No changes.')
        return
    path.write_text(text, encoding='utf-8')
    print(f'Wrote {path}')


if __name__ == '__main__':
    sys.exit(main())
