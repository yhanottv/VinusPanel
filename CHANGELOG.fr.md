# Journal des modifications de VinusPanel

[English](CHANGELOG.md) · **Français**

Chaque entrée du changelog existe dans les deux langues : `CHANGELOG.md` (anglais) et `CHANGELOG.fr.md` (français). Les versions antérieures à 2.4.0 sont décrites uniquement en anglais dans `CHANGELOG.md`.

## Non publié — Live Design Studio

### Corrigé

- **Visionneuse BlueMap : aucune tête de joueur.** L'installeur écrivait `live-player-markers: false`. Avec ce réglage, BlueMap ne liste pas les joueurs et ne télécharge pas leurs skins : la visionneuse n'affichait que la carte. Les nouvelles installations écrivent maintenant `live-player-markers: true` avec `write-players-interval: 5` : positions et têtes sont écrites dans les fichiers de la carte lus par la visionneuse. Pour une installation BlueMap existante, mettre `live-player-markers: true` dans `config/bluemap/plugin.conf` (ou `plugins/BlueMap/plugin.conf`) puis redémarrer. Des tests couvrent ces réglages et la distribution de `live/players.json` et des images de têtes.
- Les contrôles du joueur ne faisaient rien sur les liaisons de mods natifs (Fabric, Forge, NeoForge), en lecture seule. Soigner, nourrir, éliminer, mode de jeu, niveaux d'XP, opérateur, liste blanche et bannissement sont maintenant envoyés comme commandes vanilla dans la console, avec des noms de joueur et des valeurs validés, derrière la permission `control.console`.
- Page Joueurs : les objets affichaient une icône de remplacement car l'installeur ne construisait jamais la planche d'icônes. Elle est maintenant construite automatiquement (`--textures` pour réessayer). Elle combine le pack `minecraft-textures` (version fixée, **icônes 3D isométriques** des blocs comme l'établi, empreinte vérifiée) et les textures du client Mojang : environ 2 000 icônes. Une planche construite avant ce changement est régénérée à la prochaine installation ou mise à jour.
- Le script d'administration (`vinus-admin.js`) était supprimé par chaque `yarn build:production` (l'étape `clean` de Pterodactyl efface tous les `*.js` sous `public/assets`) : la recherche, le changement de langue et le marqueur de navigation de l'administration échouaient silencieusement. Il est maintenant livré dans `public/vinus/js/`.
- Assistant de déploiement : le propriétaire était toujours le premier compte (l'assistant lisait un identifiant numérique que l'API client ne fournit pas) ; les hôtes cgroup v2 illimités (`cpu.max` = `max 100000`) indiquaient un seul cœur ; un `shell_exec` désactivé faisait planter la page ; un catalogue Forge absent ou injoignable bloquait la création avec une erreur de version trompeuse ; les échecs de création n'étaient pas journalisés.
- `vinus-guard` (exécuté en root) ne suit plus de liens symboliques `mods`, `logs`, `crash-reports` ou de quarantaine hors du volume d'un serveur, ne traite que les volumes nommés par UUID et respecte le dossier du panel choisi à l'installation. `uninstall.sh` supprime maintenant le service du garde-fou.
- `install.sh` génère la clé applicative avant `composer install` (ce qui supprime deux fausses erreurs du journal) et met à jour le catalogue avec `blueprint -install` (`blueprint -upgrade` met à jour Blueprint lui-même).
- Réparation du test périmé de limitation de débit du catalogue et du spec `ServerRow`, suppression d'imports inutilisés.

### Ajouté

- `install.sh` installe tout sur un VPS vierge, Blueprint `beta-2026-06` et Vinus Catalog compris (panel → Blueprint → thème avec variantes Blueprint → catalogue → garde-fou → Wings). Nouvelles options `--[no-]blueprint`, `--catalog` et `--textures` ; les étapes catalogue et textures ne sont pas bloquantes. Validé de bout en bout sur un VPS Ubuntu 24.04 vierge avec Traefik préinstallé (environ 7 minutes).
- `install.sh` reprend une installation vierge interrompue au lieu de considérer un panel à moitié installé comme terminé (`/var/lib/vinuspanel/bootstrap-incomplete`) et installe `zip` et `wget`.
- Le bouton « Créer un serveur » du tableau de bord ouvre l'assistant de création (celui de la première connexion) au lieu du formulaire classique de l'administration, qui reste accessible depuis l'espace admin.
- Un workflow CI prêt à activer (`docs/ci/frontend.yml`) exécute TypeScript, Jest, le build de production et tous les tests PHP/shell sur un Pterodactyl 1.15.1 propre.
- Changelog bilingue : `CHANGELOG.md` (anglais) et `CHANGELOG.fr.md` (français).

### Documentation

- Réécriture de la documentation GitBook (`docs/gitbook/`) pour une installation complète de A à Z sur un VPS vierge : prérequis, déroulé de l'installeur, identifiants, vérifications, Blueprint et catalogue automatiques, nouveau chapitre de durcissement en production (HTTPS, pare-feu, SSH, e-mails, sauvegardes, journaux), assistant de première connexion, `vinus-guard`, icônes d'objets, joueurs BlueMap, mise à jour/retour arrière/réinitialisation et tableau de dépannage étendu. Les chapitres 12 et 13 deviennent 13 et 14. READMEs, `INSTALLATION.fr.md` et guide du catalogue alignés (Vinus Catalog 1.4.2).

### Développement antérieur sur `main`

- Ajout de repères emoji aux chapitres GitBook et mise à jour du guide d'installation pour utiliser `main`.
- Synchronisation du dernier style déployé de la page Activité ; la navigation Blueprint, les notifications et les commandes d'alimentation de la console restent alignées sur le thème standard, avec les points d'extension préservés.
- Le rappel VinusPlayers après installation est conservé sept jours côté panel, pour le compte et le serveur concernés, et survit à un rechargement ou un changement d'appareil. Point d'entrée ajouté sur la page Versions pour rouvrir la proposition.
- Proposition VinusPlayers illustrée et animée après une installation Minecraft réussie, une fois le serveur en ligne. « Plus tard » conserve la page Joueurs ; l'activation explicite arrête proprement, vérifie/installe puis demande le démarrage, avec délai maximal et protection des fichiers existants.
- Publication de [VinusPanel Docs sur GitBook](https://vinuspanel.gitbook.io/vinuspanel-docs/) : chapitres français, guide de démarrage en anglais, page d'accueil et sommaire. Les sources restent dans `docs/gitbook/`. Le wiki GitHub est désactivé.
- Icônes arobase/clé pour les champs du compte et boutons d'affichage du mot de passe accessibles indépendamment.
- Icônes contour pour l'administration, marqueur coulissant de navigation active et effets d'entrée/de survol respectant la réduction des animations.
- Compagnons de joueurs Bukkit, Fabric, Forge et NeoForge vérifiés et embarqués, avec sélection exacte de Minecraft/loader et installation serveur arrêté vérifiée par empreinte après consentement explicite. Les mods natifs fournissent des instantanés en lecture seule ; Bukkit conserve les actions avec accusé de réception. Matrice dans `docs/PLAYERS.md`.
- Nouvelle vue d'ensemble du compte avec sections séparées photo, e-mail, mot de passe et double authentification ; formulaires d'authentification et photos de profil locales conservés.
- Nouvelle administration : surfaces plates, navigation avec recherche, tableaux adaptatifs, formulaires plus clairs et identité commune ; actions serveur/nœud, permissions et points d'extension Blueprint préservés.
- Les fiches de joueurs en direct se rafraîchissent chaque seconde, reprennent au retour sur l'onglet et synchronisent XP/mode de jeu sans écraser les modifications en cours ni chevaucher les requêtes.
- Fiches de joueurs avec inventaires, équipement, coffres de l'Ender, skins, vie, nourriture et XP en lecture seule.
- Compagnon Bukkit optionnel pour la présence en direct et les commandes validées (soigner, nourrir, éliminer, accès, mode de jeu, niveaux).
- Libellés explicites pour les données sauvegardées et les fonctions indisponibles ; installation des compagnons et illustrations Minecraft optionnelles documentées.
- Le formulaire Design est remplacé par un éditeur plein écran par catégories avec aperçus responsives isolés.
- Réglages visuels partagés pour le tableau de bord, la navigation, l'authentification, l'aperçu serveur et la console.
- Réglages d'identité historiques, illustrations privées des serveurs et points d'extension Blueprint conservés.
- Options enregistrées, URL de navigation et CSS validées ; l'affichage de l'aperçu en cadre est limité aux administrateurs de même origine.

## 3.2.0 — 2026-09-24

- Le tableau de bord utilise toute la largeur disponible en Full HD et ultrawide ; la mise en page mobile est conservée.
- Valeurs par défaut orange, en conservant les réglages de l'administrateur et les palettes personnelles.
- Logos des logiciels, Aperçu/Console de serveur réorganisés, navigation de fichiers compacte et contrôles de confidentialité de l'adresse.
- Installation de logiciels et de versions Minecraft, modpacks, mondes, édition du MOTD et visionneuse BlueMap authentifiée via Vinus Catalog 1.3.0.
- Catalogues Modrinth et SpigotMC gratuit, plus un adaptateur CurseForge optionnel nécessitant une clé API privée. La validation réelle de CurseForge reste à faire.
- Points d'extension Blueprint, permissions Pterodactyl, exigence de serveur arrêté et copies de récupération des opérations préservés.
- Documentation et images promotionnelles actualisées avec des données de démonstration ; notes de déploiement et configuration personnelle exclues.

## 3.1.1 — Correctif de limitation de débit du catalogue

- Compteurs de limitation séparés pour la navigation et l'installation dans Vinus Catalog : parcourir ou préparer un mod n'épuise plus les cinq installations par minute.
- Extension Blueprint optionnelle en version 1.2.1 et test de non-régression pour la séquence de requêtes qui provoquait l'erreur HTTP 429.

## 3.1.0 — Live Design Studio

- Design Studio réservé aux administrateurs déplacé dans la navigation client, avec aperçu visuel immédiat.
- Champs de fichier natifs remplacés par des miniatures et des boutons de téléversement clairs ; barres de couleur remplacées par des pastilles compactes et des champs hexadécimaux.
- Modifications conservées en brouillon jusqu'à l'enregistrement, avec abandon et protection contre la perte de modifications.
- Ancienne URL Design de l'administration redirigée vers le studio client.
- Route et navigation client incluses dans la surcouche Blueprint : `/design` fonctionne sur les panels avec Blueprint.
- Maquette illustrative remplacée par le vrai tableau de bord et la vraie carte de serveur dans l'aperçu.
- Jetons de design et images enregistrés repris dans les pages Blueprint, cartes de serveur et navigation serveur comprises.
- Correction d'une règle d'arrière-plan globale qui masquait les images de fond téléversées après l'enregistrement.
- Bannière enregistrée de chaque serveur affichée en évidence dans l'en-tête de sa console.

## 3.0.0 — Design Studio

- Page Design réservée aux administrateurs : nom du panel, accent, fond, surface, texte, logo et image de fond.
- Couleurs et bannières téléversées par serveur sur les cartes du tableau de bord, la navigation serveur et les en-têtes.
- Réglages et images stockés sur le VPS pour survivre aux mises à jour du thème.
- Guide détaillé en français d'installation et de personnalisation sur VPS.
- Téléversements limités aux images PNG, JPEG et WebP validées ; données de design d'un serveur limitées aux serveurs accessibles.

## 2.4.0 — Français et anglais

- Sélecteur français/anglais sur les pages d'authentification et client, avec préférence du navigateur et repli par URL si le stockage est indisponible.
- Libellés, messages de validation, état de la console, graphiques, dates et navigation de VinusPanel localisés ; changer de langue recharge la page.
- Traductions autonomes de l'interface du catalogue dans Vinus Catalog 1.2.0, pour conserver une installation Blueprint indépendante.
- Galerie de captures actualisée avec l'écran de connexion, la liste des serveurs, les graphiques de ressources en direct et l'aigle du terminal.

Les noms de serveurs, contenus des utilisateurs, journaux de jeu et textes d'extensions tierces ne sont pas traduits. L'administration historique et les écrans d'origine de Pterodactyl conservent leurs propres traductions.
