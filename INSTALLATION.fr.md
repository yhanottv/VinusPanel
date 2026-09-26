# Installer et personnaliser VinusPanel sur un VPS

Ce guide résume l'installation. **La référence complète, tenue à jour, est la [documentation GitBook](https://vinuspanel.gitbook.io/vinuspanel-docs/)** (sources : [`docs/gitbook/`](docs/gitbook/README.md)), en particulier le chapitre « Installer VinusPanel de A à Z » et le chapitre « Sécuriser et exploiter la production ».

Sur un **VPS vierge**, `install.sh` installe tout : Pterodactyl Panel 1.15.1, MariaDB, Redis, Nginx, le worker, le thème, Docker et Wings, plus le garde-fou `vinus-guard`. Sur un panel déjà installé, il applique seulement le thème. Le dépôt ne contient ni Pterodactyl ni vos données : l'installeur télécharge Pterodactyl.

## 1. Compatibilité

| Élément | Version validée |
| --- | --- |
| Pterodactyl Panel | 1.15.1 (installé par le script sur VPS vierge) |
| Ubuntu | 24.04 LTS |
| PHP | 8.3 |
| Node.js / Yarn | 22 ou plus / 1.x |
| Machine testée | 2 vCPU, 8 Go de RAM (moins de 4 Go non validé) |
| Blueprint | Optionnel ; `beta-2026-06` pour Vinus Catalog 1.4.1 |

Il faut un accès SSH en `root` ou avec `sudo`. Si l'hébergeur fournit une image avec Traefik sur les ports 80/443, l'installeur l'arrête et désactive son redémarrage (option `--keep-proxy` pour refuser) : préférer une image Ubuntu nue.

## 2. Récupérer le code

```bash
apt update && apt install -y git curl
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
```

Si vous avez téléchargé le ZIP publié (BuiltByBit), décompressez-le et placez-vous dans le dossier contenant `install.sh` ; préférer `main` pour retrouver toutes les fonctions décrites dans la documentation.

## 3. Vérifier puis installer

```bash
sudo bash install.sh --check      # rapport, aucune modification
sudo bash install.sh --install    # ou sans option : menu, choix [1]
```

Avec un domaine (DNS `A` déjà orienté vers le VPS) : `sudo bash install.sh --install --url https://panel.exemple.fr --admin-email vous@exemple.fr`. L'opération est entièrement automatique (environ 7 minutes sur 2 vCPU / 8 Go). En cas d'échec pendant la phase « panel », relancer la même commande : elle reprend. En cas d'échec pendant la phase « thème », les fichiers d'origine sont restaurés automatiquement.

Les mots de passe générés sont affichés à la fin et enregistrés dans `/var/lib/vinuspanel/credentials.txt` (chmod 600). Changer le mot de passe administrateur à la première connexion.

Pour un panel situé ailleurs que `/var/www/pterodactyl` : `--panel-dir /chemin/absolu`. L'installeur est relançable pour une mise à jour (`sudo bash install.sh --update`) ; il conserve les réglages et images Design.

## 4. Blueprint et catalogue Minecraft (automatiques)

Sur un VPS vierge, `install.sh` installe aussi **Blueprint `beta-2026-06`** puis **Vinus Catalog** : panel → Blueprint → thème (une seule application avec les variantes Blueprint) → catalogue. Options : `--no-blueprint` (ne rien installer), `--blueprint` (sur un panel existant), `--catalog` (catalogue seul, installation ou mise à jour). Le catalogue n'est pas bloquant. Commandes manuelles de dépannage : chapitre 3 de la documentation et [`extensions/vinuscatalog/README.md`](extensions/vinuscatalog/README.md). Avant d'ouvrir le panel au public : domaine et HTTPS, pare-feu, SSH par clé, e-mails et sauvegardes (chapitre 12).

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
cd ~/VinusPanel
sudo bash uninstall.sh
```

Le désinstalleur utilise la sauvegarde d'origine conservée dans `/var/lib/vinuspanel/original`. Il recompile les assets d'origine, retire le service `vinus-guard` et archive l'état VinusPanel. Les réglages Design et les images téléversées ne sont pas supprimés automatiquement, afin de permettre une réinstallation. Sauvegardez-les séparément si vous souhaitez les conserver lors d'une migration de VPS.

Si une installation échoue avant la fin, l'installeur tente automatiquement de restaurer les fichiers de la transaction. Consultez aussi le journal Laravel `storage/logs/laravel.log` et la sortie de `yarn build:production` pour diagnostiquer l'erreur.

## 8. Structure du paquet

| Chemin | Rôle |
| --- | --- |
| `overlay/` | Fichiers appliqués au panel Pterodactyl. |
| `overlay-manifest.txt` | Liste exacte des fichiers sauvegardés et copiés. |
| `install.sh` | Installation complète d'un VPS vierge, ou du thème seul ; sauvegarde et compilation. |
| `uninstall.sh` | Restauration des fichiers d'origine. |
| `extensions/vinuscatalog/` | Catalogue Minecraft optionnel pour Blueprint. |
| `theme.json` | Version et compatibilité du thème. |

Code source : [github.com/yhanottv/VinusPanel](https://github.com/yhanottv/VinusPanel). Licence : MIT. Le thème ne modifie ni Wings, ni les conteneurs, ni les fichiers des serveurs de jeu.
