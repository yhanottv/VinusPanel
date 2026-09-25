# 🛡️ Administration, nœuds et eggs

Le nouveau design conserve routes, formulaires, actions et autorisations Pterodactyl. Il ajoute vue d’ensemble, icônes, recherche de navigation, transitions et tableaux adaptatifs. Navigation et vue d’ensemble sont disponibles en français/anglais ; les formulaires hérités ne sont pas tous traduits.

## Infrastructure

- Un **emplacement** classe des nœuds : il ne déploie pas de machine.
- Un **nœud** correspond à une instance Wings configurée et joignable.
- Une **allocation** définit une adresse/port utilisable.
- Un **nest** regroupe des **eggs**.
- Un **egg** décrit installation, démarrage, variables et images du logiciel.

Configurer d’abord Pterodactyl/Wings selon leur documentation officielle. Le thème ne remplace pas l’installation de l’infrastructure.

## Créer un serveur

1. Choisir propriétaire, nœud et allocation.
2. Définir CPU, mémoire, disque, sauvegardes et bases selon les ressources réelles.
3. Choisir l’egg, l’image Java/runtime et les variables.
4. Exécuter l’installation Pterodactyl et contrôler son résultat.
5. Vérifier démarrage et console avant de donner accès.

VinusPlayers n’est pas ajouté silencieusement par la création administrative. L’installation manuelle reste dans Joueurs ; le catalogue de versions/modpacks propose la fenêtre séparée après démarrage.

## Détection et autorisations

Renseigner logiciel et version dans les variables. Pour un egg personnalisé, utiliser les profils privés du catalogue. Les UUID locaux ne doivent pas être codés dans le dépôt public.

Un onglet visible ne rend pas un sous-utilisateur administrateur. Les API contrôlent chaque opération. Suppressions, transferts, limites et accès API conservent leur portée réelle : vérifier le serveur ciblé et ses sauvegardes.

Le redesign n’ajoute pas de facturation, de déploiement de machines ou de gestion DNS. Ces fonctions demandent des intégrations distinctes.

[Sommaire](README.md)
