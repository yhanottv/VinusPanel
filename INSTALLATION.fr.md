# Installer et personnaliser VinusPanel 3.2.0 sur un VPS

Ce guide s'adresse à l'administrateur d'un panel Pterodactyl **déjà installé**. Le téléchargement contient le code source du thème, l'installeur, un désinstalleur et la documentation. Il ne contient ni Pterodactyl, ni Wings, ni les données de vos serveurs.

## 1. Compatibilité

| Élément | Version validée |
| --- | --- |
| Pterodactyl Panel | 1.15.1 |
| Ubuntu | 24.04 |
| PHP | 8.3 |
| Node.js | 22 ou plus |
| Yarn | 1.x |
| Composer | Installé sur le VPS pour régénérer l'autoload PHP. |
| Blueprint | Optionnel ; intégration vérifiée avec `beta-2026-06` |

Il faut un accès SSH avec `sudo`, un panel qui fonctionne déjà, et suffisamment d'espace pour le code source, les dépendances Node et les sauvegardes. Si vous utilisez Blueprint, installez-le **avant** VinusPanel. Ne mélangez pas ce thème avec une autre surcouche qui remplace les mêmes fichiers sans examiner les conflits.

## 2. Sauvegarder le panel

L'installeur sauvegarde chaque fichier qu'il remplace, puis restaure automatiquement en cas d'échec de l'installation. Gardez aussi votre propre sauvegarde du panel, de la base de données et de `storage` avant une mise à jour importante. Les images téléversées dans le menu Design sont conservées sous `public/assets/vinus/custom` et les réglages sous `storage/app/vinuspanel/design.json` ; incluez ces deux chemins dans vos sauvegardes régulières.

Par défaut, le panel doit se trouver dans `/var/www/pterodactyl`. Pour un autre emplacement, utilisez `--panel-dir /chemin/absolu` dans chaque commande.

## 3. Récupérer le code source

Connectez-vous au VPS, puis exécutez :

```bash
cd /tmp
git clone https://github.com/yhanottv/VinusPanel.git vinuspanel
cd vinuspanel
git checkout v3.2.0
```

Si vous avez téléchargé le ZIP gratuit sur BuiltByBit, décompressez-le sur le VPS et placez-vous dans le dossier contenant `install.sh`. Le contenu est identique à la version GitHub correspondante.

Si une ancienne copie du dépôt existe déjà, utilisez `git fetch origin`, `git checkout v3.2.0` dans cette copie. Conservez vos propres changements dans une branche ou une sauvegarde avant de changer de version.

## 4. Vérifier puis installer

```bash
sudo bash install.sh --check
sudo bash install.sh
```

`--check` examine la version du panel, Node, Yarn, PHP et la structure du paquet sans modifier Pterodactyl. L'installation active temporairement le mode maintenance, copie les fichiers, compile les assets et vide les caches. Attendez le message final « VinusPanel 3.2.0 est installé » avant de rouvrir le panel. L'installeur affiche le chemin de la sauvegarde de cette opération ; notez-le.

Si vous utilisez le catalogue de mods, mettez aussi à jour **Vinus Catalog 1.3.0** avec les instructions de [`extensions/vinuscatalog/README.md`](extensions/vinuscatalog/README.md). L’installeur du thème ne met pas à jour cette extension Blueprint. La version 1.3.0 ajoute les catalogues pris en charge et les outils logiciels, modpacks, mondes et BlueMap.

Pour un panel situé ailleurs :

```bash
sudo bash install.sh --panel-dir /chemin/absolu --check
sudo bash install.sh --panel-dir /chemin/absolu
```

L'installeur est conçu pour être relancé pour une mise à jour. Il conserve les réglages et images Design. Après chaque mise à jour de Pterodactyl ou de Blueprint, revérifiez la compatibilité et réinstallez la surcouche seulement avec une version compatible.

## 5. Configurer le menu Design

Connectez-vous à Pterodactyl avec un **compte administrateur**. Ouvrez **Design** dans la barre latérale de l'interface client. La page apparaît hors de l'administration classique et affiche un aperçu qui réagit pendant l'édition.

Dans **Panel**, vous pouvez définir le nom du panel, la couleur d'accent, la couleur du fond, la couleur des surfaces, la couleur par défaut des cartes de serveurs, la couleur du texte, le logo et une image de fond. Cliquez sur le carré de couleur ou saisissez une valeur hexadécimale. Les images acceptées sont PNG, JPEG et WebP ; 4 Mo maximum pour le logo, 8 Mo pour le fond. Les miniatures montrent immédiatement l'image choisie ; le bouton de suppression rétablit le logo initial ou retire l'image de fond.

Dans **Serveurs**, choisissez un serveur puis définissez sa couleur et téléversez une bannière. La couleur apparaît sur sa carte et son en-tête. La bannière apparaît sur la carte, dans la navigation du serveur et dans son en-tête. Pour que le texte reste lisible, VinusPanel ajoute automatiquement un voile sombre sur la bannière. Un format d'environ 3:1 est recommandé, avec 8 Mo maximum. Vous pouvez retirer une bannière depuis le même écran.

L'aperçu réagit avant l'enregistrement. Cliquez sur **Enregistrer** pour appliquer les changements, ou sur **Annuler** pour les abandonner. La page avertit avant de quitter avec des modifications non enregistrées. Ces réglages sont globaux pour tous les visiteurs du panel ; seul l'administrateur peut les modifier. Les couleurs et bannières de chaque serveur ne sont envoyées qu'aux utilisateurs qui ont accès à ce serveur.

Le menu couvre les principaux réglages visuels demandés. Puisque le projet est open source, les composants React et les styles restent modifiables dans `overlay/resources/scripts` pour des changements plus avancés ; une modification du code nécessite de relancer `sudo bash install.sh` pour recompiler les assets.

## 6. Vérifier l'installation

1. Ouvrez la page de connexion : le logo et le nom doivent correspondre à vos choix.
2. Connectez-vous : vérifiez le fond, les couleurs, les cartes de serveurs et la navigation.
3. Ouvrez un serveur : vérifiez sa couleur et sa bannière.
4. Connectez-vous avec un compte non administrateur ayant accès à ce serveur : il doit voir le résultat sans pouvoir accéder à **Design**.

En cas de page inchangée, faites un rechargement forcé du navigateur et vérifiez que l'installation s'est terminée sans erreur. Les fichiers statiques du panel peuvent être mis en cache par un proxy ou un CDN ; invalidez ce cache si nécessaire.

## 7. Retour arrière et désinstallation

Pour retirer VinusPanel et retrouver les fichiers présents lors de la première installation :

```bash
cd /tmp/vinuspanel
sudo bash uninstall.sh
```

Le désinstalleur utilise la sauvegarde d'origine conservée dans `/var/lib/vinuspanel/original`. Il recompile les assets d'origine et archive l'état VinusPanel. Les réglages Design et les images téléversées ne sont pas supprimés automatiquement, afin de permettre une réinstallation. Sauvegardez-les séparément si vous souhaitez les conserver lors d'une migration de VPS.

Si une installation échoue avant la fin, l'installeur tente automatiquement de restaurer les fichiers de la transaction. Consultez aussi le journal Laravel `storage/logs/laravel.log` et la sortie de `yarn build:production` pour diagnostiquer l'erreur.

## 8. Structure du paquet

| Chemin | Rôle |
| --- | --- |
| `overlay/` | Fichiers appliqués au panel Pterodactyl. |
| `overlay-manifest.txt` | Liste exacte des fichiers sauvegardés et copiés. |
| `install.sh` | Contrôle, sauvegarde, installation et compilation. |
| `uninstall.sh` | Restauration des fichiers d'origine. |
| `extensions/vinuscatalog/` | Catalogue Minecraft optionnel pour Blueprint. |
| `theme.json` | Version et compatibilité du thème. |

Code source : [github.com/yhanottv/VinusPanel](https://github.com/yhanottv/VinusPanel). Licence : MIT. Le thème ne modifie ni Wings, ni les conteneurs, ni les fichiers des serveurs de jeu.
