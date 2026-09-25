# Console, fichiers et gestion

## Aperçu et console

L’aperçu rassemble statut, adresse, nœud, logiciel, version et consommation. La console affiche les logs en direct et accepte les commandes lorsque la connexion, l’état et les permissions l’autorisent. Une perte WebSocket peut interrompre les logs et graphiques.

Les commandes **Démarrer**, **Arrêter** et **Redémarrer** utilisent Pterodactyl. L’arrêt forcé garde sa confirmation : il ne remplace pas l’arrêt normal qui laisse Minecraft sauvegarder. Le parcours VinusPlayers ne force jamais l’arrêt.

## Fichiers

Parcourir, éditer et téléverser selon les droits accordés. Arrêter Minecraft quand l’outil l’exige avant de modifier ses fichiers. Vérifier le chemin et sauvegarder avant de remplacer une configuration ou un monde.

Les dossiers `vinus-*` peuvent conserver les anciens fichiers d’une opération. Ils ne remplacent pas une sauvegarde complète ; les garder jusqu’à validation du changement.

## Sauvegardes, réseau, bases et planifications

Les sauvegardes dépendent du stockage et des limites administratives. Contrôler qu’une sauvegarde est terminée et exploitable avant de restaurer. Les allocations définissent les ports autorisés : ajouter un port dans Minecraft ne crée pas une allocation Pterodactyl.

Les bases dépendent des hôtes configurés. Leurs identifiants sont privés. Vérifier le fuseau et l’ordre des tâches planifiées, surtout pour les arrêts et sauvegardes.

## Utilisateurs, activité et démarrage

Un sous-utilisateur reçoit seulement les permissions nécessaires à sa tâche. Voir un serveur ne donne pas tous les droits de console, d’installation ou d’administration. L’activité permet de retracer les actions.

Les variables de démarrage restent liées à l’egg et au logiciel. Changer Java ou le JAR sans vérifier les fichiers peut empêcher le démarrage. Les traitements et validations Pterodactyl restent en place derrière l’interface.

[Sommaire](README.md) · [Versions et modpacks](07-Versions-et-Modpacks.md)
