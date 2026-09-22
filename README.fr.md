<div align="center">

<img src="docs/assets/banner.png" alt="Bannière VinusPanel — aigle orange sur fond noir et orange" width="100%" />

<br />

<img src="overlay/public/assets/images/vinus/eagle.png" alt="Logo VinusPanel — aigle orange" width="88" />

# VinusPanel

**Français** · [English](README.md)

**Un thème open source pour Pterodactyl : interface noire, navigation Liquid Glass et console repensée.**

[![Validation du paquet](https://github.com/yhanottv/VinusPanel/actions/workflows/validate.yml/badge.svg)](https://github.com/yhanottv/VinusPanel/actions/workflows/validate.yml)
[![Version des sources](https://img.shields.io/badge/sources-2.3.6-ff7a1a)](CHANGELOG.md)
[![Pterodactyl](https://img.shields.io/badge/Pterodactyl-1.15.1-242429)](#compatibilité-du-panel)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-242429)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Rejoindre-5865F2?logo=discord&logoColor=white)](https://discord.gg/vinuspanel)

[Installation](#installation) · [Appareils](#appareils-et-navigateurs) · [Catalogue](#catalogue-minecraft-optionnel) · [Support](#aide-et-signalement-de-bugs)

</div>

VinusPanel retravaille le tableau de bord, la navigation, la console et les principaux écrans de gestion de Pterodactyl. Il conserve les actions et les permissions du panel, avec une identité noire et orange et des libellés principalement en français.

Le dépôt contient une **surcouche de fichiers et ses outils d’installation**, pas une distribution complète de Pterodactyl. Un panel fonctionnel doit déjà être installé. Le thème peut servir à gérer d’autres jeux ; seul le catalogue optionnel de mods et plugins est réservé à Minecraft.

## ✨ Ce qui a changé

La version **2.3.6** réunit les évolutions suivantes. Le [changelog](CHANGELOG.md) conserve le détail par version, y compris les anciens designs remplacés depuis.

| Espace | Fonctionnement actuel |
| --- | --- |
| Interface | Fonds noirs, surfaces de lecture sobres, boutons compacts et accents orange. |
| Navigation | Effet **Liquid Glass limité à la navigation** : transparence sombre, flou et reflets discrets. |
| Tableau de bord | Liste des serveurs, états en direct, recherche et choix entre grille et liste. |
| Console | Terminal avec commandes, journaux en direct et commandes d’alimentation regroupées dans un espace dédié. |
| Ressources | **Processeur, mémoire et réseau directement en haut**, sans menu à dérouler ni répétition des mêmes mesures dans le bloc de pilotage. |
| Graphiques | Séries conservées pendant les mises à jour, transitions progressives, unités compactes et distinction du trafic entrant/sortant. |
| Signature | Aigle orange détaillé, centré et adapté aux dimensions du terminal. |
| Catalogue | Recherche Modrinth, icônes des projets, catégories selon le logiciel serveur, aperçu d’installation et suivi des mises à jour. |
| Erreurs | Messages plus explicites pour les problèmes de connexion, de session et de permissions ; références de diagnostic pour le catalogue. |
| Communauté | Bouton avec le logo Discord et annonce d’aide en haut des pages client. |

### Console et pilotage

Les boutons de démarrage, redémarrage et arrêt tiennent compte de l’état du serveur, de la connexion et des permissions de l’utilisateur. L’arrêt forcé conserve sa confirmation. La console affiche l’état de sa connexion et propose une reconnexion en cas d’interruption.

Les trois graphiques restent visibles au-dessus du terminal. Les mises à jour de télémétrie ne recréent plus les séries à chaque seconde. Les débits réseau sont calculés à partir du temps réellement écoulé entre les mesures. Le stockage et la durée de session restent dans un bloc séparé.

La signature souvent appelée « ASCII » utilise des **caractères Unicode** pour restituer plus finement le logo. Elle apparaît dans le terminal, après le premier état connu du serveur à l’ouverture de la page, puis lors d’une transition vers le démarrage. Elle reste dans l’historique normal : aucun effacement après 1,8 seconde. Les nouveaux journaux peuvent naturellement la faire défiler hors de la zone visible.

Cette signature est uniquement visuelle : elle n’est jamais envoyée comme commande ni ajoutée aux fichiers de logs du serveur. L’historique des commandes saisies reste en mémoire pendant l’ouverture de la console ; il n’est pas conservé dans le stockage persistant du navigateur.

### Autres écrans retravaillés

- Connexion, récupération de compte et espaces de gestion du compte.
- Gestionnaire de fichiers, bases de données, accès utilisateurs et sauvegardes.
- Planifications, réseau, paramètres de démarrage et paramètres du serveur.
- Journaux d’activité du compte et des serveurs, avec une lecture plus claire des événements.
- Profil avec nom d’affichage et avatar locaux au navigateur.
- Apparence de l’administration historique, via une feuille de style dédiée.

Les personnalisations du profil ne changent ni l’identité de connexion, ni les permissions, ni les données du compte dans Pterodactyl. Elles ne se synchronisent pas entre appareils.

<a id="appareils-et-navigateurs"></a>

## 📱 Appareils et navigateurs

VinusPanel s’utilise dans un navigateur ; aucune application native n’est fournie. La mise en page s’adapte à la **largeur disponible**, pas au modèle de l’appareil.

| Appareil | Adaptation de l’interface | État de validation |
| --- | --- | --- |
| Ordinateur de bureau ou portable | Navigation latérale à partir de 1 024 px, espace de console élargi et blocs répartis en colonnes. | Rendu contrôlé dans un navigateur Chromium intégré, notamment à 1 440 px. |
| Tablette ou fenêtre intermédiaire | Navigation horizontale sous 1 024 px, contenu réorganisé selon l’espace. | Rendu intermédiaire contrôlé à 742 px ; pas de certification sur chaque tablette physique. |
| Smartphone | Cartes empilées sur les petites largeurs, terminal redimensionné et navigation horizontale défilable. | Aperçu responsive contrôlé à 390 px ; tests sur appareils iOS/Android physiques encore à compléter. |

**Navigateurs visés :** versions récentes de Chrome, Edge, Firefox et Safari, sur Windows, macOS, Linux, Android et iOS. La validation réalisée ne constitue pas une matrice de tests complète de tous ces navigateurs et systèmes. Les navigateurs anciens, Internet Explorer et les WebViews embarquées particulières ne sont pas validés.

Le rendu du flou dépend du navigateur et de ses capacités graphiques. La navigation conserve un fond sombre lorsque le flou n’est pas disponible ; un fond opaque est prévu quand la préférence de transparence réduite est prise en charge. JavaScript et la connexion WebSocket à Wings sont nécessaires au fonctionnement de la console en direct.

### Accessibilité

La navigation inclut des indications de focus, un lien d’accès direct au contenu, une recherche utilisable au clavier et des libellés accessibles pour les boutons à icône. Les préférences de réduction des animations et de la transparence sont prises en compte. Ces adaptations ne constituent pas une certification WCAG ni un audit complet avec lecteurs d’écran.

<a id="compatibilité-du-panel"></a>

## 🧩 Compatibilité du panel

| Composant | Version ou condition |
| --- | --- |
| VinusPanel | Sources **2.3.6**. |
| Pterodactyl Panel | **1.15.1**, version validée pour cette surcouche. |
| Blueprint | Optionnel pour le thème ; intégration validée pour **beta-2026-06** uniquement. Requis pour Vinus Catalog. |
| Vinus Catalog | Extension **1.1.0**, incluse dans ce dépôt. |
| Node.js | L’installateur exige **22 minimum** ; compilation validée avec Node 22. Les versions majeures suivantes ne sont pas automatiquement certifiées. |
| Yarn | **1.x** pour la chaîne de compilation utilisée. |
| PHP | Environnement validé avec **8.3** ; conserver les prérequis PHP du panel et de Blueprint. |
| Serveur hôte | Déploiement validé sur Ubuntu 24.04. Scripts Bash prévus pour un environnement Linux de type Ubuntu/Debian avec l’utilisateur web `www-data`. |
| Wings | Instance déjà fonctionnelle et joignable par le panel ; aucune modification de Wings fournie par le thème. |

Les autres versions de Pterodactyl, les forks et les combinaisons avec d’autres thèmes ne sont pas validés. L’installateur refuse une version différente lorsqu’il peut lire celle du panel, ainsi qu’une version Blueprint installée différente de celle attendue. Le contrôle préalable n’est pas une preuve de compatibilité de toutes les extensions tierces.

<a id="installation"></a>

## 🚀 Installation

Prévoir un accès SSH à la machine qui héberge **le panel**, les droits `sudo`, ses sources frontend et ses dépendances. Installer VinusPanel sur le panel, pas uniquement sur un nœud Wings distant.

Sauvegarder le panel, sa base de données et sa configuration avant installation. L’opération compile les fichiers frontend et place temporairement le panel en maintenance. L’installateur du thème ne lance aucune commande d’arrêt ou de redémarrage des serveurs de jeu.

### 1. Récupérer les sources

```bash
git clone --depth 1 https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
```

### 2. Vérifier l’environnement

```bash
bash install.sh --check
```

Le contrôle vérifie les fichiers du paquet et les prérequis détectables sans modifier le panel. Le chemin par défaut est `/var/www/pterodactyl`.

### 3. Installer

```bash
sudo bash install.sh
```

Pour un emplacement personnalisé, utiliser le même chemin au contrôle et à l’installation :

```bash
bash install.sh --panel-dir /chemin/du/panel --check
sudo bash install.sh --panel-dir /chemin/du/panel
```

**Avec Blueprint :** installer d’abord Blueprint, puis VinusPanel. L’installateur détecte sa présence et sélectionne les variantes qui conservent ses points d’extension. Il n’installe pas automatiquement Vinus Catalog.

### Ce que fait l’installateur

1. Contrôle le paquet, les commandes requises et les versions détectables.
2. Sauvegarde les fichiers concernés, puis active la maintenance du panel.
3. Copie les **75 fichiers de la surcouche de base**, avec les variantes et fichiers supplémentaires nécessaires si Blueprint est détecté.
4. Installe les dépendances frontend si elles sont absentes, puis ajoute la police IBM Plex Sans et l’environnement de test requis.
5. Compile les assets, nettoie les caches Laravel et rétablit les propriétaires attendus.
6. Enregistre la version installée et désactive la maintenance.

En cas d’échec, le script tente de restaurer les fichiers sauvegardés, de recompiler et de sortir du mode maintenance. Les sauvegardes de fichiers ne couvrent pas toute la machine ni toutes les modifications des dépendances : elles ne remplacent pas une sauvegarde complète.

<a id="catalogue-minecraft-optionnel"></a>

## 📦 Catalogue Minecraft optionnel

**Blueprint est le framework d’extensions ; Modrinth fournit le catalogue.** Vinus Catalog fonctionne indépendamment du thème. VinusPanel lui ajoute une entrée dans la navigation lorsqu’il est installé.

### Catégories selon le serveur

| Logiciel détecté | Catégories proposées |
| --- | --- |
| Forge, NeoForge, Fabric, Quilt | **Mods** filtrés pour le chargeur correspondant. |
| Paper, Purpur, Spigot, Bukkit, Folia, Sponge | **Plugins** uniquement, filtrés pour le profil détecté. |
| Velocity, Bungeecord, Waterfall | **Plugins** compatibles avec le proxy. |
| Youer, Mohist | Deux onglets séparés : **Mods** et **Plugins**. |
| Arclight | Deux onglets après identification du chargeur Forge, Fabric ou NeoForge. |
| Vanilla ou logiciel inconnu | Aucun téléchargement automatique proposé. |

La recherche affiche les icônes disponibles, avec un remplacement par une initiale si nécessaire. L’aperçu sélectionne une version stable déclarée compatible et inclut ses dépendances requises. L’installation se fait **serveur arrêté**, avec les permissions Pterodactyl nécessaires sur les fichiers ; le catalogue n’arrête pas le serveur à votre place.

Les éléments installés par le catalogue sont suivis dans l’onglet **« Installés avec ce catalogue »**, qui permet de rechercher et d’appliquer leurs mises à jour compatibles. Les mises à jour ne sont pas appliquées automatiquement et les JAR déjà présents ne sont pas importés automatiquement dans ce suivi.

### Installer l’extension

Après installation de la version Blueprint compatible, puis du thème, créer le paquet depuis la racine de ce dépôt (`zip` doit être disponible) :

```bash
cd extensions/vinuscatalog
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Adapter le chemin si le panel est installé ailleurs. La [documentation de Vinus Catalog](extensions/vinuscatalog/README.md) détaille l’installation, la configuration et les limites.

### Fonctionnement chez d’autres hébergeurs

La détection ne dépend d’aucun numéro d’egg propre à une installation. Elle utilise le logiciel déclaré, le nom du JAR puis le nom de l’egg. La version Minecraft provient des variables de l’egg ; si elle manque ou vaut `latest`, l’utilisateur doit sélectionner la version réellement installée.

Les eggs personnalisés ou renommés peuvent nécessiter une correspondance administrative par **UUID d’egg ou de serveur**. Le [fichier d’exemple](extensions/vinuscatalog/config/vinuscatalog.php.example) est volontairement vide ; ces correspondances locales ne doivent pas être publiées. Le panel doit pouvoir contacter Modrinth et Wings.

### Limites du catalogue

- **Modrinth uniquement** : les projets exclusifs à d’autres plateformes, privés ou payants ne sont pas couverts. Il ne s’agit pas d’un accès à tous les mods et plugins existants.
- Un JAR principal de **25 Mio maximum**, jusqu’à **20 projets et 100 Mio par lot**, avec au maximum **12 niveaux de dépendances**.
- Les dépendances optionnelles et les conflits avec des JAR installés hors catalogue ne sont pas résolus automatiquement.
- Le filtrage utilise les compatibilités déclarées par les auteurs ; il ne garantit pas l’absence de conflits, notamment sur les serveurs hybrides.
- Les anciennes versions gérées sont conservées dans des dossiers `/vinus-*`. Un fichier inconnu ou modifié manuellement n’est pas écrasé.

## 🎨 Personnalisation

Les réglages de marque se trouvent dans [`overlay/resources/scripts/theme.ts`](overlay/resources/scripts/theme.ts). Le fichier devient `resources/scripts/theme.ts` dans le panel installé.

| Réglage | Rôle |
| --- | --- |
| `VINUS.name` | Nom utilisé par les composants qui consomment ce réglage. |
| `VINUS.logo` | Chemin du logo graphique ; ne régénère pas la signature Unicode du terminal. |
| `VINUS.colors` | Couleurs des composants qui utilisent ces variables ; certains styles restent définis dans leurs propres fichiers. |
| `VINUS.discordInvite` | Invitation partagée par le logo Discord et le bandeau d’aide. |

L’invitation par défaut est **https://discord.gg/vinuspanel**. Pour votre propre communauté, utiliser une URL HTTPS `discord.gg/...` ou `discord.com/invite/...`. Une valeur vide masque l’annonce et désactive le bouton. Le texte du bandeau se trouve dans [`DiscordButton.tsx`](overlay/resources/scripts/components/elements/DiscordButton.tsx).

Les réglages frontend nécessitent une recompilation. Pour une installation gérée par ce dépôt, modifier les sources de la surcouche puis relancer l’installateur. Conserver vos personnalisations dans une branche ou un fork : une réinstallation recopie les fichiers et peut remplacer les modifications faites directement dans le panel.

## 🔄 Mise à jour et désinstallation

### Mettre à jour le thème

Depuis votre clone, après sauvegarde et lecture du changelog :

```bash
git pull --ff-only
bash install.sh --check
sudo bash install.sh
```

Ajouter `--panel-dir /chemin/du/panel` si nécessaire. Si Git signale des modifications locales, les conserver et résoudre le conflit avant de poursuivre. La version des sources sur `main` peut être plus récente qu’une archive publiée dans [Releases](https://github.com/yhanottv/VinusPanel/releases).

Une mise à jour de Pterodactyl ou de Blueprint peut remplacer des fichiers du thème. Vérifier la compatibilité avant de réappliquer VinusPanel. L’extension Vinus Catalog se met à jour séparément avec son paquet Blueprint.

### Retirer le thème

```bash
sudo bash uninstall.sh
# Ou pour un autre emplacement :
sudo bash uninstall.sh --panel-dir /chemin/du/panel
```

Le script restaure les fichiers sauvegardés avant leur prise en charge par le thème, retire les fichiers introduits par celui-ci, recompile les assets et nettoie les caches. Il ne désinstalle pas automatiquement Blueprint ou Vinus Catalog. Après une mise à jour du panel, vérifier que la sauvegarde d’origine correspond encore à la version à restaurer.

### Emplacement des sauvegardes

| Chemin | Contenu |
| --- | --- |
| `/var/lib/vinuspanel/original` | Fichiers d’origine suivis par le thème. |
| `/var/backups/vinuspanel/install-*` | Sauvegardes par transaction d’installation. |
| `/var/lib/vinuspanel/last-transaction` | Chemin de la dernière transaction. |
| `/var/backups/vinuspanel/uninstalled-*` | État du thème archivé après désinstallation. |

## 🛡️ Permissions, sécurité et diagnostics

VinusPanel conserve les contrôles de permissions de Pterodactyl. Le catalogue vérifie les autorisations, l’état arrêté du serveur et l’aperçu d’installation avant d’écrire des fichiers. Ses jetons d’aperçu sont liés au compte et au serveur, revalidés sous verrou puis consommés avant les téléchargements.

Les téléchargements du catalogue sont limités au CDN HTTPS de Modrinth, sans redirection, avec limites de taille et vérification SHA-512. Les erreurs inattendues du catalogue sont journalisées côté panel et renvoyées avec une référence de diagnostic. Les messages d’erreur serveur présentés à l’utilisateur évitent d’exposer les traces internes.

Ces protections ne remplacent pas la maintenance de Pterodactyl et de Wings ni l’évaluation des extensions installées. Une empreinte valide confirme l’intégrité d’un téléchargement, pas l’innocuité du code qu’il contient. Aucun audit de sécurité exhaustif ni garantie d’absence de vulnérabilité n’est annoncé.

<a id="aide-et-signalement-de-bugs"></a>

## 💬 Aide et signalement de bugs

Rejoindre **[le Discord VinusPanel](https://discord.gg/vinuspanel)** ou ouvrir une [issue GitHub](https://github.com/yhanottv/VinusPanel/issues).

| Symptôme | Vérification utile |
| --- | --- |
| Ancien design encore visible | Vérifier la réussite de la compilation et la version installée, puis recharger la page sans cache. |
| Console déconnectée ou ressources indisponibles | Vérifier la liaison WebSocket, Wings et le proxy HTTPS ; relever le message affiché. |
| Session expirée ou accès refusé | Se reconnecter ou vérifier les permissions du compte et du serveur. |
| Catalogue absent | Vérifier que Blueprint et Vinus Catalog sont installés, puis les permissions de l’utilisateur. |
| Mauvaise catégorie ou aucun résultat | Vérifier le logiciel/JAR déclaré, la version Minecraft et les éventuelles correspondances d’eggs personnalisés. |
| Installation du catalogue refusée | Vérifier l’arrêt du serveur, les permissions, les tailles autorisées et le message de conflit de fichier. |
| Échec d’installation du thème | Conserver la sortie de commande et le chemin de sauvegarde indiqué ; vérifier l’état du panel après la tentative de restauration. |

Pour un signalement exploitable, indiquer les versions de VinusPanel, Pterodactyl et Blueprint, le navigateur, l’appareil, la largeur d’écran approximative, les étapes de reproduction et le résultat attendu. Ajouter l’heure et la référence d’erreur lorsqu’elle est disponible. Masquer les jetons, mots de passe, données personnelles et fichiers de configuration privés dans les captures et les logs.

## 🧪 Validation et contribution

**L’installation complète sur une instance Pterodactyl vierge et séparée reste à valider.** Les compilations préparées à part et les tests du catalogue avec Wings simulé ne remplacent pas ce scénario. La prochaine étape recommandée est de tester installation, mise à jour, désinstallation et restauration dans un environnement jetable, sans Blueprint puis avec sa version compatible.

Pour la publication **2.3.6**, les contrôles suivants ont été exécutés dans l’environnement de panel utilisé pour le développement :

- Vérification TypeScript et compilation frontend de production.
- **85 tests frontend** dans 8 suites.
- **52 vérifications** de détection et d’artefacts du catalogue.
- **21 vérifications isolées** d’installation du catalogue, sans base de données ni serveur de jeu réel.
- Syntaxe PHP et shell, correspondance du manifeste et contrôle des identifiants privés avant publication.

Le [workflow GitHub Actions](.github/workflows/validate.yml) vérifie la syntaxe shell, le manifeste, la syntaxe PHP du catalogue et certains motifs de secrets accidentels. **Il ne lance pas toute la compilation du panel ni les 85 tests frontend.** Les contrôles visuels responsive sont décrits dans la section appareils ; ils ne remplacent pas une validation exhaustive sur appareils physiques.

Pour vérifier le paquet depuis ce dépôt :

```bash
bash -n install.sh uninstall.sh scripts/check-package.sh
bash scripts/check-package.sh
```

Pour les tests du catalogue, utiliser l’autoload Composer d’un panel compatible :

```bash
php extensions/vinuscatalog/tests/run.php /chemin/du/panel
php extensions/vinuscatalog/tests/install.php /chemin/du/panel
```

Les tests frontend et la compilation demandent les sources et les dépendances de Pterodactyl avec la surcouche appliquée. Utiliser un environnement de développement ou de test pour contribuer. Les contributions via pull request sont bienvenues ; préciser les versions testées et joindre une capture pour les changements visuels.

## 🗂️ Structure du dépôt

```text
VinusPanel/
├── overlay/                  # Surcouche principale du thème
├── blueprint-overlay/        # Variantes et intégration Blueprint
├── extensions/vinuscatalog/  # Catalogue Minecraft optionnel et tests
├── scripts/check-package.sh # Validation du paquet
├── licenses/                 # Licences tierces conservées
├── install.sh                # Installation, sauvegarde et restauration
├── uninstall.sh              # Restauration des fichiers d’origine
├── overlay-manifest.txt      # Liste des fichiers de la surcouche de base
├── theme.json                # Version et métadonnées
└── CHANGELOG.md               # Historique des évolutions
```

## 📄 Licence et crédits

VinusPanel est distribué sous [licence MIT](LICENSE). Les licences des fichiers dérivés de Pterodactyl et de Blueprint sont conservées dans [`licenses/`](licenses/).

[Pterodactyl](https://github.com/pterodactyl/panel), [Blueprint](https://blueprint.zip/) et [Modrinth](https://modrinth.com/) sont des projets tiers distincts. VinusPanel n’est pas une version officielle de ces projets.
