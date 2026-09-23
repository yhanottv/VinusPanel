# Espace serveur et identification du logiciel

Le bouton **Gérer** ouvre `/server/:id/overview`. L’URL historique `/server/:id` reste la console : les anciens liens et les extensions Blueprint conservent leur destination.

## Identification

Le transformateur API ajoute `software_profile` à la liste des serveurs comme à la fiche serveur. La détection utilise les profils administrateur existants de VinusCatalog, puis les variables de logiciel/JAR, puis le nom de l’egg. Elle ne dépend pas d’identifiants d’eggs locaux et ne renvoie pas les variables brutes. Les noms commerciaux dans la description d’un serveur ne servent pas de preuve.

Forge, NeoForge, Fabric, Spigot, Paper, Velocity et Youer disposent de marques locales. Les autres profils affichent leurs initiales ; les logiciels inconnus gardent une icône générique. Les sources des marques sont indiquées dans `licenses/software-icons.md`. Une modification manuelle du contenu d’un JAR générique ne peut pas être détectée depuis ces seules métadonnées : il faut mettre à jour les variables ou le profil administrateur.

## Comparaison avec la démonstration

L’Overview, la Console et les outils Minecraft du serveur « ADDONS SHOWCASE SERVER » de la [démonstration Stark](https://ptero.dezerx.com/) ont été inspectés. Le regroupement et les interactions sont adaptés aux API effectivement présentes.

| Zone | Fonctionnement dans VinusPanel |
| --- | --- |
| Essentiels | Aperçu, Console, Fichiers, Assistance, Démarrage, Paramètres |
| Aperçu | CPU, mémoire, disque, débits entrants/sortants, état, durée de session, adresse copiable, nœud, identifiant et configuration réelle ; aucune facturation inventée |
| Console | Terminal Wings, filtres Tout/Avertissements/Erreurs, recherche textuelle, taille 10–20 px, export local du journal filtré, historique des 32 commandes de la session, graphiques et ressources |
| Plugins / Mods | Inventaire des JAR présents, accès au gestionnaire de fichiers et intégration du catalogue VinusCatalog installé ; son choix de version, ses dépendances et ses contrôles d’installation sont conservés |
| Version | Logiciel déclaré, version Minecraft, image Docker et variables pertinentes ; liens vers Démarrage et la réinstallation existante |
| Propriétés | Édition des propriétés de jeu, performances, accès et MOTD effectivement présentes dans `server.properties` ; édition brute toujours disponible |
| Joueurs | Recherche des joueurs connus dans `usercache.json`, liens vers les fichiers des opérateurs, de la liste blanche et des bannissements ; ce n’est pas un indicateur de présence en ligne |
| Mondes | Détection des dossiers de mondes locaux et accès aux fichiers/sauvegardes |
| Gestion | Bases de données, sauvegardes, réseau, planifications, utilisateurs et activité : composants et permissions Pterodactyl existants |
| Blueprint | Hooks de navigation, terminal, informations, commandes et boutons de puissance conservés ; autres routes d’extensions accessibles |

Les catégories des modules absents sont masquées conformément au choix de l’utilisateur. Cela concerne notamment les modpacks, la visionneuse 3D, Hytale, Palworld, FiveM, le changement d’egg, les sous-domaines et le gestionnaire de secrets. Les inventaires NBT/actions avancées des joueurs, la bibliothèque CurseForge de mondes et la facturation de la démo ne sont pas implémentés par ces vues. Le journal est téléchargé localement ; aucun partage public automatique n’est effectué.

## Comportements à préserver

- Les groupes se replient et le menu mobile se ferme à la navigation ou avec Échap. Les outils Minecraft suivent le profil : les proxys n’affichent pas Propriétés/Mondes/Joueurs et seuls les types d’extensions compatibles apparaissent.
- L’état de puissance est initialisé depuis les ressources après connexion, même sans ouvrir la console. Une réponse HTTP tardive ne remplace pas un état de socket plus récent. Les commandes existantes restent soumises à leurs permissions et états autorisés.
- Les erreurs et absences de données ne deviennent pas de fausses mesures. Les débits sont calculés depuis les différences de compteurs réseau.
- L’éditeur de propriétés conserve commentaires, clés inconnues, encodage des caractères spéciaux et fins de ligne. Il laisse les valeurs continuées à l’éditeur brut, valide les champs numériques et relit le fichier avant écriture pour détecter une modification concurrente. Cette relecture est une protection optimiste, pas un verrou atomique côté Wings.
- Aucune commande de démarrage/arrêt, installation de mod, réinstallation ou modification des mondes n’est nécessaire pour vérifier le thème.

## Validation

- TypeScript et compilation de production sur le panel Pterodactyl 1.15.1 avec Blueprint.
- TypeScript sur les sources officielles Pterodactyl `v1.15.1` avec l’overlay standard, sans Blueprint ; dépendances Node de l’installation utilisées pour cette vérification.
- 107 tests Jest dans 13 suites, dont les filtres ANSI, la conservation des propriétés et les courses de l’initialisation d’état ; 10 vérifications PHP de détection du logiciel.
- Vérifications navigateur : logos des instances, Gérer vers Aperçu, état arrêté prêt à démarrer sans ouvrir la console, lecture de la console en activité, filtres, taille de texte, inventaire des mods, catalogue NeoForge 1.21.1, propriétés réelles, menu mobile et absence de débordement horizontal à 390 px.
- Sources et manifeste précédent sauvegardés avant publication des ressources compilées. Les anciens chunks restent disponibles pour les sessions déjà ouvertes. Les captures contenant des données de l’installation restent locales.

Commande de test compatible avec les dépendances de l’installation :

```sh
./node_modules/.bin/jest --runInBand --transform '{"^.+\\.tsx?$": ["ts-jest", {"tsconfig": {"jsx": "react"}, "isolatedModules": true}]}'
php scripts/test-software.php
bash scripts/check-package.sh
```
