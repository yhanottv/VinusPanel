#!/usr/bin/env python3
"""Build the optional Minecraft 1.21.1 item sprite from Mojang's verified client.

Generated game artwork is not part of the theme's source-code license.
Usage: python3 scripts/fetch-player-textures.py /var/www/pterodactyl/public/assets/images/vinus/players
"""
import base64
import hashlib
import io
import json
from pathlib import Path
import re
import struct
import sys
import urllib.request
import zipfile

VERSION = '1.21.1'


def download(url, limit):
    if not url.startswith(('https://piston-meta.mojang.com/', 'https://piston-data.mojang.com/')):
        raise ValueError('Unexpected Mojang download host')
    with urllib.request.urlopen(url, timeout=90) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Download exceeds its expected size')
    return data


def build(output):
    manifest = json.loads(download('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', 2097152))
    release = next(entry for entry in manifest['versions'] if entry['id'] == VERSION)
    metadata = download(release['url'], 2097152)
    if hashlib.sha1(metadata).hexdigest() != release['sha1']:
        raise ValueError('Version metadata checksum mismatch')
    client = json.loads(metadata)['downloads']['client']
    archive = download(client['url'], client['size'])
    if len(archive) != client['size'] or hashlib.sha1(archive).hexdigest() != client['sha1']:
        raise ValueError('Client checksum mismatch')
    symbols = {}; labels = {}
    with zipfile.ZipFile(io.BytesIO(archive)) as jar:
        lang = json.loads(jar.read('assets/minecraft/lang/en_us.json'))
        for kind in ['block', 'item']:
            for entry in jar.infolist():
                match = re.fullmatch('assets/minecraft/textures/' + kind + r'/([a-z0-9_]+)\.png', entry.filename)
                if not match or entry.file_size > 262144:
                    continue
                name = match[1]; data = jar.read(entry); width, height = struct.unpack('>II', data[16:24])
                if not width or width > 256 or height > 4096:
                    continue
                encoded = base64.b64encode(data).decode('ascii')
                symbols[name] = f'<symbol id="{name}" viewBox="0 0 16 16" overflow="hidden"><image width="16" height="{16 * height / width:g}" href="data:image/png;base64,{encoded}" style="image-rendering:pixelated"/></symbol>'
                labels['minecraft:' + name] = lang.get('item.minecraft.' + name, lang.get('block.minecraft.' + name, name.replace('_', ' ')))
    output.mkdir(parents=True, exist_ok=True)
    (output / 'items.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg">' + ''.join(symbols.values()) + '</svg>', encoding='utf-8')
    (output / 'items.json').write_text(json.dumps(labels, ensure_ascii=False), encoding='utf-8')
    (output / 'NOTICE.txt').write_text('Minecraft artwork © Mojang Studios / Microsoft. Extracted from Minecraft ' + VERSION + '. Not covered by the VinusPanel source-code license. Minecraft is a trademark of Mojang Synergies AB. This project is not an official Minecraft product.\n', encoding='utf-8')
    print(f'Built {len(symbols)} item/block textures from verified Minecraft {VERSION} assets.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    build(Path(sys.argv[1]))
