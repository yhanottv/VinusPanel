# 📖 Présentation et compatibilité

VinusPanel est un **thème Pterodactyl open source** accompagné d'un installeur tout-en-un. Sur un VPS vierge, `install.sh` installe Pterodactyl Panel, le thème, Wings et un garde-fou anti-crash ; sur un panel déjà installé, il applique seulement le thème. Les outils Minecraft sont fournis séparément par l'extension Blueprint **Vinus Catalog**.

## Quelle version suit cette documentation ?

Cette documentation décrit la branche **`main`** du dépôt. Les archives publiées et les anciens tags peuvent avoir un périmètre différent : lire le [changelog](https://github.com/yhanottv/VinusPanel/blob/main/CHANGELOG.md) de la version installée avant de suivre une procédure liée à une nouveauté.

## Environnement vérifié

| Composant | Périmètre |
| --- | --- |
| Pterodactyl Panel | **1.15.1** (installé par `install.sh` sur un VPS vierge) |
| Système | **Ubuntu 24.04 LTS** ; scripts Bash pour Ubuntu/Debian avec utilisateur web `www-data` |
| PHP | 8.3 |
| Node.js / Yarn | Node **22** (22 minimum exigé), Yarn 1.x |
| Base, cache | MariaDB 10.11, Redis 7 |
| Wings | Installé par `install.sh` sur VPS vierge (Docker inclus) |
| Blueprint | `beta-2026-06`, optionnel pour le thème, **requis** pour le catalogue |
| Vinus Catalog | 1.4.0, installé séparément |

Les autres versions, forks et extensions ne sont pas automatiquement certifiés. Les tests responsive incluent des largeurs de 390, 742, 1920 et 3440 pixels dans Chromium ; cela ne certifie pas tous les téléphones et navigateurs.

## Composants du projet

- **Le thème** : tableau de bord, assistant de création de serveur, console, navigation, compte, administration et Design Studio.
- **L'installeur** (`install.sh`, `uninstall.sh`) : installation complète, mise à jour, sauvegarde et retour arrière.
- **Vinus Catalog** : logiciels, mods/plugins, modpacks, propriétés, mondes, BlueMap et joueurs.
- **VinusPlayers** : compagnon côté Minecraft pour transmettre les données en direct ; sa compatibilité est plus étroite que celle du catalogue.
- **`vinus-guard`** : service qui met en quarantaine les mods client-only responsables d'un plantage et relance le serveur.

## Ce que le projet ne fait pas

Pas de facturation, de gestion DNS ni de déploiement de machines. Les modules absents ne deviennent pas disponibles par une simple option visuelle.

La licence du code VinusPanel est MIT. Les licences des composants tiers sont conservées dans le dépôt. Les images Minecraft conservent leurs droits propres.

[Sommaire](README.md) · [Installation](02-Installation.md)
