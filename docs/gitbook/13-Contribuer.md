# 🤝 Développement et entretien de la documentation

## Structure

`overlay/` contient les sources appliquées au panel. `blueprint-overlay/` adapte les intégrations Blueprint. `extensions/vinuscatalog/` contient le catalogue et ses tests. `integrations/` contient les compagnons Bukkit/mods. `docs/gitbook/` conserve la copie éditable de cette documentation.

Reporter les modifications dans les sources plutôt que de modifier seulement la production. Le dépôt n’inclut pas tout Pterodactyl : les builds frontend ont besoin d’un arbre Pterodactyl compatible et de ses dépendances.

## Contrôles

```bash
bash -n install.sh uninstall.sh scripts/check-package.sh
bash scripts/check-package.sh
php scripts/test-players.php
php scripts/test-player-companion.php
```

Les tests Laravel utilisent un panel de test et son autoloader :

```bash
php scripts/test-player-consent.php /chemin/vers/pterodactyl
php scripts/test-design.php /chemin/vers/pterodactyl
```

Lire les scripts avant leur exécution. Certains tests consultent les fournisseurs, d’autres simulent Wings/téléchargements. Les tests React/TypeScript se lancent avec l’overlay appliqué au panel de test. Les checks GitHub ne remplacent pas une validation complète de l’installation ou du navigateur.

Pour une nouvelle combinaison VinusPlayers, construire le JAR, vérifier le chargement et les données, puis ajouter la version exacte au manifeste. Pour une modification visuelle, contrôler mobile, thème clair, clavier et réduction des mouvements.

Ne jamais déposer de configuration d’instance, credentials, snapshots `.vinus/`, mondes ou captures privées. Les captures de documentation doivent utiliser des données de démonstration.

## Publier les pages sur GitBook

Les chapitres Markdown sont conservés dans `docs/gitbook/` pour révision. Importez ce dossier dans l’espace GitBook de VinusPanel, ou configurez Git Sync sur cette branche et ce dossier. Avec Git Sync, choisissez explicitement la source à conserver lors de la première synchronisation.

`README.md` est l’accueil et `SUMMARY.md` définit l’ordre des chapitres. Utilisez des liens relatifs vers les fichiers `.md`. Relisez et publiez les modifications dans GitBook après validation.

La documentation distingue les versions publiées de la branche de développement et documente les limites vérifiées, sans promesse de compatibilité universelle ou de capacité non mesurée.

[Sommaire](README.md)
