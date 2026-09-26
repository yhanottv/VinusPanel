# 🔌 Mods, plugins, mises à jour et garde-fou

Le logiciel détecté détermine les onglets : Fabric/Forge/NeoForge proposent des mods, Paper/Spigot des plugins, les proxys leurs plugins spécifiques. Les hybrides peuvent proposer les deux. Un mod Fabric n’est pas un plugin Paper ; une version Minecraft identique ne garantit pas la compatibilité.

## Installer

1. Arrêter le serveur et vérifier les permissions de fichiers.
2. Rechercher un projet depuis la source souhaitée.
3. Lire l’aperçu de version et de dépendances.
4. Confirmer les téléchargements proposés.
5. Démarrer et examiner les logs de chargement.

Le catalogue limite un JAR principal à 25 Mio, un lot à 20 projets/100 Mio et les dépendances à 12 niveaux. Les restrictions de l’auteur/fournisseur restent applicables. Les dépendances optionnelles et conflits avec les fichiers manuels ne sont pas tous résolus automatiquement.

Si le profil est inconnu ou indique `latest`, préciser la version ou demander à l’administrateur de corriger le profil de l’egg.

## Mises à jour

Le suivi concerne les fichiers installés par le catalogue. Les JAR manuels ne sont pas importés automatiquement. Rechercher les mises à jour, comparer les versions puis valider serveur arrêté. Les fichiers de récupération sont conservés et les fichiers inconnus/modifiés ne sont pas écrasés aveuglément.

En cas d’erreur, comparer loader, Minecraft, Java et dépendances exigées par l’auteur. Sur un hybride, deux extensions peuvent entrer en conflit malgré des métadonnées compatibles. Un checksum prouve l’intégrité du fichier, pas l’absence de code malveillant.

CurseForge exige la clé privée de l’administrateur et ne donne pas accès aux ressources payantes/privées. VinusPanel ne contourne pas les restrictions de téléchargement.

## Garde-fou anti-crash (`vinus-guard`)

`install.sh` installe le service systemd `vinus-guard`. Toutes les 20 secondes, pour chaque serveur **arrêté**, il cherche dans le dernier log ou rapport de plantage les signatures d'un mod réservé au client (« invalid dist DEDICATED_SERVER », « has failed to load correctly »). Il déplace alors les JAR fautifs de `mods/` vers `vinus-client-mods/` puis redémarre le serveur. Sans mod identifié dans le log, il met en quarantaine les mods Fabric déclarés `client`.

Limites et garanties :

- **Au plus 15 tentatives par heure et par serveur** ; au-delà, une intervention manuelle est nécessaire (message dans le journal).
- Les mods mis en quarantaine ne sont **pas supprimés** : les remettre dans `mods/` si le diagnostic était faux.
- Le garde-fou ne suit jamais un lien symbolique hors du dossier du serveur et ne traite que les dossiers nommés d'après un UUID de serveur.
- Journal : `/var/log/vinus-guard.log`. Suivi : `systemctl status vinus-guard`. Période : variable `VINUS_GUARD_INTERVAL`.
- `uninstall.sh` arrête et supprime le service.

[Sommaire](README.md)
