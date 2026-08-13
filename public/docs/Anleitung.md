# OpenWebRX+ auf dem Raspberry Pi

## **webrx.at – Österreichs WebSDR-Netzwerk**

📡 **Gemeinsam empfangen. Gemeinsam teilen.**  
🌍 Community-betriebene WebSDR-Plattform für Funkamateure

---

### Titelblatt

**Projekt:** OpenWebRX+ WebSDR Node  
**Plattform:** Raspberry Pi  
**Netzwerk:** webrx.at  
**Zielgruppe:** Funkamateure & SDR-Interessierte

---

## Zweck dieser Anleitung

Diese Anleitung beschreibt **einen möglichen Weg**, OpenWebRX+ auf einem Raspberry Pi zu installieren und betriebsbereit zu machen.

Der Fokus liegt nicht auf einzelnen Klicks, sondern auf einem **verständlichen Ablauf**, damit du jederzeit weißt:
- *Warum* du etwas tust
- *Was* dabei passiert
- *Woran* du erkennst, dass der Schritt erfolgreich war

> 🔁 Überall, wo **RUFZEICHEN** steht, trage bitte dein eigenes Amateurfunkrufzeichen ein.

---

## Voraussetzungen

### Benötigte Hardware
- Raspberry Pi (empfohlen: Raspberry Pi 4)
- Netzteil mit ausreichender Leistung
- MicroSD-Karte (mind. 16 GB)
- SDR-Stick (z. B. RTL-SDR kompatibel)
- Antenne (einfacher Draht reicht für den Start)
- Netzwerkverbindung (LAN oder WLAN)

### Zusätzlich notwendig
- PC oder Laptop mit Windows 10/11
- SD-Kartenleser
- Internetzugang mit Router-Zugriff

💰 **Richtwert Gesamtkosten:** ca. 120 €

---

## Schritt 1 – System vorbereiten

Damit der Raspberry Pi starten kann, benötigt er ein Betriebssystem auf der SD-Karte.

1. Lade den **Raspberry Pi Imager** von der offiziellen Webseite herunter
2. Installiere das Programm auf deinem PC

👉 https://www.raspberrypi.com/software/

---

## Schritt 2 – Installationsmedium erstellen

1. Verbinde die MicroSD-Karte mit deinem PC
2. Lade das aktuelle **OpenWebRX+ Image** von GitHub herunter
3. Entpacke das Archiv, bis eine Image-Datei vorliegt

👉 https://github.com/luarvique/openwebrx/releases/

---

## Schritt 3 – Image auf die SD-Karte schreiben

1. Starte den Raspberry Pi Imager
2. Wähle dein Raspberry-Pi-Modell aus
3. Nutze ein **benutzerdefiniertes Image** und wähle die OpenWebRX+-Datei
4. Wähle die richtige SD-Karte als Ziel

⚠️ **Hinweis:** Die SD-Karte wird vollständig gelöscht

---

## Schritt 4 – Grundeinstellungen festlegen

Noch vor dem ersten Start werden wichtige Basisparameter gesetzt:

- **Hostname:** `sdr-RUFZEICHEN`
- **Benutzername:** `RUFZEICHEN`
- **Passwort:** frei wählbar (gut merken!)
- **SSH-Zugriff:** aktivieren (Passwort-Login)
- **WLAN:** nur falls benötigt konfigurieren

Diese Einstellungen erlauben später den Fernzugriff ohne Bildschirm oder Tastatur.

---

## Schritt 5 – Raspberry Pi in Betrieb nehmen

1. SD-Karte in den Raspberry Pi einsetzen
2. SDR-Stick anschließen
3. Netzwerk verbinden (LAN empfohlen)
4. Stromversorgung anschließen

⏳ Beim ersten Start richtet sich das System selbstständig ein. Das dauert einige Minuten.

---

## Schritt 6 – Verbindung zum System herstellen

Sobald der Raspberry Pi im Netzwerk erreichbar ist:

- Öffne unter Windows die Eingabeaufforderung
- Baue eine SSH-Verbindung auf:

```text
ssh RUFZEICHEN@sdr-RUFZEICHEN
```

Beim ersten Verbindungsaufbau muss der Sicherheitshinweis bestätigt werden.

---

## Schritt 7 – Erweiterungen aktivieren

Um digitale Betriebsarten nutzen zu können, werden zusätzliche Komponenten installiert.

```bash
sudo install-softmbe.sh
```

Nach Abschluss ist ein Neustart erforderlich:

```bash
sudo reboot
```

---

## Schritt 8 – OpenWebRX-Benutzer anlegen

Damit du später auf das Web-Interface zugreifen kannst:

```bash
sudo openwebrx admin adduser RUFZEICHEN
```

- Passwort festlegen
- Änderungen übernehmen

---

## Schritt 9 – Zugriff über den Browser

Nach dem Neustart ist das SDR lokal erreichbar:

```text
http://sdr-RUFZEICHEN
```

Wenn die Weboberfläche erscheint, läuft OpenWebRX+ korrekt.

---

## Schritt 10 – Feste IP im Heimnetz vergeben

Damit dein SDR immer unter derselben Adresse erreichbar bleibt:

- Öffne die Router-Oberfläche
- Weise dem Gerät **sdr-RUFZEICHEN** eine feste interne IP-Adresse zu

---

## Schritt 11 – Freigabe ins Internet

Um Zugriffe von außerhalb zu ermöglichen:

- Leite **Port 80 (HTTP)** auf die interne IP des Raspberry Pi weiter
- Diese Einstellung erfolgt im Router

💡 Dadurch wird dein SDR weltweit erreichbar.

---

## Schritt 12 – Externer Zugriff testen

- Öffentliche IP-Adresse ermitteln: https://www.wieistmeineip.at/
- Im Browser aufrufen:

```text
http://DEINE_IP
```

Alternativ kann ein DDNS-Name verwendet werden.

⚠️ Kein HTTPS – immer **http://** verwenden.

---

## Schritt 13 – WebSDR konfigurieren

Im Webinterface:

- Oben rechts **Settings** öffnen
- Mit Rufzeichen anmelden
- Grundeinstellungen prüfen
- Hintergrund-Dekodierung aktivieren

---

## Schritt 14 – Stabiler Dauerbetrieb

Für einen zuverlässigen 24/7-Betrieb empfiehlt sich ein automatischer Neustart:

```bash
sudo crontab -e
```

Am Ende hinzufügen:

```text
0 * * * * root reboot
```

🔁 Neustart einmal pro Stunde (kurze Unterbrechung)

---

## Schritt 15 – Aufnahme ins webrx.at Netzwerk

Sende folgende Informationen per E-Mail an:

📧 **oe8yml@rednil.at**

- Rufzeichen
- Öffentlicher Link zum SDR
- Verwendete Hardware
- Antenne und Standort
- Sonstige Hinweise

---

## webrx.at

🇦🇹 **Österreichs WebSDR-Plattform**  
🤝 Von Funkamateuren für Funkamateure  
📡 Offen • Gemeinschaftlich • Neutral

👉 https://webrx.at

**73 & viel Erfolg beim Aufbau deines WebSDR!**
