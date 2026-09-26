# Vinus Catalog 1.4.0

Outils Minecraft pour **Pterodactyl 1.15.1**, **Blueprint beta-2026-06** et **VinusPanel 3.2.0**. Le catalogue de mods/plugins inclut ses propres traductions ; les vues Version, Modpacks, Mondes et BlueMap dépendent de l’espace serveur et des services du thème. Installer les deux paquets pour disposer de l’ensemble.

## Installation

1. Sauvegarder le panel, sa base, sa configuration et les fichiers des serveurs.
2. Installer la version compatible de [Blueprint](https://blueprint.zip/guides/admin/install) (`beta-2026-06`) dans le panel déjà installé.
3. Réappliquer le thème avec `sudo bash install.sh --update` depuis le dépôt : les variantes Blueprint sont alors détectées.
4. Depuis ce dossier, créer le paquet puis l’installer :

```bash
zip -r vinuscatalog.blueprint conf.yml admin app components routes config tests README.md
sudo cp vinuscatalog.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
sudo blueprint -install vinuscatalog
```

Adapter le chemin du panel. Le paquet utilise `ignorePlaceholders` pour conserver les expressions JSX. Le thème n’installe pas automatiquement l’extension. Pour une mise à jour, reconstruire et réinstaller son paquet séparément.

## Sources et configuration locale

- **Modrinth** : mods, plugins et modpacks compatibles, sans clé.
- **SpigotMC** : plugins gratuits dont le fichier est accessible par les sources prises en charge ; les ressources payantes ou avec téléchargement externe non compatible sont refusées.
- **CurseForge** : adaptateur pour les catalogues et archives pris en charge, uniquement avec une clé API administrateur. Les restrictions de distribution des auteurs restent applicables. La validation en ligne de cette source reste à effectuer ; les tests actuels utilisent des fixtures.
- **MCJars** : logiciels, versions et builds pour les 28 choix présentés dans Version. La présence au catalogue ne garantit pas qu’un build existe pour chaque version de Minecraft.

Copier `config/vinuscatalog.php.example` vers `config/vinuscatalog.php` **dans le panel**, puis renseigner uniquement les options nécessaires. La clé CurseForge provient de la variable d’environnement indiquée dans l’exemple. Ne jamais publier ce fichier réel ni les clés.

`egg_profiles` utilise les UUID d’eggs personnalisés et `server_profiles` les exceptions par UUID de serveur. Ces correspondances restent propres à chaque installation. Après modification : `php artisan config:clear`.

La détection privilégie ces profils, puis les variables du logiciel/JAR et le nom de l’egg. Aucune valeur d’egg locale n’est codée en dur. Les versions `latest` ne sont pas devinées. Les proxys ne proposent pas les outils réservés aux mondes Minecraft ; les profils hybrides peuvent proposer Mods et Plugins.

## Installations et récupération

Les aperçus indiquent le contenu, la compatibilité et les changements avant validation. Les installations nécessitent un serveur arrêté et les permissions Pterodactyl appropriées. Les commandes de puissance ne sont pas lancées automatiquement par le catalogue.

Les téléchargements sont filtrés par fournisseur/hôte, taille et empreinte disponible. Les archives sont inspectées pour refuser les chemins dangereux, les entrées spéciales et les tailles décompressées excessives. Les transactions sont verrouillées, revalidées et conservent les anciens fichiers dans un dossier `vinus-*`. En cas de restauration incomplète, le serveur peut rester suspendu jusqu’à intervention de l’administrateur ; utiliser le dossier de récupération indiqué.

Le suivi des mises à jour concerne les fichiers installés par le catalogue. Les JAR ajoutés manuellement ne sont pas importés automatiquement. Les dépendances optionnelles et tous les conflits de mods ne sont pas résolus. Une empreinte correcte prouve l’intégrité du fichier, pas l’absence de code malveillant.

Les opérations logiciel/modpack peuvent durer plusieurs minutes : adapter les limites PHP et du proxy. Après une expiration HTTP, vérifier l’état avant de relancer l’installation.

## Mondes et BlueMap

L’import ZIP inspecte les métadonnées du monde et propose son activation avec récupération de l’état précédent. L’éditeur de propriétés/MOTD conserve les clés inconnues et détecte les modifications concurrentes avant écriture.

BlueMap exige une version compatible, de l’espace disque et un premier rendu. Le choix d’autoriser le téléchargement des ressources Minecraft appartient à l’administrateur. La visionneuse lit les fichiers par le panel avec autorisation temporaire, dans une iframe isolée ; aucun port web BlueMap public n’est requis. Un serveur arrêté peut afficher les cartes déjà générées.

## Tests et portée

Depuis ce dossier, avec les dépendances Composer du panel :

```bash
for test in tests/*.php; do php "$test" /path/to/pterodactyl; done
```

`tests/bluemap.php` vérifie aussi le middleware livré avec le thème : fournir en deuxième argument un autre répertoire de sources du panel si nécessaire. Les tests de transactions simulent Wings et les téléchargements. Les tests de métadonnées peuvent consulter les fournisseurs ; consulter leur code avant exécution hors ligne.

Des installations réelles ont été vérifiées sur un serveur jetable : Paper, Forge, un modpack Fabric, un plugin Spigot, un import de monde et BlueMap. Les 28 logiciels n’ont pas tous été démarrés. Voir [la portée complète des vérifications](../../docs/server-workspace/IMPLEMENTATION.md).

## Joueurs Minecraft

La fiche Joueurs nécessite aussi la dernière version du thème. La consultation des sauvegardes est disponible sans plugin ; le direct et les commandes nécessitent le compagnon Bukkit **VinusPlayers**. [Installation et compatibilité](../../docs/PLAYERS.md). Les inventaires restent en lecture seule.
