# 🗺️ Propriétés, mondes et BlueMap

## Propriétés et MOTD

L’éditeur expose les propriétés prises en charge et conserve les clés inconnues. Il détecte les modifications concurrentes : si le fichier change pendant l’édition, recharger et réconcilier avant d’enregistrer.

Certains réglages prennent effet au redémarrage. Vérifier la version, l’egg et les allocations ; une option visuelle ne rend pas une propriété incompatible utilisable.

## Importer un monde

Sauvegarder puis arrêter Minecraft. L’import ZIP inspecte les chemins et métadonnées avant activation. Lire le monde choisi et les changements annoncés. Les fichiers précédents sont conservés dans le dossier de récupération indiqué.

Un modpack remplace plus largement les fichiers actifs et le monde. Un monde ouvert dans une version récente peut ne pas être rétrocompatible ; une archive valide ne garantit pas son format pour votre version.

## BlueMap

BlueMap exige une version compatible, suffisamment de mémoire/disque et un premier rendu. L’administrateur choisit s’il autorise le téléchargement des ressources Minecraft demandé par BlueMap.

La visionneuse lit les fichiers générés via une autorisation temporaire du panel et une iframe isolée. **Aucun port web BlueMap public supplémentaire n’est nécessaire** pour ce mode. Une carte déjà générée peut être consultée lorsque Minecraft est arrêté.

**Joueurs sur la carte.** L'installation active le suivi des joueurs de BlueMap (`live-player-markers: true`, positions écrites toutes les 5 secondes dans les fichiers de la carte) : la visionneuse affiche la **tête** de chaque joueur connecté, à sa position. Les têtes viennent des skins téléchargés par BlueMap depuis les serveurs Mojang à la connexion du joueur : un joueur déjà connecté avant l'activation doit se reconnecter, et un serveur en mode hors ligne (`online-mode=false`) n'a pas de skin officiel. Pour une installation BlueMap antérieure à ce changement, éditer `config/bluemap/plugin.conf` (ou `plugins/BlueMap/plugin.conf`), remplacer `live-player-markers: false` par `true`, vérifier que `write-players-interval` est supérieur à 0 puis redémarrer le serveur.

Si la carte est vide, vérifier le chargement de BlueMap dans la console, les ressources et le premier rendu, puis les chemins des fichiers disponibles. Un grand monde peut demander beaucoup de temps/disque. Une carte vide n’est pas forcément une erreur du panel.

Les informations d’instance, mondes et joueurs restent privées. Masquer ces données dans les tickets publics.

[Sommaire](README.md)
