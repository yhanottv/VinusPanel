# 📖 Présentation et compatibilité

VinusPanel est une surcouche pour **un panel Pterodactyl existant**. Le dépôt ne contient ni une distribution complète de Pterodactyl, ni Wings, ni les données d’un hébergeur. Les outils Minecraft sont fournis séparément par l’extension Blueprint **Vinus Catalog**.

## Choisir la bonne version

Le wiki couvre la branche `codex/live-design-studio`. Elle inclut les évolutions de la [PR #3](https://github.com/yhanottv/VinusPanel/pull/3). Une archive publiée, un ancien tag et `main` peuvent avoir un périmètre différent. Lire le changelog de la version installée avant de suivre une procédure liée à une nouveauté.

## Environnement vérifié

| Composant | Périmètre |
| --- | --- |
| Pterodactyl Panel | 1.15.1 |
| Blueprint | beta-2026-06, optionnel pour le thème, requis pour le catalogue |
| Vinus Catalog | 1.3.0, installé séparément |
| PHP | 8.3, avec les exigences du panel |
| Node.js | Build vérifié sous Node 22 ; installeur exigeant 22+ |
| Yarn | 1.x |
| Système | Ubuntu 24.04 ; scripts Bash pour Ubuntu/Debian avec utilisateur web `www-data` |
| Wings | Connexion existante fonctionnelle, non installée par le thème |

Les autres versions, forks et extensions ne sont pas automatiquement certifiés. Installer Blueprint avant VinusPanel si son intégration est nécessaire. Les tests responsive incluent des largeurs de 390, 742, 1920 et 3440 pixels dans Chromium ; cela ne certifie pas tous les téléphones et navigateurs.

## Composants du projet

- Le thème : tableau de bord, console, navigation, compte, administration et Design Studio.
- Vinus Catalog : logiciels, mods/plugins, modpacks, propriétés, mondes, BlueMap et joueurs.
- VinusPlayers : compagnon côté Minecraft pour transmettre les données en direct ; sa compatibilité est plus étroite que celle du catalogue.

La licence du code VinusPanel est MIT. Les licences des composants tiers sont conservées dans le dépôt. Les images Minecraft conservent leurs droits propres. Les modules absents du projet ne deviennent pas disponibles par une simple option visuelle.

[Sommaire](README.md) · [Installation](02-Installation.md)
