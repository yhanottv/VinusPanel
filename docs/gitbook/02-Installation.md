# 🚀 Installer VinusPanel de A à Z

Ce chapitre décrit l'installation complète sur un **VPS vierge** : Pterodactyl, le thème VinusPanel, Wings, puis (optionnel mais recommandé pour Minecraft) Blueprint et Vinus Catalog. Chaque étape indique ce qu'il faut vérifier avant de passer à la suivante.

## 1. Avant de commencer

| Élément | Exigence |
| --- | --- |
| Système | **Ubuntu 24.04 LTS** propre (Debian n'est pas validé). Choisir l'image « Ubuntu 24.04 » nue chez l'hébergeur. |
| Accès | SSH en `root` (ou un utilisateur avec `sudo`). |
| Machine | Testé sur 2 vCPU, 8 Go de RAM, 96 Go de disque. La compilation du frontend est gourmande : moins de 4 Go de RAM n'est pas validé. |
| Réseau | Une IP publique. Un nom de domaine est **optionnel** mais nécessaire pour HTTPS (voir le [chapitre 12](12-Securite-et-Production.md)). |
| Ports à laisser joignables | `22` (SSH), `80`/`443` (panel), `8080` (API Wings), `2022` (SFTP) et la plage de jeu (par défaut `25565`–`25584`). |

**Attention aux images préinstallées.** Certains hébergeurs (par exemple le modèle Docker/Traefik de Hostinger) livrent un reverse-proxy qui occupe déjà les ports 80/443. Sur une machine qui n'a pas encore Nginx, l'installeur **arrête ce conteneur Traefik et désactive son redémarrage automatique** pour libérer les ports. Pour l'éviter, réinstaller le VPS avec une image Ubuntu nue, ou passer `--keep-proxy` : l'installation s'arrête alors avec un message si les ports restent occupés.

L'installeur ne s'applique pas à l'image Docker officielle de Pterodactyl : dans Docker le panel se trouve dans `/app` et l'image de production ne contient pas les outils de compilation nécessaires.

## 2. Récupérer le code

```bash
apt update && apt install -y git curl
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
```

## 3. Contrôler l'environnement (sans rien modifier)

```bash
sudo bash install.sh --check
```

Le script affiche le système, la RAM, le disque, les outils présents ou absents et valide le paquet du thème. Sur un VPS vierge il indique « Panel absent : une installation complète sera effectuée » ; les outils absents (php, composer, node…) sont normaux à ce stade, l'installeur les installe.

## 4. Lancer l'installation

Sans option, dans un terminal, `install.sh` ouvre un menu :

```
 [ 1 ] Install VINUS PANEL (Production)
 [ 2 ] Install VINUS PANEL (Development)
 [ 3 ] Update Panel (pull GitHub + rebuild)
 [ 4 ] Create / Reset Administrator Account
 [ 5 ] Restart Panel Service
 [ 6 ] Uninstall Panel
 [ 7 ] Exit
```

Choisir **1**. Pour préciser l'URL du panel, l'e-mail administrateur ou le fuseau horaire, passer les options (elles sont lues avant l'action) :

```bash
# Sans domaine : le panel sera servi en http://<ip-du-vps>
sudo bash install.sh --install

# Avec un domaine dont l'enregistrement DNS A pointe déjà vers le VPS
sudo bash install.sh --install --url https://panel.exemple.fr --admin-email vous@exemple.fr
```

L'opération complète est **entièrement automatique** : Pterodactyl, thème, Blueprint, catalogue Minecraft, garde-fou et Wings. Elle a duré environ 7 minutes sur un VPS de 2 vCPU / 8 Go de RAM (comptez jusqu'à 20 minutes sur une machine plus lente). Ne pas interrompre la compilation et ne pas lancer deux installations en parallèle. Un terminal multiplexé (`tmux`) protège d'une coupure de la connexion SSH.

### Ce que fait l'installeur sur un VPS vierge

1. Met à jour Ubuntu, ajoute le dépôt PHP `ppa:ondrej/php` et installe PHP 8.3, MariaDB, Nginx, Redis, Composer, Node 22, Yarn 1, `zip`, `unzip`, `wget`, `git` et `openssl`.
2. Télécharge **Pterodactyl Panel 1.15.1**, génère la clé applicative avant la première commande `artisan`, crée la base MariaDB `panel` et l'utilisateur `pterodactyl`, configure l'environnement (Redis pour le cache, les sessions et la file d'attente, e-mails sur `log`), migre la base et crée le compte administrateur.
3. Écrit le vhost Nginx (`/etc/nginx/sites-available/pterodactyl.conf`), la tâche cron du planificateur (`/etc/cron.d/pterodactyl`) et le service `pteroq` (worker de file d'attente). Avec une URL `https://`, il demande un certificat Let's Encrypt via Certbot.
4. Installe **Blueprint `beta-2026-06`** sur le panel neuf, puis applique une seule fois la surcouche VinusPanel avec ses variantes Blueprint (sauvegarde préalable, compilation du frontend, caches vidés).
5. Construit et installe l'extension **Vinus Catalog** (outils Minecraft : logiciels, mods, modpacks, mondes, BlueMap, joueurs). Cette étape n'est pas bloquante : en cas d'échec, le panel et le thème fonctionnent et un message indique de relancer `sudo bash install.sh --catalog`.
6. Installe le garde-fou `vinus-guard`, service systemd qui met en quarantaine les mods client-only faisant planter un serveur (voir le [chapitre 8](08-Mods-et-Plugins.md)).
7. Installe Docker si nécessaire, télécharge **Wings**, crée l'emplacement `fr1`, le nœud (nom = nom d'hôte court, limites = 85 % de la RAM et du disque réels), 20 allocations de ports sur l'IP détectée, écrit `/etc/pterodactyl/config.yml` (mode 600) et démarre `wings`.

Si l'installation échoue pendant la phase « panel », **relancer la même commande** : l'installeur détecte l'installation incomplète (fichier `/var/lib/vinuspanel/bootstrap-incomplete`) et la reprend au lieu de considérer le panel à moitié installé comme terminé. Si l'échec survient pendant la phase « thème », l'installeur restaure automatiquement les fichiers d'origine ; corriger la cause (lire le message et `storage/logs/`) puis relancer.

### Identifiants générés

Les mots de passe administrateur et base de données sont générés aléatoirement (24 caractères), affichés à la fin, puis enregistrés dans `/var/lib/vinuspanel/credentials.txt` (chmod 600) :

```bash
sudo cat /var/lib/vinuspanel/credentials.txt
```

Les copier dans un gestionnaire de mots de passe, **puis changer le mot de passe administrateur** à la première connexion. Éviter `--db-password` et `--admin-password` en ligne de commande : ces valeurs sont visibles dans la liste des processus. Préférer les variables d'environnement `VINUS_DB_PASSWORD` et `VINUS_ADMIN_PASSWORD`.

### Options et variables

| Option | Rôle |
| --- | --- |
| `--install [prod\|dev]` | Installe le panel (si absent) puis le thème, sans menu |
| `--update` | `git pull --ff-only` + réinstallation du thème (et mise à jour du catalogue si Blueprint est présent) |
| `--admin` | Crée ou réinitialise le compte administrateur |
| `--restart` | Redémarre PHP-FPM, Nginx, le worker et Wings |
| `--uninstall` | Désinstalle le thème (via `uninstall.sh`) |
| `--check` | Rapport d'environnement, sans modification |
| `--url URL` | URL publique (défaut : `http://<ip>`) |
| `--timezone TZ` | Fuseau (défaut : `Europe/Paris`) |
| `--admin-email EMAIL` | E-mail administrateur (défaut : `admin@<nom-d-hôte>`) |
| `--admin-user USER` | Identifiant administrateur (défaut : `admin`) |
| `--[no-]wings` | Installe ou non Wings (défaut : automatique sur VPS vierge) |
| `--[no-]blueprint` | Installe ou non Blueprint + Vinus Catalog (défaut : automatique sur VPS vierge ou si Blueprint est déjà présent) |
| `--catalog` | Installe ou met à jour Vinus Catalog seul (Blueprint requis) |
| `--node-fqdn HOTE` | FQDN ou IP du nœud Wings (défaut : hôte du panel) |
| `--alloc-range A-B` | Plage de ports des allocations (défaut : `25565-25584`) |
| `--panel-dir CHEMIN` | Autre emplacement que `/var/www/pterodactyl` |
| `--keep-proxy` | Ne retire pas un reverse-proxy présent sur 80/443 |

Variables utiles : `VINUS_NODE_MEMORY` et `VINUS_NODE_DISK` (limites du nœud en Mo), `VINUS_WITH_BLUEPRINT` (`auto`, `yes` ou `no`, équivalent de `--[no-]blueprint`), `VINUS_PHP_BIN` (binaire PHP, défaut `php8.3`), `VINUS_GUARD_INTERVAL` (période du garde-fou en secondes, défaut 20).

Sans domaine, le panel est servi en `http://<ip>` : Let's Encrypt ne délivre pas de certificat pour une adresse IP seule. Ce mode convient à un test, pas à un usage public : voir le [chapitre 12](12-Securite-et-Production.md).

## 5. Vérifier l'installation

```bash
systemctl is-active nginx php8.3-fpm mariadb redis-server pteroq wings docker vinus-guard
curl -sI http://127.0.0.1 | head -1
cd /var/www/pterodactyl && php8.3 artisan p:info
cat /var/lib/vinuspanel/version /var/lib/vinuspanel/catalog-version
php8.3 artisan route:list | grep -c vinuscatalog
```

Résultat attendu : huit lignes `active`, une réponse `HTTP/1.1 200` ou `302`, Pterodactyl `1.15.1`, la version du thème (`3.2.0`), celle du catalogue (`1.4.1`) et environ 40 routes `vinuscatalog`.

Dans le navigateur :

1. Ouvrir l'URL du panel et se connecter avec le compte de `credentials.txt` (Ctrl+F5 en cas d'ancienne interface).
2. Ouvrir **Admin → Nodes** : le nœud doit afficher un cœur vert (Wings joint).
3. Un administrateur sans serveur voit l'assistant de création de la [première connexion](04-Premiers-pas.md).
4. Ouvrir **Design** dans la barre latérale et vérifier l'aperçu.

Sur un serveur Minecraft, les onglets **Version**, **Mods**, **Modpacks**, **Mondes** et **BlueMap** sont disponibles.

## 6. Blueprint et Vinus Catalog (déjà fait par l'installeur)

Sur un VPS vierge, `install.sh` a installé Blueprint `beta-2026-06` (version exacte exigée) puis le catalogue : **rien à faire à la main**. Pour ne pas les installer, ajouter `--no-blueprint`. Si la ligne finale de l'installeur indique « Vinus Catalog : non installé » (échec non bloquant, par exemple réseau), corriger la cause puis relancer :

```bash
cd ~/VinusPanel
sudo bash install.sh --catalog
```

Sur un panel existant sans Blueprint, ajouter `--blueprint` à `--install` ou `--update` pour l'installer aussi ; s'il est déjà présent, `--update` installe ou met à jour le catalogue. Les commandes manuelles équivalentes (dépannage) sont dans le [chapitre 3](03-Blueprint-et-Catalogue.md).

## 7. Après l'installation

- **Changer le mot de passe administrateur** (Compte → Vue d'ensemble) et activer la double authentification.
- Suivre le [chapitre 12](12-Securite-et-Production.md) : domaine et HTTPS, pare-feu, SSH, e-mails, sauvegardes.
- Créer un premier serveur avec l'assistant ou depuis **Admin → Servers**.

## Sauvegardes et retour arrière

Chaque installation du thème sauvegarde les fichiers remplacés dans `/var/backups/vinuspanel/install-<date>` (et une copie d'origine dans `/var/lib/vinuspanel/original`) puis restaure automatiquement en cas d'échec. Ces sauvegardes **ne couvrent pas** la base, `.env`, `storage/app/vinuspanel/design.json`, `public/assets/vinus/custom` ni les fichiers des serveurs de jeu : les sauvegarder séparément (chapitre 12). Les anciennes transactions s'accumulent : supprimer les plus anciennes quand tout fonctionne.

## Panel Pterodactyl existant

Sur une machine où Pterodactyl est déjà installé dans `/var/www/pterodactyl`, `install.sh` détecte le panel et applique (ou met à jour) uniquement le thème : mêmes commandes, mêmes vérifications, sans installer Wings et sans installer Blueprint (sauf avec `--blueprint`). Il exige Pterodactyl **1.15.1** ; une autre version est refusée. Sauvegarder d'abord la base, `.env` et le panel. Prérequis pour le thème seul : Git, Bash, PHP 8.3, Composer, Node 22, Yarn 1 et les sources frontend Pterodactyl.

[Sommaire](README.md) · [Blueprint et catalogue](03-Blueprint-et-Catalogue.md) · [Sécurité et production](12-Securite-et-Production.md)
