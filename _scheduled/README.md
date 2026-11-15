# Scheduled blog posts

Drop a finished post here as an `.html` file and it goes live on its own on the publish date
(checked about every 15 minutes by `.github/workflows/publish-scheduled.yml`). This folder starts with an underscore,
so GitHub Pages does not serve it.

Start the file with:

    <!--schedule
    publish: 2026-11-20
    time: 11:11
    slug: my-post
    title: My post title
    summary: One sentence for the Blog page card.
    -->

`time` is optional (24-hour, US Eastern). The job runs about every 15 minutes, so a post goes live
within a few minutes after its time (GitHub can run a little late).

Then the full page (copy any file in `blog/`). Use `{{DATE}}` where the post date should appear,
for example in `<p class="page-meta">{{DATE}}</p>`.

Test locally: `python3 scripts/publish_scheduled.py --dry-run --now '2026-11-20 11:11'`
