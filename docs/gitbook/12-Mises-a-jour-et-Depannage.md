# 🔧 Mises à jour, récupération et dépannage

## Mettre à jour Pterodactyl

Faire une sauvegarde du VPS ou un snapshot, exporter la base MariaDB et sauvegarder `.env` avant toute mise à jour. Cette procédure concerne une installation classique dans `/var/www/pterodactyl` ; pour Docker, reconstruire l’image avec la nouvelle version au lieu de modifier un conteneur de production à la main.

Vérifier les versions et placer le panel en maintenance :

```bash
cd /var/www/pterodactyl
php artisan p:info
php -v
composer --version
php artisan down
```

Pour viser précisément la version `1.15.1` :

```bash
curl -fL https://github.com/pterodactyl/panel/releases/download/v1.15.1/panel.tar.gz | tar -xzv
chmod -R 755 storage/* bootstrap/cache
composer install --no-dev --optimize-autoloader
php artisan migrate --seed --force
php artisan view:clear
php artisan config:clear
chown -R www-data:www-data /var/www/pterodactyl/*
php artisan queue:restart
php artisan up
systemctl restart pteroq
systemctl reload nginx
```

Ne pas utiliser `releases/latest` si une version précise est exigée par Blueprint ou VinusPanel. Après la mise à jour, vérifier `php artisan p:info`, la connexion au panel, la console et les permissions. Les migrations peuvent mettre à jour les eggs intégrés : conserver les eggs personnalisés séparément.

### Mettre Wings à jour

La version de Wings doit rester compatible avec la version du Panel. Vérifier la version réellement publiée sur le [dépôt officiel Wings](https://github.com/pterodactyl/wings/releases) et ne jamais inventer un numéro de version qui n’existe pas. Exemple pour une release Linux `amd64` publiée :

```bash
systemctl stop wings
curl -fL -o /usr/local/bin/wings https://github.com/pterodactyl/wings/releases/download/<VERSION_WINGS>/wings_linux_amd64
chmod u+x /usr/local/bin/wings
systemctl start wings
systemctl --no-pager status wings
```

Après validation de Pterodactyl et de Wings, relancer `bash install.sh --check`, puis installer VinusPanel.

## Mise à jour

Lire le changelog, vérifier Pterodactyl/Blueprint et sauvegarder panel, base, réglages/images Design et données serveur. Dans le checkout de la branche voulue :

```bash
git pull --ff-only
bash install.sh --check
sudo bash install.sh
```

Conserver/réconcilier les modifications locales en cas de conflit Git. Reconstruire et réinstaller Vinus Catalog séparément. Les compagnons présents dans les serveurs ne sont pas remplacés automatiquement.

## Désinstallation

```bash
sudo bash uninstall.sh
# Pour un autre chemin :
sudo bash uninstall.sh --panel-dir /chemin/vers/pterodactyl
```

Le script restaure les originaux suivis, retire les fichiers ajoutés, recompile et vide les caches. Il ne désinstalle pas Blueprint ou Vinus Catalog. Après une mise à jour Pterodactyl, vérifier que la sauvegarde d’origine correspond à la version à restaurer.

| Chemin | Usage |
| --- | --- |
| `/var/lib/vinuspanel/original` | Originaux suivis |
| `/var/backups/vinuspanel/install-*` | Transactions d’installation |
| `/var/lib/vinuspanel/last-transaction` | Dernière transaction |
| `/var/backups/vinuspanel/uninstalled-*` | État archivé au retrait |

Les données Design et images personnelles restent à sauvegarder séparément. Une restauration partielle d’une opération Minecraft peut laisser le serveur suspendu : conserver le dossier de récupération et faire examiner l’état par l’administrateur.

## Symptômes fréquents

| Symptôme | Vérifier |
| --- | --- |
| Ancienne interface | Compilation terminée, bon panel, cache navigateur/proxy |
| Console déconnectée | Wings, WebSocket, proxy HTTPS, message précis |
| Catalogue absent | Blueprint, extension, permissions et détection |
| Fenêtre Joueurs absente | Installation terminée puis état En ligne, même compte/navigateur, offre non déjà fermée |
| Liaison incompatible | Minecraft, loader exact, Java et matrice du chapitre Joueurs |
| XP/vie anciens | Source sauvegarde/direct, chargement du compagnon, heartbeat récent |
| Mod sans boutons d’action | Les mods natifs sont en lecture seule ; les actions sont Bukkit |
| Arrêt trop long | Console et arrêt normal ; aucun kill automatique |
| Ancienne liaison détectée | Compatibilité du JAR existant, conservé sans remplacement |
| Délai HTTP d’installation | État et fichiers avant toute nouvelle tentative |
| BlueMap vide | Chargement, ressources et premier rendu |

## Demander de l’aide

Dans une [issue GitHub](https://github.com/yhanottv/VinusPanel/issues), indiquer les versions thème/panel/Blueprint/Minecraft/loader/Java, le navigateur, les étapes, le comportement attendu, l’heure et la référence d’erreur. Expurger les logs et captures. Ne jamais publier mots de passe, tokens, clés, configuration privée ou données de joueurs.

[Sommaire](README.md)
