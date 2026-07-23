# ELEMENT COPIER

<p align="center" id="installation">
  <a href="https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=light">
      <img src="https://shieldcn.dev/badge/Chrome%20Web%20Store.svg?logo=googlechrome&logoColor=4285F4&mode=dark" alt="Chrome Web Store">
    </picture>
  </a>
  <a href="https://addons.mozilla.org/firefox/addon/element-copier/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=light">
      <img src="https://shieldcn.dev/badge/Firefox%20Add%E2%80%91ons.svg?logo=firefoxbrowser&logoColor=FF7139&mode=dark" alt="Firefox Add-ons">
    </picture>
  </a>
  <a href="https://github.com/md2it/element-copier/releases/latest/download/element-copier.zip">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=dark">
      <source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=light">
      <img src="https://shieldcn.dev/badge/Latest%20Release%20ZIP.svg?logo=lu:FileArchive&logoColor=CA8A04&mode=dark" alt="Latest Release ZIP">
    </picture>
  </a>
</p>

<p align="center" id="language">
=-=-=-=-=-=-=-=-= | <a href="./DE.md">DE</a> | <a href="../../README.md">EN</a> | <a href="./ES.md">ES</a> | FR | <a href="./RU.md">RU</a> | <a href="./ZH.md">中文</a> | <a href="./AR.md">عربي</a> | =-=-=-=-=-=-=-=-=
</p>

## DESCRIPTION

Copiez et téléchargez des pages entières ou des éléments individuels sous forme de texte enrichi, d’images et de Markdown.

Pour les développeurs et les testeurs : URL, code HTML, tag#id.class, sélecteurs CSS, chemins JS, XPath et XPath complet, styles déclarés et calculés, ainsi que les informations pour les rapports de bugs.

<p align="center" id="screenshots">
  <a href="../publication/screenshots/FR-0.png"><img src="../publication/screenshots/FR-0.png" width="180" alt="Element Copier screenshot 1"></a>
</p>

## FONCTIONNALITÉS PRINCIPALES

- Copier une page entière ou un élément précis
- Convertir le contenu dans plusieurs formats à la fois
- Conserver le dernier contenu copié pour tous les formats activés
- Copier le contenu dans le presse-papiers ou le télécharger sous forme de fichier
- Utiliser une action par défaut configurable pour accélérer les copies répétées
- Raccourcis clavier
- Thèmes clair et sombre
- Paramètres flexibles
- Interface disponible en anglais, français, allemand, espagnol, russe, arabe et chinois simplifié

### Formats pris en charge

- Texte enrichi à coller dans Google Docs et Word
- Images :
   - PNG
   - JPEG
- Markdown
- HTML
- Formats de développement et de test :
   - Tag#id.class
   - Sélecteur
   - Chemin JS
   - XPath
   - XPath complet
   - Styles déclarés
   - Styles calculés
   - Détails QA pour les rapports de bugs

### Notes sur le produit

- La mise en forme du texte enrichi vise un meilleur résultat qu'un simple copier-coller
- Les raccourcis clavier et une action par défaut réduisent le nombre d'étapes pour les copies répétées
- Les formats destinés aux développeurs fournissent des données d'inspection courantes sans ouvrir les DevTools
- Le traitement Markdown préserve autant que possible la mise en page, les liens et les images du contenu, y compris les images SVG converties

## CONFIDENTIALITÉ

- Aucune collecte de données
- Aucun suivi
- Aucune requête réseau
- Le contenu des pages est traité localement dans le navigateur

## LIMITATIONS

- **La sélection d'une iframe diffère** de celle des autres éléments :
   - L'iframe est sélectionnée dans son ensemble
   - Cette différence vient d'une limitation de la plateforme ; l'injection dans l'iframe n'est pas souhaitable
   - La sélection a un aspect différent en raison de gestionnaires d'événements distincts, sans incidence fonctionnelle
- **Le traitement des pages volumineuses peut prendre du temps :**
   - La vitesse est limitée par des bibliothèques tierces utilisées sans modification
   - La génération et l'enregistrement des images peuvent être désactivés dans les paramètres
   - Sans traitement d'images, même les pages très volumineuses sont traitées en une fraction de seconde
- **L'ouverture de la fenêtre de résultat peut être interrompue :**
   - Le navigateur peut ouvrir une autre fenêtre prioritaire
   - Les processus déjà lancés seront tout de même terminés
- **La gestion des petites images dans Markdown est facultative :**
   - Certains usages nécessitent de les inclure, d'autres de les exclure
   - Ce comportement est contrôlé par un paramètre distinct

## LICENCE

[Licence MIT](../../LICENSE)
