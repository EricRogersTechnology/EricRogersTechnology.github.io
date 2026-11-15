# Scheduled blog posts

Drop a finished post here as an `.html` file and it goes live on its own on the publish date
(checked daily by `.github/workflows/publish-scheduled.yml`). This folder starts with an underscore,
so GitHub Pages does not serve it.

Start the file with:

    <!--schedule
    publish: 2026-11-20
    slug: my-post
    title: My post title
    summary: One sentence for the Blog page card.
    -->

Then the full page (copy any file in `blog/`). Use `{{DATE}}` where the post date should appear,
for example in `<p class="page-meta">{{DATE}}</p>`.

Test locally: `python3 scripts/publish_scheduled.py --dry-run --date 2026-11-20`
