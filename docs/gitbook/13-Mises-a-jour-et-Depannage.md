# 🔧 Mises à jour, récupération et dépannage

## Mettre à jour VinusPanel

Lire le [changelog](https://github.com/yhanottv/VinusPanel/blob/main/CHANGELOG.md), sauvegarder le panel, la base, `.env`, les réglages et images du Design Studio et les données des serveurs ([chapitre 12](12-Securite-et-Production.md)). Puis, dans le dossier cloné :

```bash
cd ~/VinusPanel
sudo bash install.sh --update      # git pull --ff-only, sauvegarde, recompilation, garde-fou
```

Équivalent : menu `sudo bash install.sh` puis option **3**. Le panel passe brièvement en maintenance pendant la compilation. Si `git pull` échoue (modifications locales, branche divergente), l'installeur le signale et réinstalle les sources actuelles : conserver ou réconcilier d'abord vos changements.

Le catalogue se met à jour séparément : reconstruire le paquet et relancer `sudo blueprint -install vinuscatalog` ([chapitre 3](03-Blueprint-et-Catalogue.md)). Les compagnons VinusPlayers déjà présents dans les serveurs ne sont pas remplacés automatiquement.

## Mettre à jour Pterodactyl et Wings

VinusPanel est validé avec Pterodactyl **1.15.1** ; l'installeur refuse une autre version du panel. Ne pas utiliser `releases/latest`. Sauvegarder le VPS (snapshot), exporter la base (`mariadb-dump panel`) et copier `.env`. Cette procédure concerne l'installation classique dans `/var/www/pterodactyl`.

```bash
cd /var/www/pterodactyl
php8.3 artisan down
curl -fL https://github.com/pterodactyl/panel/releases/download/v1.15.1/panel.tar.gz | tar -xzv
chmod -R 755 storage/* bootstrap/cache
composer install --no-dev --optimize-autoloader
php8.3 artisan migrate --seed --force
php8.3 artisan view:clear
php8.3 artisan config:clear
chown -R www-data:www-data /var/www/pterodactyl/*
php8.3 artisan queue:restart
php8.3 artisan up
systemctl restart pteroq
systemctl reload nginx
```

Cette opération remplace des fichiers modifiés par le thème et par Blueprint : **réinstaller ensuite Blueprint (si utilisé), puis le thème** (`sudo bash install.sh --update`), puis le catalogue. Vérifier `php8.3 artisan p:info`, la connexion, la console et les permissions.

Pour Wings, la version doit rester compatible avec le panel. Vérifier la version réellement publiée sur le [dépôt officiel](https://github.com/pterodactyl/wings/releases) et ne jamais inventer un numéro :

```bash
systemctl stop wings
curl -fL -o /usr/local/bin/wings https://github.com/pterodactyl/wings/releases/download/<VERSION_WINGS>/wings_linux_amd64
chmod u+x /usr/local/bin/wings
systemctl start wings
systemctl --no-pager status wings
```

## Repartir de zéro

Pour réinstaller entièrement : demander à l'hébergeur de **réinstaller l'OS** du VPS (Ubuntu 24.04 nu), se reconnecter en SSH et suivre le [chapitre 2](02-Installation.md) depuis le début. Cela **efface tout**, y compris les serveurs de jeu : sauvegarder avant ([chapitre 12](12-Securite-et-Production.md)). La clé SSH de la machine change après une réinstallation : votre client SSH signalera une clé d'hôte modifiée ; vérifier qu'il s'agit bien de votre réinstallation avant de la remplacer (`ssh-keygen -R <ip>`).

## Réinitialiser le compte administrateur

```bash
sudo bash install.sh --admin
```

Le script crée le compte ou réinitialise son mot de passe et affiche le nouveau mot de passe.

## Désinstallation

```bash
sudo bash uninstall.sh
# Pour un autre chemin :
sudo bash uninstall.sh --panel-dir /chemin/vers/pterodactyl
```

Le script restaure les originaux suivis, retire les fichiers ajoutés, recompile, vide les caches, supprime le service `vinus-guard` et archive l'état VinusPanel. Il ne désinstalle ni Pterodactyl, ni Wings, ni Blueprint, ni Vinus Catalog. Après une mise à jour Pterodactyl, vérifier que la sauvegarde d'origine correspond à la version à restaurer.

| Chemin | Usage |
| --- | --- |
| `/var/lib/vinuspanel/original` | Originaux suivis |
| `/var/lib/vinuspanel/credentials.txt` | Identifiants générés à l'installation (chmod 600) |
| `/var/backups/vinuspanel/install-*` | Transactions d'installation (à purger régulièrement) |
| `/var/lib/vinuspanel/last-transaction` | Dernière transaction |
| `/var/backups/vinuspanel/uninstalled-*` | État archivé au retrait |
| `/var/lib/vinuspanel/bootstrap-incomplete` | Présent uniquement si une installation du panel est inachevée |

Les données Design et images personnelles restent à sauvegarder séparément. Une restauration partielle d'une opération Minecraft peut laisser le serveur suspendu : conserver le dossier de récupération et faire examiner l'état par l'administrateur.

## Symptômes fréquents

| Symptôme | Vérifier |
| --- | --- |
| Installation interrompue pendant la phase « panel » | Relancer la même commande : elle reprend (fichier `bootstrap-incomplete`) |
| Erreur `No application encryption key has been specified` | `.env` sans clé applicative : ne pas lancer `artisan` à la main avant la fin de l'installeur ; relancer `install.sh` |
| Compilation échouée / mémoire insuffisante | RAM du VPS (4 Go minimum conseillés), `dmesg \| grep -i oom`, puis relancer ; l'installeur restaure l'état précédent |
| Panel sans styles (liste brute) | Compilation terminée ? Sinon relancer `sudo bash install.sh --update` ; Ctrl+F5 |
| Ancienne interface | Compilation terminée, bon panel, cache navigateur/proxy |
| Erreur 502 | `systemctl status php8.3-fpm nginx`, `/var/log/nginx/pterodactyl.app-error.log` |
| Nœud avec un cœur rouge | `systemctl status wings`, `journalctl -u wings`, port 8080 ouvert, FQDN et schéma (http/https) du nœud |
| Console déconnectée | Wings, WebSocket, HTTPS mixte, message précis affiché |
| Aucun e-mail reçu | `MAIL_MAILER` vaut `log` par défaut : [chapitre 12](12-Securite-et-Production.md) |
| Menu de l'administration sans recherche ni bascule de langue | Mettre à jour vers la dernière version (le script d'administration était supprimé par la compilation dans les anciennes versions) |
| Catalogue absent | Blueprint, extension, permissions et détection ([chapitre 3](03-Blueprint-et-Catalogue.md)) |
| Fenêtre Joueurs absente | Installation terminée puis état En ligne, même compte/navigateur, offre non déjà fermée |
| Liaison incompatible | Minecraft, loader exact, Java et matrice du chapitre Joueurs |
| XP/vie anciens | Source sauvegarde/direct, chargement du compagnon, heartbeat récent |
| Mod sans boutons d'action | Les mods natifs sont en lecture seule ; les actions sont Bukkit |
| Arrêt trop long | Console et arrêt normal ; aucun kill automatique |
| Serveur qui redémarre seul après un plantage de mod | `vinus-guard` : `/var/log/vinus-guard.log` ([chapitre 8](08-Mods-et-Plugins.md)) |
| Délai HTTP d'installation | État et fichiers avant toute nouvelle tentative |
| BlueMap vide ou refusée | Chargement, ressources, premier rendu ; `APP_URL` identique à l'adresse utilisée |

## Demander de l'aide

Dans une [issue GitHub](https://github.com/yhanottv/VinusPanel/issues), indiquer les versions thème/panel/Blueprint/Minecraft/loader/Java, le navigateur, les étapes, le comportement attendu, l'heure et la référence d'erreur. Expurger les logs et captures. Ne jamais publier mots de passe, jetons, clés, configuration privée ou données de joueurs.

[Sommaire](README.md)
