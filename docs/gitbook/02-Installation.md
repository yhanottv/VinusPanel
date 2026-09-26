# 🚀 Installer VinusPanel

## Deux situations, une seule commande

**VPS vierge** (aucun Pterodactyl installé) : `install.sh` installe **tout** — dépendances système, Panel Pterodactyl 1.15.1, base MariaDB, Nginx, worker, compte administrateur, le thème VinusPanel et Wings. Les mots de passe administrateur et base sont générés aléatoirement, puis enregistrés dans `/var/lib/vinuspanel/credentials.txt` (chmod 600).

**Panel Pterodactyl existant** : `install.sh` détecte le panel et applique (ou met à jour) le thème uniquement, avec sauvegarde et retour arrière automatique.

L'installeur a été validé sur une Ubuntu 24.04 entièrement vierge (installation complète panel + thème + Wings en une commande). Il ne s'applique pas à l'image Docker officielle : dans Docker, le panel se trouve généralement dans `/app` et l'image de production ne contient pas les outils de compilation nécessaires à VinusPanel. Pour Docker, consulter la [documentation officielle du Panel](https://pterodactyl.io/panel/1.0/getting_started.html) et prévoir une image personnalisée.

## Installation rapide (recommandée)

En SSH, avec `root` ou `sudo` :

```bash
apt install -y curl git
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
sudo bash install.sh
```

Sans argument, dans un terminal, le script ouvre le **menu interactif** :

```
 [ 1 ] Install VINUS PANEL (Production)
 [ 2 ] Install VINUS PANEL (Development)
 [ 3 ] Update Panel (pull GitHub + rebuild)
 [ 4 ] Create / Reset Administrator Account
 [ 5 ] Restart Panel Service
 [ 6 ] Uninstall Panel
 [ 7 ] Exit
```

Choisir **1** pour une installation de production. L'opération complète prend de 10 à 20 minutes selon la machine (compilation du frontend incluse). À la fin, le script affiche l'URL du panel, le compte administrateur et l'emplacement des identifiants.

Sur un VPS qui exposerait déjà un reverse-proxy (par exemple un Traefik préinstallé occupant les ports 80/443), l'installeur l'arrête automatiquement pour installer Nginx ; utiliser `--keep-proxy` pour refuser ce comportement.

## Options non interactives

Le même script reste utilisable dans un script ou en CI, sans menu :

| Option | Rôle |
| --- | --- |
| `--install [prod\|dev]` | Installe le panel (si absent) puis le thème |
| `--update` | `git pull` + recompilation du thème |
| `--admin` | Crée ou réinitialise le compte administrateur |
| `--restart` | Redémarre PHP-FPM, Nginx, le worker et Wings |
| `--uninstall` | Désinstalle le thème (via `uninstall.sh`) |
| `--check` | Rapport d'environnement, sans modification |
| `--url URL` | URL publique du panel (défaut : `http://<ip>`) |
| `--timezone TZ` | Fuseau (défaut : `Europe/Paris`) |
| `--db-password MDP` | Mot de passe de la base (défaut : généré) |
| `--admin-email EMAIL` | E-mail administrateur (défaut : `admin@<nom-d-hote>`) |
| `--admin-user USER` / `--admin-password MDP` | Identifiant et mot de passe admin |
| `--[no-]wings` | Installe ou non Wings (défaut : automatique sur VPS vierge) |
| `--node-fqdn HOTE` | FQDN/IP du nœud Wings |
| `--alloc-range A-B` | Plage de ports des allocations (défaut : 25565-25584) |
| `--panel-dir CHEMIN` | Autre emplacement que `/var/www/pterodactyl` |
| `--keep-proxy` | Ne retire pas un reverse-proxy présent sur 80/443 |

Sans domaine, le panel est servi en `http://<ip>` : un certificat Let's Encrypt ne peut pas être délivré pour une seule IP. Avec une URL `https://` fournie via `--url`, l'installeur demande le certificat avec Certbot. Les limites du nœud Wings sont déduites de la machine (85 % de la RAM et du disque réels), surchargeables via `VINUS_NODE_MEMORY` et `VINUS_NODE_DISK`.

## Blueprint et Vinus Catalog (outils Minecraft)

Les onglets **Version**, **Mods**, **Modpacks**, **Mondes** et **BlueMap** nécessitent l'extension **Vinus Catalog**, qui requiert **Blueprint**. Installer Blueprint **avant** le thème, dans la version exacte attendue (`beta-2026-06`) :

```bash
cd /var/www/pterodactyl
wget "https://github.com/BlueprintFramework/framework/releases/download/beta-2026-06/release.zip" -O release.zip
unzip -o release.zip
printf 'WEBUSER="www-data";\nOWNERSHIP="www-data:www-data";\nUSERSHELL="/bin/bash";\n' > .blueprintrc
chmod +x blueprint.sh
printf 'y\n' | bash blueprint.sh
```

Puis réappliquer le thème (`sudo bash install.sh` depuis le dépôt : les variantes Blueprint sont détectées automatiquement) et installer le catalogue :

```bash
cd extensions/vinuscatalog
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Depuis la version 3.2.x du thème, `install.sh` gère automatiquement la compatibilité Blueprint (fournisseur OpenSSL historique pour Node 22, normalisation de l'option `css-loader`, ajout de l'addon `xterm-addon-unicode11`). Détails : [Blueprint et catalogue](03-Blueprint-et-Catalogue.md).

## Déroulement

L'installeur contrôle les versions, sauvegarde les fichiers concernés **et les assets frontend existants**, active la maintenance, copie la surcouche et les variantes Blueprint applicables, prépare les dépendances et compile le frontend. Il vide ensuite les caches et quitte la maintenance. En cas d'échec, il **tente** un retour arrière : fichiers précédents restaurés, assets précédents remis en place (le panel reste utilisable même si la recompilation échoue à son tour), puis vérifier le résultat au lieu de supposer sa réussite.

Ne pas interrompre la compilation ni lancer deux installations en parallèle. Le thème ne demande pas de redémarrage aux serveurs de jeu.

## Vérifier

1. Recharger le panel sans cache (Ctrl+F5) et se connecter avec le compte affiché par l'installeur.
2. Ouvrir le tableau de bord puis un serveur : état, fichiers et console.
3. Ouvrir **Design** avec un administrateur et vérifier l'aperçu.
4. Au premier accès d'un administrateur sur un panel sans serveur, l'assistant de création proposé par VinusPanel peut créer un premier serveur.
5. Installer séparément Vinus Catalog si les outils Minecraft sont nécessaires.

## Chemin manuel (référence)

Pour installer chaque pièce à la main — dépendances, Panel 1.15.1, base MariaDB, Nginx, worker `pteroq`, Wings — suivre les sections correspondantes du [guide officiel Pterodactyl](https://pterodactyl.io/panel/1.0/getting_started.html), puis appliquer le thème avec `bash install.sh --check` et `sudo bash install.sh`. L'installeur automatise exactement ces étapes ; la voie manuelle reste utile pour auditer ou reprendre une installation partielle.

Prérequis minimatiques pour appliquer le thème seul : SSH avec `sudo`, Git, Bash, PHP 8.3, Composer, Node 22, Yarn 1 et les sources frontend Pterodactyl. Sauvegarder la base, les fichiers du panel et `storage/app/vinuspanel/design.json` + `public/assets/vinus/custom` avant une mise à jour importante.

[Sommaire](README.md) · [Blueprint et catalogue](03-Blueprint-et-Catalogue.md)
