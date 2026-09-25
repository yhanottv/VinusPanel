# Design Studio

Le pinceau ouvre le studio pour les **administrateurs racine**. Les réglages sont à gauche et le véritable aperçu du panel à droite.

## Utilisation

1. Choisir une catégorie puis une option et observer le résultat.
2. Tester les formats bureau, tablette et mobile.
3. Vérifier tableau de bord, aperçu serveur, console et connexion.
4. **Enregistrer** publie les réglages ; **Annuler** restaure le design enregistré.

Les actions serveur et l’authentification sont neutralisées dans l’aperçu. Quitter un brouillon non enregistré déclenche un avertissement.

## Réglages

| Catégorie | Possibilités |
| --- | --- |
| Identité | Nom, modes de logo, images claire/sombre, symbole carré, texte alternatif |
| Couleurs | Fond, surfaces, texte, accent et états |
| Typographie et icônes | Familles proposées, taille, épaisseur et angles ; Vinus, Lucide, Tabler, Font Awesome |
| Disposition et surfaces | Largeur, barre latérale, liens actifs, arrondis, bordures, transparence, fond |
| Navigation | Libellés, ordre, visibilité et liens personnalisés, avec permissions conservées |
| Connexion | Mosaïque de jeux, formulaire, position, textes et effets |
| Tableau de bord | Liste/grille, images, liens rapides, activité, accueil |
| Serveurs | Navigation, en-tête, confidentialité de l’adresse, aperçu et bannières |
| Console | Ressources, courbes/barres, police, invite, remplacements visuels de logs |
| CSS | Ajustements validés ; imports et URL de ressources arbitraires refusés |
| Mouvement et métadonnées | Transitions, animations et présentation |

Les miniatures montrent l’effet des choix. Les animations respectent la réduction des mouvements. Les barres affichent les 15 dernières mesures, les courbes conservent 30 échantillons ; changer le style ne modifie pas les mesures.

## Sauvegarde et publication

Les réglages globaux sont stockés dans `storage/app/vinuspanel/design.json`, les images dans `public/assets/vinus/custom`. Conserver ces chemins lors des mises à jour et migrations, sans les publier. Les réglages personnels de palette restent locaux au navigateur.

Les options du studio s’appliquent sans rebuild. Modifier le code dans `overlay/resources/scripts` exige de recompiler/réinstaller. Les modules absents ne sont pas annoncés comme déjà installés.

[Guide technique](https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/docs/live-design-studio.md) · [Sommaire](Home)
