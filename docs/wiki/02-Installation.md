# Installer VinusPanel

## Préparer le panel

Intervenir sur la machine qui héberge **Pterodactyl Panel**, pas seulement sur un nœud Wings. Le panel doit déjà fonctionner. Prévoir SSH, `sudo`, Git, Bash, PHP, Composer, Node 22, Yarn 1 et les sources frontend Pterodactyl.

Sauvegarder la base de données, les fichiers du panel, sa configuration privée et les volumes des serveurs. Si VinusPanel est déjà installé, inclure `storage/app/vinuspanel/design.json` et `public/assets/vinus/custom`. Les sauvegardes ciblées de l’installeur ne remplacent pas une sauvegarde complète.

Si les outils Minecraft sont souhaités, installer d’abord la version compatible de [Blueprint](https://blueprint.zip/guides/admin/install), puis le thème, puis Vinus Catalog.

## Télécharger la branche documentée

```bash
git clone --branch codex/live-design-studio --single-branch https://github.com/yhanottv/VinusPanel.git
cd VinusPanel
bash install.sh --check
sudo bash install.sh
```

Ces commandes choisissent la branche de développement documentée ici. Pour une version publiée, choisir son tag ou son archive et ses instructions ; les fonctions récentes peuvent en être absentes.

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

[Sommaire](Home) · [Blueprint et catalogue](03-Blueprint-et-Catalogue)
