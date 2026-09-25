# Mods, plugins et mises à jour

Le logiciel détecté détermine les onglets : Fabric/Forge/NeoForge proposent des mods, Paper/Spigot des plugins, les proxys leurs plugins spécifiques. Les hybrides peuvent proposer les deux. Un mod Fabric n’est pas un plugin Paper ; une version Minecraft identique ne garantit pas la compatibilité.

## Installer

1. Arrêter le serveur et vérifier les permissions de fichiers.
2. Rechercher un projet depuis la source souhaitée.
3. Lire l’aperçu de version et de dépendances.
4. Confirmer les téléchargements proposés.
5. Démarrer et examiner les logs de chargement.

Le catalogue limite un JAR principal à 25 Mio, un lot à 20 projets/100 Mio et les dépendances à 12 niveaux. Les restrictions de l’auteur/fournisseur restent applicables. Les dépendances optionnelles et conflits avec les fichiers manuels ne sont pas tous résolus automatiquement.

Si le profil est inconnu ou indique `latest`, préciser la version ou demander à l’administrateur de corriger le profil de l’egg.

## Mises à jour

Le suivi concerne les fichiers installés par le catalogue. Les JAR manuels ne sont pas importés automatiquement. Rechercher les mises à jour, comparer les versions puis valider serveur arrêté. Les fichiers de récupération sont conservés et les fichiers inconnus/modifiés ne sont pas écrasés aveuglément.

En cas d’erreur, comparer loader, Minecraft, Java et dépendances exigées par l’auteur. Sur un hybride, deux extensions peuvent entrer en conflit malgré des métadonnées compatibles. Un checksum prouve l’intégrité du fichier, pas l’absence de code malveillant.

CurseForge exige la clé privée de l’administrateur et ne donne pas accès aux ressources payantes/privées. VinusPanel ne contourne pas les restrictions de téléchargement.

[Sommaire](README.md)
