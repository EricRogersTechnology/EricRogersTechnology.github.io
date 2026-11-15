#!/usr/bin/env python3
"""Publishes scheduled blog posts.

Drafts live in _scheduled/ (Jekyll skips folders that start with an underscore, so they are not
served). Each draft starts with a comment:

    <!--schedule
    publish: 2026-11-20
    slug: my-post
    title: My post title
    summary: One sentence for the Blog page card.
    -->

When the publish date (US Eastern) arrives, the draft moves to blog/<slug>.html, a card is added to
blog/index.html, and the homepage preview is refreshed. Use {{DATE}} in the draft for the post date.

Usage: python3 scripts/publish_scheduled.py [--dry-run] [--date YYYY-MM-DD] [--root PATH]
"""
import argparse
import html
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
          'September', 'October', 'November', 'December']


def pretty_date(iso):
    y, m, d = (int(p) for p in iso.split('-'))
    return f'{MONTHS[m - 1]} {d}, {y}'


def parse_draft(path):
    raw = path.read_text(encoding='utf-8')
    m = re.match(r'\s*<!--schedule\s*(.*?)-->\s*', raw, re.S)
    if not m:
        raise SystemExit(f'{path.name}: missing the <!--schedule ... --> header')
    meta = {}
    for line in m.group(1).splitlines():
        kv = re.match(r'\s*([a-zA-Z]+)\s*:\s*(.+?)\s*$', line)
        if kv:
            meta[kv.group(1).lower()] = kv.group(2)
    for key in ('publish', 'slug', 'title', 'summary'):
        if not meta.get(key):
            raise SystemExit(f'{path.name}: header is missing "{key}"')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', meta['publish']):
        raise SystemExit(f'{path.name}: publish must look like 2026-11-20')
    if not re.fullmatch(r'[a-z0-9-]+', meta['slug']):
        raise SystemExit(f'{path.name}: slug may only use lowercase letters, numbers and hyphens')
    return {'path': path, 'meta': meta, 'body': raw[m.end():]}


def prepend_card(blog_index, meta):
    text = blog_index.read_text(encoding='utf-8')
    marker = '<!-- BLOG_POSTS_START -->'
    if marker not in text:
        raise SystemExit('Could not find BLOG_POSTS_START in blog/index.html')
    card = (
        f'      <a class="card" href="/blog/{meta["slug"]}.html">\n'
        f'        <p class="post-date">{pretty_date(meta["publish"])}</p>\n'
        f'        <h3>{html.escape(meta["title"], quote=False)}</h3>\n'
        f'        <p>{html.escape(meta["summary"], quote=False)}</p>\n'
        f'      </a>\n'
    )
    blog_index.write_text(text.replace(marker, marker + '\n' + card, 1), encoding='utf-8')


def update_home_preview(blog_index, home_index):
    blog = blog_index.read_text(encoding='utf-8')
    block = re.search(r'<!-- BLOG_POSTS_START -->(.*?)<!-- BLOG_POSTS_END -->', blog, re.S)
    if not block:
        raise SystemExit('Could not find BLOG_POSTS markers in blog/index.html')
    top = re.findall(r'<a class="card".*?</a>', block.group(1), re.S)[:3]
    if not top:
        return
    home = home_index.read_text(encoding='utf-8')
    pattern = re.compile(r'<!-- BLOG_PREVIEW_START -->.*?<!-- BLOG_PREVIEW_END -->', re.S)
    if not pattern.search(home):
        raise SystemExit('Could not find BLOG_PREVIEW markers in index.html')
    replacement = ('<!-- BLOG_PREVIEW_START -->\n' +
                   '\n'.join('          ' + c.strip() for c in top) +
                   '\n          <!-- BLOG_PREVIEW_END -->')
    home_index.write_text(pattern.sub(lambda _: replacement, home, count=1), encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--date')
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    args = ap.parse_args()

    root = Path(args.root)
    draft_dir = root / '_scheduled'
    blog_dir = root / 'blog'
    today = args.date or datetime.now(ZoneInfo('America/New_York')).strftime('%Y-%m-%d')

    if not draft_dir.is_dir():
        print('No _scheduled folder; nothing to do.')
        return
    drafts = sorted((parse_draft(p) for p in draft_dir.glob('*.html')),
                    key=lambda d: d['meta']['publish'])
    print(f'Today (US Eastern): {today}. {len(drafts)} scheduled draft(s).')

    published = 0
    for d in drafts:
        meta, name = d['meta'], d['path'].name
        if meta['publish'] > today:
            print(f'  waiting: {name} (publishes {meta["publish"]})')
            continue
        dest = blog_dir / f'{meta["slug"]}.html'
        if dest.exists():
            print(f'  skipped: {name} (blog/{meta["slug"]}.html already exists)')
            continue
        print(f'  publishing: {name} -> blog/{meta["slug"]}.html')
        if args.dry_run:
            continue
        dest.write_text(d['body'].replace('{{DATE}}', pretty_date(meta['publish'])), encoding='utf-8')
        prepend_card(blog_dir / 'index.html', meta)
        d['path'].unlink()
        published += 1

    if published:
        update_home_preview(blog_dir / 'index.html', root / 'index.html')
        print(f'Published {published} post(s) and refreshed the homepage preview.')
    else:
        print('Nothing to publish.')


if __name__ == '__main__':
    sys.exit(main())
