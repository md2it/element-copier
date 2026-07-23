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
=-=-=-=-=-=-=-=-= | DE | <a href="../../README.md">EN</a> | <a href="./ES.md">ES</a> | <a href="./FR.md">FR</a> | <a href="./RU.md">RU</a> | <a href="./ZH.md">中文</a> | <a href="./AR.md">عربي</a> | =-=-=-=-=-=-=-=-=
</p>

## BESCHREIBUNG

Kopieren und laden Sie ganze Webseiten oder einzelne Elemente als formatierten Text, Bilder und Markdown herunter.

Für Entwickler und Tester: URLs, HTML-Code, tag#id.class, CSS-Selektoren, JS-Pfade, XPath und vollständige XPath-Ausdrücke, deklarierte und berechnete Stile sowie Details für Fehlerberichte.

<p align="center" id="screenshots">
  <a href="../publication/screenshots/DE-0.png"><img src="../publication/screenshots/DE-0.png" width="180" alt="Element Copier screenshot 1"></a>
</p>

## HAUPTFUNKTIONEN

- Ganze Seite oder bestimmtes Element kopieren
- Inhalte gleichzeitig in mehrere Formate konvertieren
- Zuletzt kopierte Inhalte für alle aktivierten Formate speichern
- Inhalte in die Zwischenablage kopieren oder als Datei herunterladen
- Konfigurierbare Standardaktion für schnelleres wiederholtes Kopieren
- Tastaturkürzel
- Helles und dunkles Design
- Flexible Einstellungen
- Oberfläche verfügbar auf Englisch, Französisch, Deutsch, Spanisch, Russisch, Arabisch und vereinfachtem Chinesisch

### Unterstützte Formate

- Rich Text zum Einfügen in Google Docs und Word
- Bilder:
   - PNG
   - JPEG
- Markdown
- HTML
- Entwickler- und Testformate:
   - Tag#id.class
   - Selektor
   - JS-Pfad
   - XPath
   - Vollständiger XPath
   - Deklarierte Stile
   - Berechnete Stile
   - QA-Details für Fehlerberichte

### Produkthinweise

- Die Rich-Text-Formatierung liefert bessere Ergebnisse als einfaches Kopieren und Einfügen
- Tastaturkürzel und eine Standardaktion reduzieren die Anzahl der Schritte bei wiederholtem Kopieren
- Entwicklerformate stellen häufig benötigte Prüfdaten ohne DevTools bereit
- Die Markdown-Verarbeitung bewahrt nach Möglichkeit Layout, Links und Inhaltsbilder, einschließlich konvertierter SVG-Bilder

## DATENSCHUTZ

- Keine Datenerfassung
- Kein Tracking
- Keine Netzwerkanfragen
- Seiteninhalte werden lokal im Browser verarbeitet

## EINSCHRÄNKUNGEN

- **Die Auswahl von Iframes unterscheidet sich** von der Auswahl anderer Elemente:
   - Das Iframe wird als Ganzes ausgewählt
   - Ursache ist eine Plattformbeschränkung; eine Injektion in das Iframe ist unerwünscht
   - Die Auswahl sieht wegen anderer Ereignishandler anders aus, ohne die Funktion zu beeinträchtigen
- **Die Verarbeitung großer Seiten kann einige Zeit dauern:**
   - Die Geschwindigkeit wird durch unverändert verwendete Drittanbieterbibliotheken begrenzt
   - Bilderzeugung und -speicherung können in den Einstellungen deaktiviert werden
   - Ohne Bildverarbeitung werden selbst sehr große Seiten in Sekundenbruchteilen verarbeitet
- **Das Öffnen des Ergebnis-Pop-ups kann unterbrochen werden:**
   - Der Browser kann ein anderes Pop-up mit höherer Priorität öffnen
   - Bereits gestartete Prozesse werden trotzdem abgeschlossen
- **Die Behandlung kleiner Bilder in Markdown ist optional:**
   - Je nach Anwendungsfall sollen kleine Bilder einbezogen oder ausgeschlossen werden
   - Dieses Verhalten wird über eine separate Einstellung gesteuert

## LIZENZ

[MIT-Lizenz](../../LICENSE)
