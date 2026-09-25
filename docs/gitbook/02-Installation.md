# 🚀 Installer VinusPanel

## Installer Pterodactyl sur une machine vierge

Cette procédure vise une installation classique sur Ubuntu 24.04, avec le code du panel dans `/var/www/pterodactyl`. Elle ne s’applique pas à l’image Docker officielle : dans Docker, le panel se trouve généralement dans `/app` et l’image de production ne contient pas les outils de compilation nécessaires à VinusPanel.

Pour une installation Docker, consulter la [documentation officielle du Panel](https://pterodactyl.io/panel/1.0/getting_started.html) et prévoir ensuite une image personnalisée qui contient Node.js 22, Yarn et la surcouche compilée. Le projet Pterodactyl documente surtout l’installation classique du Panel ; l’image Docker de production ne se personnalise pas avec `install.sh` directement.

### Dépendances du serveur

Exécuter ces commandes en SSH avec `root` ou `sudo` :

```bash
apt update
apt -y upgrade
apt install -y software-properties-common curl ca-certificates gnupg2 sudo lsb-release
add-apt-repository -y ppa:ondrej/php
apt update
apt install -y php8.3 php8.3-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip} mariadb-server nginx tar unzip git redis-server
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install --global yarn@1
```

Vérifier les prérequis avant de continuer :

```bash
php -v
composer --version
systemctl status mariadb nginx redis-server --no-pager
node --version
yarn --version
```

### Télécharger Pterodactyl 1.15.1

```bash
mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl
curl -fL -o panel.tar.gz https://github.com/pterodactyl/panel/releases/download/v1.15.1/panel.tar.gz
tar -xzvf panel.tar.gz
rm panel.tar.gz
chmod -R 755 storage/* bootstrap/cache
```

Créer ensuite une base MariaDB et un utilisateur dédiés. Remplacer les valeurs entre chevrons et ne jamais publier le mot de passe :

```bash
mariadb -u root -p
```

```sql
CREATE DATABASE panel;
CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY '<MOT_DE_PASSE_DB_LONG_ET_UNIQUE>';
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Configurer le panel avec les assistants intégrés :

```bash
cd /var/www/pterodactyl
composer install --no-dev --optimize-autoloader
php artisan p:environment:setup
php artisan p:environment:database
php artisan p:environment:mail
php artisan key:generate --force
php artisan migrate --seed --force
php artisan p:user:make
chown -R www-data:www-data /var/www/pterodactyl/*
```

Il reste à configurer Nginx, le worker `pteroq`, le cron du scheduler et Wings. Suivre les sections correspondantes du [guide officiel d’installation Pterodactyl](https://pterodactyl.io/panel/1.0/getting_started.html) avant d’installer VinusPanel.

## Préparer le panel

Intervenir sur la machine qui héberge **Pterodactyl Panel**, pas seulement sur un nœud Wings. Le panel doit déjà fonctionner. Prévoir SSH, `sudo`, Git, Bash, PHP, Composer, Node 22, Yarn 1 et les sources frontend Pterodactyl.

Sauvegarder la base de données, les fichiers du panel, sa configuration privée et les volumes des serveurs. Si VinusPanel est déjà installé, inclure `storage/app/vinuspanel/design.json` et `public/assets/vinus/custom`. Les sauvegardes ciblées de l’installeur ne remplacent pas une sauvegarde complète.

Si les outils Minecraft sont souhaités, installer d’abord la version compatible de [Blueprint](https://blueprint.zip/guides/admin/install), puis le thème, puis Vinus Catalog.

## Télécharger la branche documentée

```bash
git clone --branch main --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
bash install.sh --check
sudo bash install.sh
```

Ces commandes choisissent la branche principale à jour, documentée ici. Pour une version publiée, choisir son tag ou son archive et ses instructions ; les fonctions récentes peuvent en être absentes.

Le chemin par défaut est `/var/www/pterodactyl`. Avec un autre emplacement :

```bash
bash install.sh --panel-dir /chemin/vers/pterodactyl --check
sudo bash install.sh --panel-dir /chemin/vers/pterodactyl
```

## Déroulement

L’installeur contrôle les versions, sauvegarde les fichiers concernés, active la maintenance, copie l’overlay et les variantes Blueprint applicables, prépare les dépendances et compile le frontend. Il vide ensuite les caches et quitte la maintenance. Conserver la sortie et le chemin de sauvegarde affiché.

Ne pas interrompre la compilation ni lancer deux installations en parallèle. Le thème ne demande pas de redémarrage aux serveurs de jeu. En cas d’échec, le script **tente** un retour aux fichiers précédents : vérifier le résultat au lieu de supposer sa réussite.

## Vérifier

1. Recharger le panel sans cache et se connecter.
2. Ouvrir le tableau de bord puis un serveur : état, fichiers et console.
3. Ouvrir Design avec un administrateur et vérifier l’aperçu.
4. Tester un sous-utilisateur et ses restrictions.
5. Installer séparément Vinus Catalog si les outils Minecraft sont nécessaires.

Une installation complète sur un panel entièrement neuf n’est pas une validation acquise du projet : les tests incluent des builds isolés et un panel existant. Prévoir une première installation sur un environnement de test.

[Sommaire](README.md) · [Blueprint et catalogue](03-Blueprint-et-Catalogue.md)
