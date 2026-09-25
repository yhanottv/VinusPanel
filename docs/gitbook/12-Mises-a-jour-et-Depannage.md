# 🔧 Mises à jour, récupération et dépannage

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
