# 🧩 Blueprint et Vinus Catalog

Pterodactyl gère les comptes et les serveurs. Blueprint est le framework d'extensions. **Vinus Catalog 1.4.0** fournit les outils Minecraft utilisés par le thème : logiciels et versions, mods et plugins, modpacks, mondes, BlueMap et joueurs. Le catalogue est une extension séparée de Blueprint ; `install.sh` l'installe et le met à jour avec le thème.

## Installation automatique

Sur un VPS vierge, `install.sh` fait tout, dans cet ordre : panel Pterodactyl → Blueprint **`beta-2026-06`** (seule version validée) → thème appliqué **une seule fois** avec les variantes Blueprint → catalogue. Le catalogue n'est pas bloquant : s'il échoue, le reste fonctionne. Options : `--no-blueprint` (ne rien installer), `--blueprint` (forcer sur un panel existant), `--catalog` (installer ou mettre à jour le catalogue seul). Un `--update` met aussi le catalogue à jour quand sa version change.

Vérifier l'installation :

```bash
cat /var/lib/vinuspanel/catalog-version            # 1.4.0
cd /var/www/pterodactyl
php8.3 artisan route:list | grep -c vinuscatalog   # environ 40 routes
```

## Installation manuelle (dépannage)

À n'utiliser que si l'installeur ne peut pas être relancé. Blueprint s'installe dans un panel existant :

```bash
apt install -y zip unzip wget
cd /var/www/pterodactyl
wget "https://github.com/BlueprintFramework/framework/releases/download/beta-2026-06/release.zip" -O release.zip
unzip -o release.zip
printf 'WEBUSER="www-data";\nOWNERSHIP="www-data:www-data";\nUSERSHELL="/bin/bash";\n' > .blueprintrc
chmod +x blueprint.sh
NODE_OPTIONS=--openssl-legacy-provider bash blueprint.sh <<< "y"
cd ~/VinusPanel && sudo bash install.sh --update    # applique les variantes Blueprint et le catalogue
```

Le paquet du catalogue se construit ainsi (l'installeur le fait pour vous) :

```bash
cd ~/VinusPanel/extensions/vinuscatalog
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Le dossier `app/player-artifacts` fait partie du paquet et contient les compagnons vérifiés de VinusPlayers.

## Compatibilité automatique

Installer Blueprint **rétrograde** `css-loader` vers 5.2.7 et livre un webpack plus ancien. Depuis VinusPanel 3.2.x, `install.sh` compense ces écarts : fournisseur OpenSSL historique sur Node ≥ 17 (`--openssl-legacy-provider`), désactivation du polyfill `:has()` dans `postcss.config.js`, normalisation de l'option `exportLocalsConvention` et installation de `xterm-addon-unicode11`. Ne pas lancer `yarn add` manuellement juste avant une compilation : cela peut casser l'arbre de dépendances.

L'installeur vérifie que Blueprint est en `beta-2026-06` et refuse une autre version.

## Fournisseurs

| Source | Usage |
| --- | --- |
| Modrinth | Mods, plugins et modpacks, sans clé personnelle |
| SpigotMC | Ressources gratuites dont le téléchargement est pris en charge |
| CurseForge | Clé privée requise ; restrictions des auteurs respectées |
| MCJars | Métadonnées des logiciels, versions et builds |

Les échanges réels CurseForge restent à valider dans cet environnement ; les tests actuels utilisent des fixtures. Le catalogue ne contourne pas les ressources payantes ou privées, ni les téléchargements externes non pris en charge.

## Configuration privée

Les fournisseurs gratuits fonctionnent sans configuration. Pour CurseForge ou pour des eggs personnalisés, copier `extensions/vinuscatalog/config/vinuscatalog.php.example` vers `config/vinuscatalog.php` **dans le panel** et ne renseigner que les options utiles. La clé CurseForge se place dans `/var/www/pterodactyl/.env` (`VINUS_CURSEFORGE_API_KEY=...`), jamais dans le dépôt GitHub.

Les correspondances `egg_profiles` (UUID d'egg) et `server_profiles` (UUID de serveur) servent aux eggs personnalisés ; leurs UUID sont propres à votre instance. Après toute modification :

```bash
cd /var/www/pterodactyl
php8.3 artisan config:clear
```

## Dépannage

Si une catégorie manque, vérifier dans l'ordre : Blueprint installé (la commande `blueprint` existe), extension installée (routes ci-dessus), permissions du sous-utilisateur, logiciel et version détectés. Les proxys et Vanilla n'offrent pas les mêmes outils que les serveurs moddés. Les messages « route could not be found » ou « Le catalogue nécessite l'extension VinusCatalog » signifient que Blueprint ou l'extension n'est pas installé.

[Guide technique de l'extension](https://github.com/yhanottv/VinusPanel/blob/main/extensions/vinuscatalog/README.md) · [Sommaire](README.md)
