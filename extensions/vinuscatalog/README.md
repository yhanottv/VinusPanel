# Vinus Catalog — extension Blueprint

Catalogue Modrinth pour Pterodactyl 1.15.1 et Blueprint **beta-2026-06**. Il fonctionne indépendamment du thème ; VinusPanel ajoute son entrée dans la navigation latérale.

La version **1.2.0** traduit les commandes du catalogue en français ou en anglais selon la langue active du panel. Les descriptions Modrinth, noms de fichiers et messages du service conservent leur langue d’origine. Les ressources de traduction sont incluses dans l’extension : le thème VinusPanel n’est pas requis.

## Installation

1. Installer Blueprint depuis sa [source officielle](https://blueprint.zip/guides/admin/install), en sauvegardant le panel et sa base.
2. Pour VinusPanel, appliquer ensuite `install.sh` : il détecte Blueprint et conserve ses points d’extension. Cette intégration est limitée aux versions indiquées ci-dessus.
3. Depuis ce dossier, créer le paquet : `zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md`.
4. Copier le paquet dans la racine du panel puis lancer `blueprint -install vinuscatalog`.

Le paquet utilise `ignorePlaceholders` : Blueprint ne doit pas remplacer les expressions JSX comme `{version}`. Aucune clé privée ou donnée propre à un hébergeur n’est nécessaire.

## Détection et compatibilité

| Logiciel | Catégories proposées |
| --- | --- |
| Forge, NeoForge, Fabric, Quilt | Mods compatibles avec ce chargeur |
| Paper, Purpur, Spigot, Bukkit, Folia, Sponge | Plugins compatibles |
| Velocity, Bungeecord, Waterfall | Plugins compatibles avec le proxy |
| Youer, Mohist | Deux onglets Mods et Plugins |
| Arclight | Deux onglets après identification du chargeur Forge, Fabric ou NeoForge |
| Vanilla ou egg inconnu | Aucun téléchargement automatique |

La détection prend d’abord en compte le logiciel déclaré (`SOFTWARE` ou `SERVER_TYPE`) et le JAR sélectionné (`SERVER_JARFILE`, `JARFILE`, `SERVER_JAR_PATH`), puis le nom de l’egg. Ainsi `youer.jar` sous un egg « Paper » affiche bien les deux catégories. Aucun numéro d’egg propre à un hébergeur n’est codé en dur. Cela identifie le logiciel déclaré ; un JAR renommé de façon trompeuse ne peut pas être identifié avec certitude.

Pour un egg renommé ou personnalisé, copier `config/vinuscatalog.php.example` vers `config/vinuscatalog.php` dans le panel et renseigner `egg_profiles` avec **l’UUID de l’egg** et un profil défini dans `app/Detection.php`. `server_profiles` permet une exception prioritaire avec l’UUID d’un serveur. Exécuter `php artisan config:clear` après modification. Le fichier d’exemple est vide : les correspondances propres à une installation ne doivent pas être publiées.

La version Minecraft provient de `MINECRAFT_VERSION`, `MC_VERSION`, `MINECRAFT_VER` ou `MC_VER`. Les valeurs `latest` et les versions du logiciel proxy ne sont jamais devinées. En l’absence de version explicite, l’utilisateur choisit celle réellement installée. Arclight peut préciser `LOADER` ou `MOD_LOADER` ; sinon une correspondance administrative est nécessaire.

## Installation et mises à jour

La recherche consulte Modrinth et est mise en cache pendant deux minutes. L’aperçu choisit la dernière version stable déclarée compatible et inclut les dépendances requises. Les installations sont manuelles, serveur arrêté, avec les permissions de lecture/création/modification de fichiers de Pterodactyl. Le catalogue ne démarre ni n’arrête un serveur.

Les téléchargements sont limités au CDN HTTPS de Modrinth, sans redirection, avec vérification de taille et d’empreinte SHA-512. Les anciens JAR gérés sont conservés dans un dossier `/vinus-*`. Un fichier inconnu ou modifié manuellement n’est pas écrasé. Un échec de déplacement entraîne la restauration des changements déjà terminés ; si Wings devient indisponible pendant cette restauration, l’interface indique le dossier à vérifier avant de redémarrer.

Le suivi concerne les fichiers installés par ce catalogue, dans `storage/app/vinuscatalog` du panel. L’onglet « Installés avec ce catalogue » permet de vérifier et appliquer une mise à jour compatible. Les JAR ajoutés auparavant avec le gestionnaire de fichiers ne sont pas automatiquement importés dans ce suivi.

## Limites explicites

- Le catalogue couvre **Modrinth**, pas tous les mods/plugins existants. Les projets exclusifs à d’autres plateformes, privés ou payants restent hors catalogue.
- CurseForge demanderait une intégration séparée, une clé API et le respect des restrictions de distribution des auteurs. Les plateformes ne permettent pas de garantir un accès universel.
- L’installation automatique accepte un JAR principal de 25 Mio au maximum, jusqu’à 20 projets et 100 Mio par lot, et 12 niveaux de dépendances. Les fichiers plus grands ou les formats ambigus nécessitent une installation manuelle.
- Les déclarations de compatibilité des auteurs ne garantissent pas qu’un ensemble de mods/plugins fonctionne sans conflit. C’est particulièrement vrai sur les logiciels hybrides. Les dépendances optionnelles et les conflits avec les JAR installés hors catalogue ne sont pas résolus automatiquement.
- Les mises à jour de Pterodactyl, Blueprint ou de l’API Modrinth doivent être validées avant de modifier les versions supportées. Les demandes d’installation passent par le serveur du panel, qui doit pouvoir joindre Modrinth et Wings.

## Vérification

Les aperçus sont liés au compte et au serveur, revalidés sous verrou et consommés avant les téléchargements. Un échec exige un nouvel aperçu. Les erreurs inattendues sont enregistrées côté panel avec une référence, sans exposer leur détail interne dans la réponse. Les icônes utilisent uniquement les images matricielles HTTPS du CDN Modrinth, sans référent ; une initiale remplace les images absentes ou refusées. Les empreintes des JAR vérifient leur intégrité, pas l’absence de code malveillant dans une extension.

`php tests/run.php /chemin/du/panel` vérifie la détection et les fichiers acceptés/refusés.

`php tests/install.php /chemin/du/panel` vérifie les permissions, le refus sur serveur en marche, les collisions, l’installation, l’expiration du jeton et la restauration après erreur. Ce test utilise uniquement l’autoload Composer ; son cache, son serveur Wings et ses téléchargements sont simulés en mémoire, sans connexion à la base ou aux serveurs de jeu. Son dossier temporaire est supprimé à la fin d’un test réussi.
