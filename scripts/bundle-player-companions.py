#!/usr/bin/env python3
"""Bundle locally built companions. Never bundle Minecraft classes or dependency archives."""
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
destination = root / 'extensions/vinuscatalog/app/player-artifacts'
destination.mkdir(parents=True, exist_ok=True)
matrix = [
    ('bukkit', ['1.20.1', '1.21.1'], 17, False, 'players-bukkit/target/vinus-players-1.1.0.jar', 'plugin.yml'),
    ('fabric', ['1.20.1'], 17, True, 'players-mods/fabric-1.20.1/build/libs/vinus-players-fabric-1.20.1-1.1.0.jar', 'fabric.mod.json'),
    ('fabric', ['1.21.1'], 21, True, 'players-mods/fabric-1.21.1/build/libs/vinus-players-fabric-1.21.1-1.1.0.jar', 'fabric.mod.json'),
    ('forge', ['1.20.1'], 17, True, 'players-mods/forge-1.20.1/build/libs/vinus-players-forge-1.20.1-1.1.0.jar', 'META-INF/mods.toml'),
    ('neoforge', ['1.21.1'], 21, True, 'players-mods/neoforge-1.21.1/build/libs/vinus-players-neoforge-1.21.1-1.1.0.jar', 'META-INF/neoforge.mods.toml'),
]
artifacts = []
for loader, versions, java, readonly, relative, metadata in matrix:
    source = root / 'integrations' / relative
    with zipfile.ZipFile(source) as jar:
        assert metadata in jar.namelist(), f'Missing loader metadata in {source}'
        classes = [p for p in jar.namelist() if p.endswith('.class')]
        assert classes and all(p.startswith('dev/vinuspanel/players/') for p in classes), 'Unexpected bundled classes'
    name = f'vinus-players-{loader}-{"-".join(versions)}-1.1.0.jar'
    shutil.copyfile(source, destination / name)
    artifacts.append({'loader': loader, 'minecraft': versions, 'java': java, 'read_only': readonly,
                      'loader_versions': {'bukkit': [], 'fabric': ['0.16.10'] if versions == ['1.20.1'] else ['0.16.14'], 'forge': ['47.3.0'], 'neoforge': ['21.1.219']}[loader],
                      'file': name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
(destination / 'manifest.json').write_text(json.dumps({'protocol': 1, 'artifacts': artifacts}, indent=2) + '\n')
print(f'Bundled {len(artifacts)} companions.')
