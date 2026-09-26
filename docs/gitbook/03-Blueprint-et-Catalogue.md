# 🧩 Blueprint et Vinus Catalog

Pterodactyl gère les comptes et les serveurs. Blueprint est le framework d'extensions. **Vinus Catalog 1.4.0** fournit les outils Minecraft utilisés par le thème : logiciels et versions, mods et plugins, modpacks, mondes, BlueMap et joueurs. **Mettre à jour le thème ne met pas à jour le catalogue** : c'est une extension séparée.

## Ordre d'installation

Blueprint s'installe dans un panel existant. Sur un VPS vierge l'ordre est :

1. panel + thème + Wings (`install.sh`, [chapitre 2](02-Installation.md)) ;
2. Blueprint **`beta-2026-06`** (seule version validée) ;
3. réapplication du thème (`sudo bash install.sh --update`) : l'installeur détecte Blueprint et installe les variantes adaptées ;
4. construction et installation du paquet du catalogue.

Les commandes exactes sont dans le [chapitre 2, section 6](02-Installation.md). Les voici pour une mise à jour du catalogue :

```bash
cd ~/VinusPanel/extensions/vinuscatalog
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Adapter les chemins. `zip` est installé par `install.sh` (sinon `apt install -y zip`). Le dossier `app/player-artifacts` fait partie du paquet et contient les compagnons vérifiés de VinusPlayers. Vérifier l'installation :

```bash
cd /var/www/pterodactyl
php8.3 artisan route:list | grep -c vinuscatalog   # environ 40 routes
```

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
