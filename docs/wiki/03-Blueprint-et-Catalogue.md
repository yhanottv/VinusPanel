# Blueprint et Vinus Catalog

Pterodactyl gère les comptes et serveurs. Blueprint est le framework d’extensions. Vinus Catalog fournit les outils Minecraft utilisés par le thème. **Mettre à jour le thème ne met pas à jour le catalogue.**

## Installation de l’extension

Après Blueprint et VinusPanel, depuis la racine du dépôt :

```bash
cd extensions/vinuscatalog
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Adapter le chemin du panel. `zip` doit être installé. Pour une mise à jour, reconstruire le paquet avec les nouvelles sources et le réinstaller. Le dossier `app/player-artifacts` fait partie du paquet et contient les compagnons vérifiés.

## Fournisseurs

| Source | Usage |
| --- | --- |
| Modrinth | Mods, plugins et modpacks, sans clé personnelle |
| SpigotMC | Ressources gratuites dont le téléchargement est pris en charge |
| CurseForge | Clé privée requise ; restrictions des auteurs respectées |
| MCJars | Métadonnées des logiciels, versions et builds |

Les échanges réels CurseForge restent à valider dans cet environnement ; les tests actuels utilisent des fixtures. Le catalogue ne contourne pas les ressources payantes/privées ou les téléchargements externes non pris en charge.

## Configuration privée

Partir de `extensions/vinuscatalog/config/vinuscatalog.php.example`. Dans le panel, créer la configuration réelle selon les instructions de l’extension et renseigner uniquement les options nécessaires. La clé CurseForge reste dans l’environnement privé, jamais sur GitHub.

Les correspondances `egg_profiles` et `server_profiles` servent aux eggs personnalisés. Leurs UUID sont propres à votre instance. Après modification de configuration Laravel :

```bash
cd /var/www/pterodactyl
php artisan config:clear
```

Si une catégorie manque, vérifier Blueprint, l’extension, les permissions, la détection du logiciel et la version exacte. Les proxys et Vanilla n’offrent pas les mêmes outils que les serveurs moddés.

[Guide technique de l’extension](https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/extensions/vinuscatalog/README.md) · [Sommaire](Home)
