#!/usr/bin/env python3
"""Build the optional Minecraft item icon sprite for the Players page.

Two sources, both downloaded on the machine running this script and checked against
fixed checksums:

1. the `minecraft-textures` icon pack (3D isometric renders of blocks such as the
   crafting table, plus every item icon), pinned to one version and one SHA-256;
2. Mojang's official 1.21.1 client (SHA-1 from Mojang's manifest), used for any item or
   block texture the pack does not cover.

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
PACK_VERSION = '26.3.0'
PACK_URL = 'https://cdn.jsdelivr.net/npm/minecraft-textures@' + PACK_VERSION + '/dist/textures/json/1.21.id.json'
PACK_SHA256 = '6b110a9e122ed662eee5c6fafcb6d246766e0b522e3fc796bc7514c4fcff0bdd'
ALLOWED_HOSTS = (
    'https://piston-meta.mojang.com/',
    'https://piston-data.mojang.com/',
    'https://cdn.jsdelivr.net/npm/minecraft-textures@' + PACK_VERSION + '/',
)
STYLE = 'image-rendering:pixelated;image-rendering:crisp-edges'


def download(url, limit):
    if not url.startswith(ALLOWED_HOSTS):
        raise ValueError('Unexpected download host')
    with urllib.request.urlopen(url, timeout=90) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Download exceeds its expected size')
    return data


def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Not a PNG file')
    return struct.unpack('>II', data[16:24])


def symbol(name, encoded, width, height):
    """One <symbol> per item; taller sprite sheets (animations) keep their first frame square."""
    return (f'<symbol id="{name}" viewBox="0 0 16 16" overflow="hidden">'
            f'<image width="16" height="{16 * height / width:g}" href="data:image/png;base64,{encoded}" style="{STYLE}"/></symbol>')


def from_pack():
    """3D block renders and item icons; returns ({name: symbol}, {minecraft:name: label})."""
    raw = download(PACK_URL, 8 * 1024 * 1024)
    if hashlib.sha256(raw).hexdigest() != PACK_SHA256:
        raise ValueError('Icon pack checksum mismatch')
    symbols = {}; labels = {}
    for item_id, entry in json.loads(raw)['items'].items():
        match = re.fullmatch(r'minecraft:([a-z0-9_]+)', item_id)
        texture = entry.get('texture', '')
        if not match or not texture.startswith('data:image/png;base64,'):
            continue
        encoded = texture.split(',', 1)[1]
        width, height = png_size(base64.b64decode(encoded))
        if not width or width > 256 or height > 4096:
            continue
        symbols[match[1]] = symbol(match[1], encoded, width, height)
        labels[item_id] = str(entry.get('readable') or match[1].replace('_', ' '))[:80]
    return symbols, labels


def from_client():
    """Flat item and block textures from Mojang's own client jar."""
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
                name = match[1]; data = jar.read(entry); width, height = png_size(data)
                if not width or width > 256 or height > 4096:
                    continue
                symbols[name] = symbol(name, base64.b64encode(data).decode('ascii'), width, height)
                labels['minecraft:' + name] = lang.get('item.minecraft.' + name, lang.get('block.minecraft.' + name, name.replace('_', ' ')))
    return symbols, labels


def build(output):
    symbols = {}; labels = {}; sources = []
    # Mojang first, then the pack on top: its 3D icons replace the flat block textures.
    for label, loader in (('Mojang client ' + VERSION, from_client), ('icon pack ' + PACK_VERSION, from_pack)):
        try:
            found_symbols, found_labels = loader()
        except Exception as error:  # a source may be unreachable; the other still gives a usable result
            print(f'Warning: {label} unavailable ({error}).', file=sys.stderr)
            continue
        symbols.update(found_symbols); labels.update(found_labels); sources.append(f'{label} ({len(found_symbols)})')
    if not symbols:
        raise SystemExit('No texture source could be downloaded.')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'items.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg">' + ''.join(symbols.values()) + '</svg>', encoding='utf-8')
    (output / 'items.json').write_text(json.dumps(labels, ensure_ascii=False), encoding='utf-8')
    (output / 'NOTICE.txt').write_text('Minecraft artwork (c) Mojang Studios / Microsoft. Extracted from Minecraft ' + VERSION
        + ' and from the minecraft-textures ' + PACK_VERSION + ' icon pack (GPL-3.0, https://github.com/destruc7i0n/minecraft-textures).'
        + ' Not covered by the VinusPanel source-code license. Minecraft is a trademark of Mojang Studios.\n', encoding='utf-8')
    print(f'Built {len(symbols)} item/block icons from: ' + ', '.join(sources) + '.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    build(Path(sys.argv[1]))
