# Korisničko uputstvo

## 1. Uvod

Ovaj sistem za upravljanje proizvodnjom (Manufacturing Execution
System) povezuje menadžment kancelarije sa radnicima u proizvodnom
pogonu u realnom vremenu. Sastoji se iz dva dela koji funkcionišu
zajedno:

- **Kontrolna tabla (desktop):** za menadžere, koordinatore, prodajne
  timove i administraciju. Otvara se u web pretraživaču na računaru.
- **Tablet aplikacija (PWA):** za radnike u pogonu. Otvara se u
  pretraživaču na tabletu/telefonu i može se "instalirati" kao prava
  aplikacija (offline podrška, push obaveštenja).

Više firmi može da koristi isti sistem nezavisno jedna od druge
(multi-tenant) — svaka ima svoju izolovanu bazu podataka, korisnike i
podešavanja.

---

## 2. Početak rada

### 2.1 Prijava

| Aplikacija | URL |
|---|---|
| Kontrolna tabla | https://alblue.duckdns.org/login |
| Tablet | https://alblue-tablet.duckdns.org/login |

Polja prilikom prijave:

- **Kod firme** — dobijate od administratora svoje firme.
- **Email**
- **Lozinka**

Posle uspešne prijave sistem automatski preusmerava na odgovarajuću
početnu stranicu (zavisi od uloge korisnika).

### 2.2 Uloge korisnika

| Uloga | Šta može |
|---|---|
| **Admin** | Administracija sopstvene firme: korisnici, procesi, kategorije, šifarnici. |
| **Manager** | Sve što ima Koordinator + administracija. |
| **Coordinator** | Kreiranje/aktiviranje narudžbina, praćenje proizvodnje, odobravanje zahteva. |
| **SalesManager** | Prodaja: kreira narudžbine, traži izmene, prati svoje narudžbine. |
| **Department** | Radnik u pogonu. Koristi samo tablet aplikaciju. |

### 2.3 Profil, jezik i tema

Klik na avatar u donjem levom uglu otvara profil:

- **Tema:** Svetla / Tamna.
- **Jezik:** Srpski / Engleski. Promena je trenutna; izbor se pamti.
- **Promena lozinke**.
- **Odjava**.

Na javnim stranicama (prijava, *O aplikaciji*) jezik se može promeniti
i preko prekidača u gornjem desnom uglu.

---

## 3. Kontrolna tabla (Dashboard)

### 3.1 Glavne strane

Sidebar prikazuje samo one stavke koje uloga korisnika može da otvori.

- **Kontrolna tabla koordinatora** — pregled svih aktivnih narudžbina
  u realnom vremenu, radnici na mreži, statistika dana, kritični rokovi,
  zahtevi na čekanju. Detaljnije u 3.9.
- **Narudžbine** — lista svih narudžbina (master tabela), kreiranje
  novih, izmena postojećih.
- **Prodaja** — kontrolna tabla za prodajne menadžere (videti pregled
  svojih narudžbina i zahteva za izmenu).
- **Zahtevi za blokadu** — radnici prijavljuju probleme; menadžer
  odobrava ili odbija.
- **Zahtevi za izmenu** — prodaja traži izmene na postojećim
  narudžbinama; menadžer odobrava.
- **Vremena procesa** — izveštaji o trajanju procesa i radnim satima.
- **Administracija** — korisnici, procesi, kategorije proizvoda, tipovi
  narudžbina, specijalni zahtevi, smene.
- **Uputstvo** (ovaj dokument) — u footeru sidebar-a.

U levom donjem uglu su i:
- **Obaveštenja** (zvonce sa brojem nepročitanih) — videti 3.9.
- **Profil** — promena teme/jezika, odjava.

### 3.2 Kreiranje narudžbine

1. Otvori **Narudžbine** → **Kreiraj narudžbinu**.
2. Popuni osnovne podatke:
   - **Broj narudžbine** (jedinstven u okviru firme)
   - **Tip narudžbine** (Standardna, Reklamacija, ...)
   - **Prioritet** (manji broj = viši prioritet)
   - **Rok isporuke**
3. Opciono: napomena, prilagođeni dani upozorenja/kritičnosti, prilozi
   (PDF, slike).
4. **Dodaj stavku** za svaku stavku narudžbine:
   - **Kategorija proizvoda** — određuje listu procesa koji se primenjuju.
   - **Naziv proizvoda**
   - **Količina**
   - Opciono: napomena, prilozi po stavki.
5. **Sačuvaj**. Narudžbina je sada u statusu **Nacrt** — može se
   neograničeno menjati.
6. Kada je sve spremno: **Aktiviraj narudžbinu**. Od tog trenutka
   narudžbina ulazi u proizvodnju i pojavljuje se u redu čekanja
   radnika.

#### Ručni izbor procesa

Ako tip narudžbine ima uključen prekidač **Ručni izbor procesa**
(podešava se u *Administracija → Tipovi narudžbine*), prilikom
kreiranja se pojavljuje dodatna sekcija:

- **Multiselect** procesa — biraš procese koji se primenjuju.
- **Redosled** je redosled biranja u multiselect-u (možeš ukloniti i
  ponovo dodati ako želiš da promeniš redosled).
- **Kompleksnost po procesu** — opciono (Lako / Srednje / Teško).
- **Zavisi od** — za svaki proces možeš podesiti od kojih drugih
  procesa zavisi (depends on).

Sistem **ne dozvoljava kružne zavisnosti** — opcija koja bi stvorila
ciklus (npr. A zavisi od B, a B zavisi od A) biće zasivljena sa
napomenom "stvara kružnu zavisnost".

Ručno izabrani procesi **pregaze** procese iz kategorije proizvoda za
sve stavke u toj narudžbini.

### 3.3 Master tabela narudžbina

Glavni pregled svih narudžbina kao matrica:

- **Redovi:** narudžbine
- **Kolone:** procesi (A, B, C, ... — abeceda procesa iz šifarnika)
- **Ćelije:** mali kvadratić sa bojom koja označava agregirano stanje
  tog procesa za tu narudžbinu (preko svih njenih stavki).

Boje:

| Boja | Značenje |
|---|---|
| 🟢 zelena | Završeno |
| 🔵 plava | U toku |
| 🟠 narandžasta | Pauzirano / zaustavljeno |
| 🔴 crvena | Blokirano |
| ⚪ siva | Na čekanju |
| ⬜ bela | Proces nije primenjiv na ovu narudžbinu |
| 🟩 *debela zelena ivica* | Spreman za izvršavanje (sve zavisnosti su završene) |

**Filteri iznad tabele:**

- Pretraga po broju narudžbine
- Status (Nacrt, Aktivna, Pauzirana, Otkazana, Završena)
- Tip narudžbine
- Fakturisano (Da / Ne)
- Opseg datuma rok isporuke

**Izvoz:** dugme **Izvoz** → Excel ili CSV. U zaglavlju izvezenog
fajla pišu primenjeni filteri i vreme generisanja.

### 3.4 Detalji narudžbine (desni panel)

Klik na red u tabeli otvara desni panel sa svim detaljima narudžbine i
mogućnostima izmene.

#### Zaglavlje

- **Tip narudžbine** (obojeno) i **Status** (Nacrt / Aktivna /
  Pauzirana / Otkazana / Završena).
- **Broj narudžbine** — klik na olovku omogućuje inline izmenu i
  trenutno čuvanje (radi i za aktivnu narudžbinu).
- **Rok isporuke** — isto, klik na olovku → odaberi datum → čuva se
  odmah.
- **Prioritet** — direktno polje u zaglavlju; klik na **Sačuvaj** primeni
  izmenu (za aktivnu narudžbinu mora preko Zahteva za izmenu).
- **Završenost** — procenat završenih procesa.
- **Dani upozorenja / Kritični dani** — koliko dana pre roka isporuke
  narudžbina ulazi u "upozorenje" odnosno "kritično" stanje.

#### Tok procesa (Process Timeline)

Krugovi prikazuju agregirano stanje svakog procesa preko svih stavki
narudžbine:

- Boje iste kao u master tabeli.
- **Debela zelena ivica** = bar jedna stavka ima taj proces spreman za
  rad (sve zavisnosti za tu stavku su završene).
- Hover na krug → tooltip sa imenom procesa, statusom i ukupnim
  vremenom.

Ispod krugova nalazi se i **Legenda** (klikabilna) sa značenjima boja.

#### Stavke (Items)

Svaka stavka prikazana je kao kartica:

- **Naziv proizvoda**, **Kol. (količina)**, kategorija proizvoda.
- **Kvadratići procesa** — isti sistem boja, plus debela ivica kada je
  spreman za izvršavanje. Klik na završeni kvadratić omogućuje
  **Ponovno pokretanje procesa** (vidi dole).
- **Specijalni zahtevi** — labele se prikazuju pored stavke. Klik **+**
  → bira se tip specijalnog zahteva → on može da modifikuje listu
  procesa za tu stavku (dodaje, uklanja ili ograničava na samo
  navedene).
- **Kompleksnost** — padajući za svaki proces stavke (Lako / Srednje /
  Teško). Default dolazi iz kategorije proizvoda; može se prebrisati za
  konkretnu stavku.
- **Dokumenti** — prilozi vezani za tu stavku.

#### Manuelni procesi (samo za tipove sa uključenim ručnim izborom)

Ako narudžbina ima ručno izabrane procese, prikazuje se i sažeti
spisak tih procesa sa zavisnostima u zasebnoj kartici — samo za
pregled (ne menja se posle kreiranja).

#### Dokumenti narudžbine

Prilozi (PDF, slike) vezani za celu narudžbinu, nezavisno od stavki.

#### Napomena

Slobodno tekstualno polje.

#### Akcije u zaglavlju

- **Sačuvaj** — primeni sve nepročuvane izmene (kompleksnost,
  prioritet, specijalni zahtevi, napomena).
- **Aktiviraj narudžbinu** (kada je Nacrt).
- **Pauziraj** / **Nastavi** — privremeno zaustavlja sve procese
  narudžbine. Kada se nastavi, dolazi prompt sa izborom za svaki
  zaustavljeni proces:
  - **Zadrži vreme** — tajmer kreće od prethodnog trajanja.
  - **Resetuj vreme** — tajmer kreće od nule.
- **Otkaži narudžbinu** — narudžbina se vraća u status Otkazana. Iz
  Otkazane se može **Ponovo otvoriti** (vraća u Nacrt).
- **Dupliraj** — kreira novu narudžbinu na osnovu ove (kopira stavke,
  kategorije, kompleksnost). Nova ima status Nacrt.
- **Fakturisano** (kada je Završena) — toggle. Prikazuje se u filteru
  Fakturisano i u izvozu.

#### Ponovno pokretanje procesa

Klik na već završeni kvadratić procesa stavke otvara izbor:

- **Ponovo pokreni (zadrži vreme)** — proces ide u Pending, vreme
  ostaje sabrano.
- **Ponovo pokreni (resetuj vreme)** — proces ide u Pending, vreme se
  resetuje na 0.

Korisno kada se proces vraća na doradu.

### 3.5 Zahtevi za blokadu

Radnik kroz tablet aplikaciju prijavljuje da ne može da nastavi rad
(npr. nedostaje materijal, oštećen proizvod). Zahtev odmah pristiže u
dashboard sa zvonom obaveštenja.

#### Tok rada

1. Radnik klikne **Zahtev za blokadu** na tabletu i unese razlog →
   zahtev je u statusu **Na čekanju**.
2. Koordinator / Manager otvara **Zahtevi za blokadu** u sidebaru.
   Lista filtrira po statusu (Na čekanju / Odobreno / Odbijeno /
   Rešeno).
3. Klik na zahtev otvara detalje: koja narudžbina, koja stavka, koji
   proces, ko je tražio, kada, razlog.
4. **Odobri** — otvara formu sa obaveznim poljem **Odgovor** (npr.
   razlog blokade). Proces ulazi u status **Blokiran** (crveni
   kvadratić u tabeli). Tajmer staje.
5. **Odbij** — opciono polje **Napomena**. Radnik može nastaviti rad,
   proces se vraća u prethodno stanje.

#### Odblokiranje

Kada se rešenje stigne (npr. stigao materijal):

- Iz detalja narudžbine ili iz liste zahteva → **Odblokiraj**.
- Dolazi pitanje: **Zadrži vreme** ili **Resetuj vreme** (isto kao kod
  pauze narudžbine).
- Proces se vraća u Pending, dostupan je radnicima.

#### Brojač zahteva

U zaglavlju sidebar stavke **Zahtevi za blokadu** prikazuje se brojač
nepročitanih zahteva na čekanju, da koordinator vidi koliko ih ima.

### 3.6 Zahtevi za izmenu

Prodajni manager traži izmene na već aktiviranoj narudžbini:

- Izmena podataka (rok, prioritet, stavke)
- Povlačenje
- Otkazivanje
- Pauziranje / Nastavak
- Izmena prioriteta

Manager / Coordinator odobrava ili odbija. Ako se odobri, sistem
sprovodi traženu akciju.

### 3.7 Vremena procesa (izveštaji)

Tri tabele:

- **Prosečna vremena procesa** — koliko prosečno traje svaki proces,
  raščlanjeno po kategoriji proizvoda i kompleksnosti.
- **Vremena po narudžbini** — koliko je svaki proces trajao za
  određenu narudžbinu.
- **Sati rada radnika** — kumulativni rad po radniku, sa filterom po
  datumu.

Sve tabele podržavaju izvoz u Excel/CSV.

### 3.8 Administracija

Otvoreno za uloge Admin i Manager.

| Stranica | Sadržaj |
|---|---|
| **Korisnici** | CRUD korisnika; dodela uloga i procesa za koje su zaduženi. |
| **Procesi** | Proizvodne operacije (krojenje, CNC, brusenje...). Svaki može imati pod-procese. |
| **Kategorije proizvoda** | Kombinacije procesa sa zavisnostima tipičnim za tip proizvoda. |
| **Tipovi narudžbina** | Standardna, Reklamacija itd. Prekidač "Ručni izbor procesa". |
| **Tipovi specijalnih zahteva** | Modifikatori procesa po stavki (dodaj/ukloni/samo navedene). |
| **Smene** | Definisanje radnih smena. |

### 3.9 Kontrolna tabla koordinatora

Početna stranica za koordinatora / menadžera. Sva polja se osvežavaju
preko WebSocket veze (SignalR) — bez ručnog refresh-a.

- **Statistika dana** — broj završenih narudžbina, aktivnih
  narudžbina, završenih procesa, prosečno vreme procesa, broj
  kritičnih upozorenja, zahtevi na čekanju.
- **Upozorenja o rokovima** — narudžbine koje su u zoni upozorenja
  (žuto) ili kritičnoj zoni (crveno). Klik vodi na narudžbinu.
- **Pregled uživo (Live View)** — po procesima: za svaki proces vidi
  koji radnik trenutno radi, koliko stavki je u redu, koliko je u
  toku. Klikabilne stavke vode na narudžbinu.
- **Radnici na mreži** — ko je trenutno prijavljen i na kom procesu.
- **Zahtevi na čekanju** — sažet pregled, klik vodi na **Zahtevi za
  blokadu** stranu.
- **Zahtevi za izmenu na čekanju** — isto, vodi na **Zahtevi za
  izmenu**.

### 3.10 Obaveštenja

Zvonce u donjem levom uglu pokazuje broj nepročitanih obaveštenja.
Klik otvara popover sa listom.

Vrste obaveštenja:
- Kreirana nova narudžbina (za koordinatore)
- Aktivirana narudžbina
- Proces blokiran / odblokiran
- Zahtev za blokadu kreiran / odobren / odbijen
- Zahtev za izmenu kreiran / obrađen
- Upozorenje o roku (žuto / kritično)
- Završena narudžbina

Akcije:
- Klik na obaveštenje vodi na povezanu narudžbinu/zahtev.
- **Obeleži kao pročitano / nepročitano** (oka ikonica).
- **Obriši** (kanta).
- **Označi sve kao pročitano** ili **Obriši sve**.

Push obaveštenja (browser i mobile) se podešavaju automatski kod prve
prijave (sistem traži dozvolu).

---

## 4. Tablet aplikacija

### 4.1 Instalacija

1. Otvori https://alblue-tablet.duckdns.org u Chrome (Android) ili
   Safari (iOS).
2. Meni pretraživača → **Add to Home screen** / **Dodaj na početni
   ekran**.
3. Ikona se pojavljuje na home screen-u. Aplikacija se ponaša kao
   native app (offline, push obaveštenja).

### 4.2 Prijava i check-in

1. Prijavi se istim podacima kao na desktopu (Kod firme + email +
   lozinka).
2. **Check-in** — bira se proces na kome ćeš danas raditi (npr.
   PRESOVANJE). Vide se samo procesi za koje si registrovan u sistemu.
3. Od trenutka check-in-a sistem prati vreme tvoje smene.

### 4.3 Red čekanja (Queue)

Lista stavki spremnih za rad, sortiranih po **prioritetu** (manji broj
= viši prioritet) i **roku isporuke**:

- Broj narudžbine, naziv proizvoda, količina
- Specijalni zahtevi (ako postoje)
- Tap → otvara se ekran za rad.

### 4.4 Aktivan rad (Active Work)

Ekran prikazuje sve podatke potrebne radniku da uradi posao na jednoj
stavki. Otvara se kada se na queue ekranu klikne na neku stavku i
proces se startuje.

#### Zaglavlje stavke

- **Broj narudžbine**, **naziv proizvoda**, **količina**.
- **Kategorija proizvoda**.
- **Prioritet** i **rok isporuke** (crveno ako su blizu / prešli rok).
- **Specijalni zahtevi** (labele) — ako su pripadajući stavki.
- **Napomena narudžbine** i **napomena stavke** (ako postoje).
- **Završenost** — koliko od ukupnih procesa na stavki je već gotovo.

#### Tajmer (proces bez pod-procesa)

- **Veliki tajmer** počinje da broji od trenutka **Start** klika.
- **Pauziraj** — tajmer staje. Korisno za pauzu, ručak, prekid.
- **Nastavi** — tajmer kreće dalje, ukupno vreme je zbir svih perioda.
- Vreme se kontinuirano prikazuje (sat:minut:sekunda).

#### Pod-procesi (sub-processes)

Ako proces ima definisane pod-procese u administraciji (npr.
SAMONOSEĆI / PISMO / KOMPLET kao podkategorije procesa MONTAŽA), oni
se prikazuju kao zasebne kartice:

- Svaki pod-proces ima svoj tajmer.
- Pod-procesi se rade redom (sledeći postaje aktivan tek kada se
  prethodni završi).
- Klik na **Start** pokreće trenutno aktivni pod-proces.
- **Pauziraj** / **Nastavi** rade nad aktivnim pod-procesom.
- **Završi** zatvori aktivni pod-proces i otvori sledeći. Kada se i
  poslednji završi → ceo proces je gotov.
- Ukupno vreme procesa = zbir vremena svih pod-procesa.

#### Akcije

- **Pauziraj / Nastavi** — kao gore.
- **Zahtev za blokadu** — kliknite, unesite razlog, pošaljite. Proces
  ulazi u red zahteva u dashboard-u, vaš tajmer staje dok se ne reši.
- **Završi proces** — kada je sav rad gotov. Sledeći proces (po
  zavisnostima u kategoriji ili u ručnoj listi) postaje **Spreman** i
  pojavljuje se kod radnika koji je za njega registrovan.

#### Šta se dešava paralelno

- Ako koordinator iz dashboard-a klikne **Pauziraj narudžbinu**, tvoj
  tajmer se zaustavlja i ekran prikazuje da je narudžbina pauzirana.
- Ako koordinator odobri zahtev za blokadu na drugom procesu, to ne
  utiče direktno na tvoj rad, samo ako je tvoj proces povezan
  zavisnostima.
- Ako u međuvremenu stigne push obaveštenje, tablet ga prikaže.

### 4.5 Dolazeće narudžbine (Incoming)

Pokazuje narudžbine koje će **uskoro biti spremne** za tebe — proces
od kog ti zavisiš još traje. Korisno za pripremu.

### 4.6 Zahtev za blokadu

1. Klik **Zahtev za blokadu** u Active Work ekranu.
2. Upiši razlog (npr. "nema lima u boji 7016").
3. Pošalji. Proces se zaustavlja; čeka odluku iz dashboarda.

### 4.7 Odjava (Checkout)

Na kraju smene → **Odjavi se**. Sistem zapisuje radne sate koji se
pojavljuju u izveštaju *Sati rada radnika*.

---

## 5. Komplet primer

Tipičan tok narudžbine od kreiranja do završetka:

1. **Prodajni menadžer** kreira narudžbinu "Pivot vrata" za firmu X
   sa 2 stavke, dodaje skicu kao prilog. Status: Nacrt.
2. **Koordinator** dodatno proverava narudžbinu, postavlja prioritet
   30, klikne **Aktiviraj**. Status: Aktivna.
3. Stavke se pojavljuju u redu čekanja prvog procesa — npr. KROJENJE.
4. **Radnik A** koji je danas na KROJENJU vidi narudžbinu u svom
   tablet redu čekanja. Tap → Start. Tajmer kreće.
5. Posle 1h Radnik A klikne **Završi proces**. KROJENJE je sada
   Završen → sledeći proces (npr. CNC OBRADA) je sada **spreman**.
6. **Radnik B** koji je na CNC-u vidi narudžbinu u svom redu, kreće
   sa radom.
7. ... i tako redom kroz sve procese po zavisnostima koje su definisane
   u kategoriji proizvoda (ili u ručnom spisku, ako je ručni izbor
   uključen).
8. Kada je poslednji proces završen, narudžbina automatski prelazi u
   status **Završena**.
9. Menadžer (kada dobije fakturu) može označiti narudžbinu kao
   **Fakturisano**, što je vidljivo u filteru i u izveštajima.

Tokom celog procesa kontrolna tabla koordinatora i master tabela
osvežavaju se **u realnom vremenu** — ne treba ručno osvežavanje
stranice.

---

## 6. Pitanja i odgovori

**Šta ako narudžbina mora privremeno da se prekine?**
Koordinator / Manager → **Pauziraj narudžbinu**. Svi trenutni procesi
se pauziraju i tajmeri staju. Kasnije: **Nastavi** vrati narudžbinu u
rad.

**Šta ako se napravi greška pri kreiranju narudžbine?**
Dok je u statusu **Nacrt** može se neograničeno menjati. Kada je
narudžbina aktivirana, prodaja podnosi **Zahtev za izmenu** koji
manager odobrava. Otkazivanje vraća narudžbinu u Nacrt, posle čega se
može ponovo izmeniti.

**Mogu li dva radnika da rade isti proces na istoj narudžbini?**
Sistem ne sprečava paralelan rad — ako su oba prijavljena na isti
proces, oba vide narudžbinu u redu. Faktički paralelizam zavisi od
prirode procesa (često nema smisla).

**Kako koordinator vidi šta se trenutno dešava u proizvodnji?**
**Kontrolna tabla koordinatora** prikazuje sve aktivne procese,
radnike na mreži, kritične rokove i zahteve na čekanju. Sve se
osvežava preko WebSocket veze (SignalR) bez potrebe da se ručno
osvežava stranica.

**Funkcioniše li tablet bez interneta?**
Tablet aplikacija je PWA — kešira poslednje stanje i može se otvoriti
offline. Akcije koje su urađene offline sinhronizuju se kada se
internet vrati.

**Kako se rešava brza promena prioriteta?**
Kroz **Zahtev za izmenu → Izmena prioriteta**, ili direktno iz
detalja narudžbine ako manager ima ovlašćenja.

**Kako se prati profitabilnost / utrošeno vreme?**
Izveštaji **Vremena procesa** daju prosečna vremena po procesu i
kategoriji proizvoda + sate rada po radniku. Excel izvoz se može dalje
obraditi.

**Da li sistem podržava više jezika?**
Da — srpski i engleski. Jezik se bira u profilu ili na javnim
stranicama u gornjem desnom uglu. Na prvi dolazak jezik se određuje
prema podešavanju pretraživača posetioca.

---

*Za sva pitanja i komentare: **sales@algreen.rs***
