# 🖥️ Tableau de bord, assistant, compte et langues

## Tableau de bord

Rechercher un serveur, choisir la liste ou la grille, puis **Gérer**. Les cartes reprennent l’état, les ressources et le logo du logiciel détecté. Une connexion indisponible ne doit pas être interprétée comme une consommation nulle.

Les raccourcis mènent à la console, aux fichiers, aux sauvegardes et à l’activité. Leur disponibilité dépend des permissions et limites du serveur.

## Assistant de création (première connexion)

Quand un **administrateur** ouvre le tableau de bord d'un panel qui ne contient encore **aucun serveur**, une fenêtre propose : « Voulez-vous créer un serveur maintenant ? ». **Plus tard** la ferme (le choix est mémorisé par navigateur) ; si l'assistant est abandonné en cours de route, un rappel apparaît à la visite suivante. Une fois un serveur créé, l'assistant ne se propose plus : créer les serveurs suivants depuis **Admin → Servers → Create New**.

L'assistant a cinq étapes :

1. **Identité** : nom, description et propriétaire. Le compte connecté est présélectionné.
2. **Ressources** : RAM (préréglages de 1 à 64 Go limités à la capacité du nœud), limite CPU (déduite des cœurs de la machine) et disque (10 Go par défaut, plafonné à l'espace du nœud).
3. **Accès** : nœud et port, choisi parmi les allocations libres.
4. **Logiciel** : famille (nest), moteur (egg) et version. Pour Minecraft, les versions viennent du catalogue et, pour Forge, NeoForge, Fabric et les moteurs équivalents, le build du loader se choisit aussi. L'acceptation du contrat Minecraft EULA est **obligatoire** pour créer un serveur Minecraft.
5. **Récapitulatif** puis création. Le panel ouvre ensuite le serveur, qui démarre à la fin de son installation.

L'image Docker (adaptée à la version de Java exigée par la version Minecraft choisie), la commande de démarrage et les variables de l'egg sont déterminées côté serveur ; le navigateur n'envoie que des valeurs vérifiées. Les logiciels proposés sont ceux des eggs installés dans le panel.

## Compte → Vue d’ensemble

La page sépare photo, e-mail, mot de passe et vérification en deux étapes. L’arobase identifie l’e-mail, la clé les champs de mot de passe, et l’œil affiche ou masque uniquement le champ concerné. Les règles de validation Pterodactyl continuent à s’appliquer.

Les préférences de profil et la photo sont **locales au navigateur** : elles ne changent pas les identifiants et ne sont pas synchronisées entre appareils. Les modifications d’e-mail et de mot de passe passent, elles, par le compte Pterodactyl.

Conserver les codes de récupération de double authentification dans un lieu privé. Les identifiants API et clés SSH donnent des accès techniques : ne pas les inclure dans des tickets publics.

## Langues

Le menu affiche noms et drapeaux pour français, anglais, allemand, espagnol, italien, portugais, néerlandais et turc. La préférence est enregistrée dans le navigateur. Un changement recharge la page : enregistrer les modifications en cours avant de changer.

Les descriptions avancées non traduites peuvent utiliser l’anglais. Les journaux Minecraft, messages des fournisseurs, formulaires hérités et extensions tierces conservent leur propre langue. Les drapeaux sont des repères visuels, accompagnés d’un libellé accessible.

## Messages d’erreur

Lire le contexte et l’éventuelle référence de diagnostic. Réessayer convient à une connexion temporairement interrompue. Après l’expiration d’une installation longue, vérifier d’abord l’état et les fichiers avant de relancer. Fermer une notification ne corrige pas sa cause.

[Sommaire](README.md) · [Design Studio](05-Design-Studio.md)
