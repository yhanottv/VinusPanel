# 🤝 Développement et entretien de la documentation

## Structure du dépôt

`overlay/` contient les sources appliquées au panel. `blueprint-overlay/` adapte les intégrations Blueprint. `extensions/vinuscatalog/` contient le catalogue et ses tests. `integrations/` contient les compagnons Bukkit/mods. `scripts/` contient le garde-fou et les tests. `docs/gitbook/` conserve cette documentation. Le fichier `overlay-manifest.txt` liste chaque fichier de `overlay/` : tout fichier ajouté ou déplacé doit y figurer.

Reporter les modifications dans les sources plutôt que de modifier seulement la production. Le dépôt n'inclut pas tout Pterodactyl : les builds frontend ont besoin d'un arbre Pterodactyl compatible et de ses dépendances.

Piège connu : le script `yarn build:production` de Pterodactyl supprime tous les `*.js` sous `public/assets`. Ne jamais placer un script du thème à cet endroit ; utiliser `public/vinus/`.

## Contrôles

Sans panel :

```bash
bash -n install.sh uninstall.sh scripts/*.sh
bash scripts/check-package.sh
bash scripts/test-guard.sh               # garde-fou : symlinks, UUID, quarantaine
bash scripts/test-installer-resume.sh    # reprise d'une installation interrompue
php scripts/test-players.php
php scripts/test-player-companion.php
```

Avec un panel Pterodactyl **1.15.1** dont `composer install` a été exécuté, l'overlay et les classes du catalogue étant copiés dedans (le plus simple : reprendre les étapes de `docs/ci/frontend.yml`) :

```bash
# Définir d'abord la variable d'environnement APP_KEY avec une clé jetable ("base64:" + 32 octets encodés en base64) : les tests démarrent Laravel.
for t in extensions/vinuscatalog/tests/*.php scripts/test-*.php; do
    bash scripts/run-php-test.sh "$t" /chemin/vers/pterodactyl
done
```

`scripts/run-php-test.sh` échoue aussi quand une exception est affichée avec un code de sortie 0, comportement de la console Laravel. Lire les scripts avant de les exécuter : certains simulent Wings et les téléchargements, aucun ne doit toucher un panel de production.

Frontend, dans un panel de test 1.15.1 avec l'overlay appliqué et les dépendances de `install.sh` ajoutées :

```bash
yarn add -D @babel/core@^7.24.0 --ignore-scripts   # requis pour Jest : le 7.18 verrouillé ne charge pas le preset actuel
node_modules/.bin/tsc --noEmit
node_modules/.bin/jest --ci
NODE_OPTIONS=--openssl-legacy-provider yarn build:production
```

Le workflow `docs/ci/frontend.yml` enchaîne ces étapes ; le copier dans `.github/workflows/` pour l'activer ([docs/ci/README.md](https://github.com/yhanottv/VinusPanel/blob/main/docs/ci/README.md)). Les checks GitHub ne remplacent pas une validation complète de l'installation sur un VPS ni dans un navigateur.

Pour une nouvelle combinaison VinusPlayers, construire le JAR, vérifier le chargement et les données, puis ajouter la version exacte au manifeste. Pour une modification visuelle, contrôler mobile, thème clair, clavier et réduction des mouvements.

Ne jamais déposer de configuration d'instance, identifiants, snapshots `.vinus/`, mondes ou captures privées. Les captures de documentation doivent utiliser des données de démonstration.

## Publier les pages sur GitBook

Le dépôt est relié à GitBook par **Git Sync** : le fichier `.gitbook.yaml` à la racine indique `root: ./docs/gitbook/`, `README.md` comme accueil et `SUMMARY.md` comme table des matières. Toute modification fusionnée sur `main` dans `docs/gitbook/` est synchronisée vers GitBook. Le fichier `docs/gitbook/gitbook-docs.yaml` décrit l'espace pour la configuration multi-espaces.

Règles de rédaction : liens **relatifs** vers les fichiers `.md`, ordre défini uniquement par `SUMMARY.md`, un chapitre par fichier. Lors du renommage d'un chapitre, mettre à jour `SUMMARY.md`, `README.md` et tous les liens croisés. Après la première synchronisation, relire l'espace dans GitBook avant de le publier.

La documentation distingue les versions publiées de la branche de développement et documente les limites vérifiées, sans promesse de compatibilité universelle ou de capacité non mesurée.

[Sommaire](README.md)
