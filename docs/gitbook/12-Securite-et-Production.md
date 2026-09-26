# 🔐 Sécuriser et exploiter la production

Une installation par défaut est **fonctionnelle, pas durcie** : elle sert le panel en HTTP sur l'IP, l'API Wings est joignable en clair sur le port 8080 et le pare-feu n'est pas activé. Ce chapitre décrit ce qu'il faut faire avant d'ouvrir le panel au public. Faire les étapes dans l'ordre et **tester chaque changement dans une seconde session SSH avant de fermer la première**.

## 1. Domaine et HTTPS

HTTPS protège le mot de passe administrateur et les jetons échangés avec Wings. Il faut un nom de domaine dont l'enregistrement DNS `A` pointe vers l'IP du VPS (par exemple `panel.exemple.fr`).

### Option A : dès l'installation (recommandé)

Vérifier que le DNS répond (`getent hosts panel.exemple.fr`), puis :

```bash
sudo bash install.sh --install --url https://panel.exemple.fr --admin-email vous@exemple.fr
```

L'installeur configure le vhost Nginx sur ce nom et demande le certificat avec Certbot (redirection HTTP → HTTPS). Le nœud Wings prend par défaut ce même nom d'hôte et le schéma `https`. Ce chemin n'a pas été rejoué sur un VPS de test : vérifier le certificat (`certbot certificates`), l'état du nœud (cœur vert) et la console d'un serveur.

### Option B : sur une installation existante en HTTP

```bash
apt install -y certbot python3-certbot-nginx
sed -i 's/server_name .*;/server_name panel.exemple.fr;/' /etc/nginx/sites-available/pterodactyl.conf
nginx -t && systemctl reload nginx
certbot --nginx -d panel.exemple.fr --redirect --agree-tos -m vous@exemple.fr
```

Puis mettre à jour l'URL du panel :

```bash
cd /var/www/pterodactyl
sed -i 's|^APP_URL=.*|APP_URL="https://panel.exemple.fr"|' .env
php8.3 artisan config:clear
php8.3 artisan queue:restart
```

`APP_URL` doit correspondre à l'adresse réellement utilisée : la visionneuse BlueMap n'accepte d'être affichée que depuis cette origine.

### Wings en HTTPS

1. Dans **Admin → Nodes → le nœud → Settings**, renseigner le FQDN (le domaine), choisir **Communicate Over SSL → Use SSL Connection** et **Behind Proxy → Not Behind Proxy** (sans reverse-proxy devant Wings), enregistrer.
2. Onglet **Configuration** : copier le bloc YAML dans `/etc/pterodactyl/config.yml` (`chmod 600`). Il contient les chemins `/etc/letsencrypt/live/<domaine>/fullchain.pem` et `privkey.pem` ; le certificat doit exister pour ce domaine.
3. `systemctl restart wings`.
4. Pour que Wings relise le certificat renouvelé, ajouter un hook : `certbot renew --deploy-hook "systemctl restart wings"` (ou le placer dans `/etc/letsencrypt/renewal-hooks/deploy/`).

Référence officielle : documentation Pterodactyl sur Wings et SSL.

## 2. Pare-feu

`ufw` est inactif par défaut. Autoriser **d'abord** SSH, sinon l'activation coupe l'accès :

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp          # API Wings : le navigateur s'y connecte pour la console et les fichiers
ufw allow 2022/tcp          # SFTP
ufw allow 25565:25584/tcp   # plage d'allocations (adapter à --alloc-range)
ufw enable
ufw status verbose
```

Ajouter la règle UDP correspondante pour les jeux qui l'exigent. Les ports **publiés par Docker** (les serveurs de jeu) contournent `ufw` : la liste de règles ci-dessus ne remplace pas la gestion des allocations dans Pterodactyl. MariaDB (`3306`) et Redis (`6379`) n'écoutent que sur `127.0.0.1` : ne pas les ouvrir.

## 3. SSH

1. Sur votre machine, générer une clé si nécessaire (`ssh-keygen -t ed25519`) et l'envoyer : `ssh-copy-id root@IP`.
2. **Ouvrir une seconde session** avec la clé pour vérifier qu'elle fonctionne.
3. Désactiver le mot de passe :

```bash
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sshd -t && systemctl reload ssh
```

4. Limiter les tentatives : `apt install -y fail2ban`.

Ne pas conserver de mot de passe `root` dans un fichier partagé ou une conversation ; le changer (`passwd`) s'il a été exposé.

## 4. Comptes du panel

- Changer le mot de passe du compte créé par l'installeur, puis activer la **double authentification** (Compte → Vue d'ensemble).
- Réserver le statut administrateur au strict nécessaire. Les sous-utilisateurs reçoivent seulement les permissions dont ils ont besoin.
- Garder `APP_DEBUG=false` dans `.env` (valeur par défaut de l'installeur).

## 5. E-mails

L'installeur configure `MAIL_MAILER=log` : **aucun e-mail n'est envoyé** (réinitialisation de mot de passe, invitations de sous-utilisateurs). Pour utiliser un serveur SMTP, modifier `/var/www/pterodactyl/.env` :

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.exemple.fr
MAIL_PORT=587
MAIL_USERNAME=utilisateur
MAIL_PASSWORD=mot-de-passe
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=panel@exemple.fr
MAIL_FROM_NAME="VinusPanel"
```

Puis `php8.3 artisan config:clear && php8.3 artisan queue:restart`. La commande `p:environment:mail` n'écrit que `MAIL_DRIVER` : c'est bien `MAIL_MAILER` qui compte. Tester avec **Admin → Settings → Mail → Send test**.

## 6. Sauvegardes

À sauvegarder **en dehors du VPS** (snapshot hébergeur et copie distante) :

| Donnée | Emplacement |
| --- | --- |
| Base de données | `mariadb-dump panel > panel.sql` |
| Configuration et **clé applicative** | `/var/www/pterodactyl/.env` |
| Réglages et images du Design Studio | `/var/www/pterodactyl/storage/app/vinuspanel/` et `/var/www/pterodactyl/public/assets/vinus/custom/` |
| Suivi du catalogue | `/var/www/pterodactyl/storage/app/vinuscatalog/` et `storage/app/vinussoftware/` |
| Configuration Wings | `/etc/pterodactyl/config.yml` |
| Fichiers des serveurs de jeu | `/var/lib/pterodactyl/volumes/` (ou les sauvegardes Pterodactyl) |
| État de VinusPanel | `/var/lib/vinuspanel/` et `/var/backups/vinuspanel/` |

Sans la clé applicative de `.env` (`APP_KEY`), les données chiffrées de la base (clés API, secrets de double authentification, jetons des nœuds) deviennent illisibles : la sauvegarder au même titre que la base. Exemple minimal :

```bash
d=/root/sauvegarde-$(date +%F); mkdir -p "$d"
mariadb-dump panel > "$d/panel.sql"
cp /var/www/pterodactyl/.env /etc/pterodactyl/config.yml "$d/"
tar czf "$d/vinus-donnees.tgz" -C /var/www/pterodactyl storage/app/vinuspanel storage/app/vinuscatalog storage/app/vinussoftware public/assets/vinus/custom
chmod -R go-rwx "$d"
```

Vérifier régulièrement qu'une restauration fonctionne sur une machine de test.

## 7. Surveillance et journaux

| Besoin | Commande |
| --- | --- |
| Erreurs du panel | `tail -f /var/www/pterodactyl/storage/logs/laravel-$(date +%F).log` |
| Wings | `journalctl -u wings -f` |
| File d'attente | `journalctl -u pteroq -f` |
| Garde-fou anti-crash | `tail -f /var/log/vinus-guard.log` |
| Nginx | `/var/log/nginx/pterodactyl.app-error.log` |

## 8. Secrets et hygiène

- Ne publier ni mots de passe, ni jetons GitHub, ni clés API, ni `.env`, ni `/etc/pterodactyl/config.yml` (il contient le jeton du nœud).
- Un secret qui a été collé dans une conversation, un ticket ou un dépôt est **compromis** : le changer ou le révoquer.
- Utiliser des jetons d'accès à durée limitée et les révoquer après usage.

[Sommaire](README.md) · [Installation](02-Installation.md) · [Mises à jour et dépannage](13-Mises-a-jour-et-Depannage.md)
