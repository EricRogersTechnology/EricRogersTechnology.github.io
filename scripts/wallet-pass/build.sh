#!/bin/bash
# Builds and signs card/eric-rogers.pkpass for Apple Wallet.
# Needs in ~/.ert-wallet-pass/ : pass.key (private key), pass.cer (Pass Type ID cert from Apple),
# wwdr.cer (Apple WWDR intermediate certificate, DER).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
keys="${PASS_KEYS:-$HOME/.ert-wallet-pass}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cp "$here"/src/* "$work"/
openssl x509 -inform DER -in "$keys/pass.cer" -out "$work/.pass.pem" 2>/dev/null || cp "$keys/pass.cer" "$work/.pass.pem"
openssl x509 -inform DER -in "$keys/wwdr.cer" -out "$work/.wwdr.pem" 2>/dev/null || cp "$keys/wwdr.cer" "$work/.wwdr.pem"

( cd "$work" && python3 - <<'PY'
import hashlib, json, os
m = {f: hashlib.sha1(open(f, 'rb').read()).hexdigest() for f in sorted(os.listdir('.')) if not f.startswith('.')}
json.dump(m, open('manifest.json', 'w'), indent=2)
PY
openssl smime -binary -sign -md sha256 -certfile .wwdr.pem -signer .pass.pem -inkey "$keys/pass.key" \
  -in manifest.json -out signature -outform DER
rm -f "$repo/card/eric-rogers.pkpass"
zip -q -j "$repo/card/eric-rogers.pkpass" pass.json manifest.json signature icon*.png logo*.png )
echo "Built $repo/card/eric-rogers.pkpass"
