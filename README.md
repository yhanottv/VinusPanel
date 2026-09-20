# VinusPanel

Thème sombre orange pour **Pterodactyl Panel 1.15.1**, conçu pour rester lisible et confortable sur ordinateur comme sur mobile.

VinusPanel contient uniquement la surcouche du thème et ses outils d'installation. Le code complet de Pterodactyl n'est pas redistribué.

## Aperçu

- identité VinusPanel et aigle orange ;
- page de connexion immersive, responsive et accessible ;
- tableau de bord avec synthèse d'état et cartes serveur en temps réel ;
- espace serveur unifié avec en-tête contextuel, actions rapides et navigation latérale ;
- console, métriques, graphiques, réseau et réglages harmonisés ;
- suppression des visuels et textes Minecraft codés en dur ;
- installation réversible avec sauvegarde automatique.

## Installation rapide

Pré-requis : une installation fonctionnelle de Pterodactyl **1.15.1**, `git`, PHP, Node.js et Yarn. Par défaut, le panel est attendu dans `/var/www/pterodactyl`.

```bash
git clone --depth 1 https://github.com/AyhanTHE/VinusPanel.git
cd VinusPanel
sudo bash install.sh
```

Pour un panel installé ailleurs :

```bash
sudo bash install.sh --panel-dir /chemin/vers/pterodactyl
```

Un contrôle sans modification est disponible :

```bash
bash install.sh --check
```

## Mise à jour

```bash
cd VinusPanel
git pull --ff-only
sudo bash install.sh
```

La première installation conserve les fichiers d'origine dans `/var/lib/vinuspanel/original`. Chaque exécution crée aussi une sauvegarde transactionnelle dans `/var/backups/vinuspanel`.

## Désinstallation

```bash
cd VinusPanel
sudo bash uninstall.sh
```

Le script restaure les fichiers présents avant la toute première installation de VinusPanel, supprime uniquement les fichiers ajoutés par le thème, reconstruit les assets et vide les caches du panel.

## Installation manuelle

Les chemins du dossier `overlay/` reproduisent ceux de Pterodactyl. Ils peuvent être copiés à la racine du panel, puis compilés :

```bash
sudo cp -a overlay/. /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo yarn install --frozen-lockfile
sudo yarn build:production
sudo php artisan view:clear
sudo php artisan cache:clear
```

L'installateur automatisé est recommandé car il gère la maintenance, les permissions, les sauvegardes et le retour arrière en cas d'échec.

## Compatibilité

- Pterodactyl Panel : **1.15.1**
- PHP : 8.2 ou 8.3
- Node.js : 18, 20 ou 22
- Yarn : 1.x

Une autre version du panel peut modifier les composants React couverts par la surcouche. Exécutez d'abord `bash install.sh --check` et testez une sauvegarde avant toute migration.

## Versions

La version actuelle est **1.1.0**. Consultez [CHANGELOG.md](CHANGELOG.md) pour le détail des évolutions.

## Licence

Le thème et les scripts VinusPanel sont distribués sous licence MIT. Pterodactyl est un projet tiers également distribué sous licence MIT ; consultez [pterodactyl/panel](https://github.com/pterodactyl/panel).
