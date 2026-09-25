# Développement et entretien du wiki

## Structure

`overlay/` contient les sources appliquées au panel. `blueprint-overlay/` adapte les intégrations Blueprint. `extensions/vinuscatalog/` contient le catalogue et ses tests. `integrations/` contient les compagnons Bukkit/mods. `docs/wiki/` conserve la copie éditable de ce wiki.

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

## Publier les pages

Les chapitres vivent dans `docs/wiki/` pour révision et dans le dépôt wiki GitHub pour lecture. Récupérer les changements avant de publier afin de préserver les contributions faites dans l’éditeur web.

```bash
git clone https://github.com/yhanottv/VinusPanel.wiki.git
# Copier les pages Markdown vérifiées de docs/wiki/ dans ce checkout.
cd VinusPanel.wiki
git diff
git add '*.md'
git commit -m "Update documentation"
git push
```

`Home.md` est l’accueil, `_Sidebar.md` le sommaire et `_Footer.md` les liens de pied de page. Garder les noms stables. Le wiki distingue les versions publiées de la branche de développement et documente les limites vérifiées, sans promesse de compatibilité universelle ou de capacité non mesurée.

[Sommaire](Home)
