"""Builds card/eric-rogers.vcf (the Save Contact file). Run from the repo root."""

LINKS = [
    ('Website', 'https://ericrogerstechnology.com'),
    ('Digital Business Card', 'https://ericrogerstechnology.com/card/'),
    ('Book a Session', 'https://calendly.com/rogerse/ts'),
    ('YouTube', 'https://www.youtube.com/@EricRogersTechnology'),
    ('GitHub', 'https://github.com/EricRogersTechnology'),
    ('Facebook', 'https://facebook.com/EricRogersTechnology'),
    ('X', 'https://x.com/EricRRogers'),
    ('Instagram (Eric Rogers Photography)', 'https://instagram.com/EricRogersPhotography'),
    ('Facebook (Eric Rogers Photography)', 'https://facebook.com/EricRogersPhotography'),
    ('Eric Rogers Photography', 'https://ericrogersphotography.com'),
]

def fold(line):
    # RFC 6350: fold at 75 octets; continuation lines start with one space
    out, cur = [], ''
    for ch in line:
        if len((cur + ch).encode('utf-8')) > (75 if not out else 74):
            out.append(cur)
            cur = ch
        else:
            cur += ch
    out.append(cur)
    return '\r\n '.join(out)

lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Rogers;Eric;;;',
    'FN:Eric Rogers',
    'ORG:Eric Rogers Technology',
    'TITLE:Apple Developer\\, Home Automation & Tech Support',
    'TEL;TYPE=CELL,VOICE:+1-260-207-4335',
    'EMAIL;TYPE=WORK:Eric@EricRogersTechnology.com',
    'NOTE:Apple tech support\\, smart home consulting\\, and website development.',
]
for i, (label, url) in enumerate(LINKS, 1):
    lines.append(f'item{i}.URL:{url}')
    lines.append(f'item{i}.X-ABLabel:{label}')
lines.append('END:VCARD')

with open('card/eric-rogers.vcf', 'w', newline='') as f:
    f.write('\r\n'.join(fold(l) for l in lines) + '\r\n')
print(len(LINKS), 'links written')
