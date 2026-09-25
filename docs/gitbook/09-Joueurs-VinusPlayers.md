# Joueurs et VinusPlayers

## Sans liaison

Joueurs reste accessible avec `file.read-content`. La page peut afficher les joueurs connus et leurs dernières sauvegardes, identifiées comme telles. La présence réelle lorsque Minecraft fonctionne nécessite une liaison active. Les valeurs absentes ne sont pas inventées ; un joueur peut ne pas encore avoir de sauvegarde d’inventaire.

## Installer ou reporter

Après une installation Version/Modpacks et un premier démarrage, la fenêtre VinusPlayers explique les fonctions puis propose l’activation avec arrêt/redémarrage. **Plus tard** ne modifie rien.

Pour l’ajouter ultérieurement, arrêter le serveur puis ouvrir **Joueurs → Installer la liaison**, et démarrer normalement. L’installation demande `file.read-content`, `file.create`, `file.update` et `control.console`. Le parcours avec arrêt/redémarrage demande aussi `control.stop` et `control.start`.

## Combinaisons vérifiées

| Compagnon | Minecraft | Loader/runtime | Fonctions |
| --- | --- | --- | --- |
| Bukkit 1.1.0 | 1.20.1, 1.21.1 | Tests sur Paper ; dérivés à vérifier par l’opérateur | Direct et actions |
| Fabric | 1.20.1 | 0.16.10 | Direct en lecture seule |
| Fabric | 1.21.1 | 0.16.14 | Direct en lecture seule |
| Forge | 1.20.1 | 47.3.0 | Direct en lecture seule |
| NeoForge | 1.21.1 | 21.1.219 | Direct en lecture seule |

Java 17 est requis pour 1.20.1, Java 21 pour 1.21.1. Une image Java reconnue et un loader exact sont nécessaires. Vanilla, Folia, proxys, Bedrock et versions non listées ne sont pas automatiquement couverts. Les hybrides reçoivent un seul compagnon, priorité au plugin Bukkit ; leur association d’extensions doit être testée.

## Informations et actions

Inventaire, équipement, coffre de l’Ender, skin, vie, armure, nourriture et expérience apparaissent si disponibles. **Les inventaires ne sont pas modifiables**. Les objets inconnus gardent identifiant/quantité et une icône de remplacement.

Le plugin Bukkit accepte les actions autorisées : heal, kill, feed, opérateur, whitelist, ban, mode de jeu et niveaux. Les actions sensibles demandent confirmation. Le panel attend un accusé de réception ; une expiration ne relance pas automatiquement la commande. Ajouter quelqu’un à la whitelist ne l’active pas globalement. Les mods natifs sont en lecture seule.

Aucun port public, clé API ou accès RCON supplémentaire n’est nécessaire. Les mods sont côté serveur uniquement. Les snapshots sont écrits dans `.vinus/players/` et lus par Wings avec les permissions du panel. Ne pas les publier.

## Rafraîchissement et charge

Une fiche visible en direct se rafraîchit chaque seconde, sans chevauchement des requêtes. Les listes/sauvegardes se rafraîchissent toutes les cinq secondes. Un onglet masqué suspend ses demandes. Le compagnon utilise un seul écrivain en arrière-plan et limite l’accumulation des snapshots.

50 joueurs ne signifient pas 50 requêtes navigateur par seconde. En revanche, 50 fiches visibles dans différents onglets peuvent approcher ce débit. La collecte des inventaires garde un coût sur Minecraft. Aucun test de charge à 50 joueurs en production ne garantit la capacité de votre machine.

## Images et skins

La planche de textures Minecraft est optionnelle et séparée du code :

```bash
python3 scripts/fetch-player-textures.py /var/www/pterodactyl/public/assets/images/vinus/players
```

Le script utilise le client officiel et vérifie ses empreintes. Garder les crédits générés. Les modèles ItemsAdder/textures moddés ne sont pas inclus. Les skins passent par les services Mojang et le cache du panel ; les UUID hors ligne peuvent ne pas avoir de skin officiel.

[Guide technique détaillé](https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/docs/PLAYERS.md) · [Sommaire](README.md)
