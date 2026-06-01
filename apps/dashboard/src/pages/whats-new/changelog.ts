/**
 * Source of truth for the in-app "Šta je novo" page. User-facing — keep
 * the language concrete and focused on what users can SEE / DO
 * differently after the change. Skip BE-only / dev-facing churn (those
 * belong in repo-root CHANGELOG.md).
 *
 * NO PROGRAMMER JARGON in LocaleText values. Sale/Bojan and friends
 * don't know what these words mean and shouldn't have to look them up:
 *   ❌ BE / FE / API / endpoint / token / JWT / refresh token
 *   ❌ tenant (use "firma" / "company")
 *   ❌ N+1 / query / cache / database / table / column
 *   ❌ wall-clock / timestamp / ISO / UUID
 *   ❌ μ / σ / sigma / outlier (use "ekstremne vrednosti" / "ekstremne vrijednosti" / plain prose)
 *   ❌ CreatedAt / UpdatedAt / column-style names
 *   ❌ audit trail (use "istorija izmena" / "change history")
 *   ❌ Sentry / monitoring service names — say "tehnička podrška" / "administrators"
 *   ❌ Sub-process is OK because it's how the table labels them; "pod-proces" is user-facing.
 * If you catch yourself typing one, rewrite the sentence in plain
 * business language. Rule of thumb: "would Sale or Bojan say this in
 * a meeting?" If no, rephrase.
 *
 * NEVER mention internal brand names (algreen / alblue / easy-mes /
 * etc.) in the user-visible text fields. The MES product is white-
 * labeled; the in-app changelog must read as if it belongs to whoever
 * is looking at it.
 *
 * Entries are newest-first. The page shows the first 5 expanded by
 * default; the rest are behind a "Stariji unosi" toggle. No automatic
 * "unread" tracking yet — add localStorage-based badge later if needed.
 *
 * To add an entry: prepend to the array. Write both sr + en — Serbian
 * is the production language, English keeps parity for other tenants
 * and for screenshots / docs.
 */

export type LocaleText = { sr: string; en: string };

export interface ChangelogEntry {
  /** Stable id for React keys + future read-tracking. Use the date + slug. */
  id: string;
  /** ISO date "YYYY-MM-DD". Page formats to DD.MM.YYYY. */
  date: string;
  title: LocaleText;
  bullets: LocaleText[];
}

export const changelog: ChangelogEntry[] = [
  {
    id: '2026-06-02-auto-logout',
    date: '2026-06-02',
    title: {
      sr: 'Automatska odjava radnika + obaveštenje koordinatoru',
      en: 'Automatic worker auto-logout + coordinator notification',
    },
    bullets: [
      {
        sr: 'Smene (Admin → Smene) imaju novo podešavanje "Auto-odjava redovan rad (h)" — vreme nakon koga se radnikova sesija automatski zatvara (npr. 8.5h za smenu 8h sa 30 min produžetka).',
        en: 'Shifts (Admin → Shifts) have a new setting "Auto-logout regular (h)" — the time after which a worker\'s session is automatically closed (e.g. 8.5h for an 8h shift with 30 min grace).',
      },
      {
        sr: 'Tablet: kada vreme istekne, sesija se automatski zatvara i prikazuje se ekran "Automatski ste odjavljeni" sa dugmetom za ponovnu prijavu (za prekovremeni rad).',
        en: 'Tablet: when the time expires, the session is automatically closed and a "You have been auto-logged-out" screen appears with a re-login button (for overtime work).',
      },
      {
        sr: 'Prekovremeni rad: ponovna prijava nakon auto-odjave koristi posebno vreme (npr. 2h po sesiji) umesto regularnog ograničenja.',
        en: 'Overtime: re-login after auto-logout uses a separate limit (e.g. 2h per session) instead of the regular cap.',
      },
      {
        sr: 'Ako tablet bude isključen ili offline, sistem će na sledeći upit ipak automatski zatvoriti zaboravljenu sesiju, sa pravim vremenom isteka.',
        en: 'If the tablet goes offline, the system still auto-closes the forgotten session on the next request, using the actual expiry time.',
      },
      {
        sr: 'Sati radnika: nova kolona "Auto-odjava" u dnevnom prikazu (DA ⚠ / Ne) — pokazuje dane u kojima je auto-odjava primenjena.',
        en: 'Worker Hours: new "Auto-logout" column in the daily view (YES ⚠ / No) — shows the days when auto-logout was applied.',
      },
      {
        sr: 'Ukupni prekovremeni rad po radniku više ne uračunava sitne dnevne prelaze (≤30 min) — kako se "10-ak min ranije ili kasnije" ne bi tretiralo kao prekovremeno.',
        en: 'Per-worker total overtime no longer counts tiny daily overruns (≤30 min) — so "10-ish min earlier or later" isn\'t treated as overtime.',
      },
      {
        sr: 'Koordinator/menadžer/administrator dobija obaveštenje "Auto-odjava — Radnik X automatski je odjavljen" čim se auto-odjava aktivira (vidljivo u listi obaveštenja).',
        en: 'Coordinator/manager/administrator receives an "Auto-logout — Worker X has been auto-logged-out" notification as soon as auto-logout fires (visible in the notification list).',
      },
    ],
  },
  {
    id: '2026-05-29-reports-refinements',
    date: '2026-05-29',
    title: {
      sr: 'Doterivanja izveštaja: vreme procesa, blokade i lista radnika',
      en: 'Report refinements: process time, blocks, and worker list',
    },
    bullets: [
      {
        sr: 'Tab "Trajanje izrade proizvoda": vreme procesa sada prikazuje stvarno aktivno vreme rada operatera, a ne ceo period od početka do kraja procesa.',
        en: 'Product Manufacturing Time tab: process duration now shows the operator’s actual active working time, not the whole span from process start to finish.',
      },
      {
        sr: 'Tab "Blokade po procesu": prosečno trajanje više ne uračunava blokade rešene u potpunosti van radnog vremena (0 radnih sati), pa je prosek realniji.',
        en: 'Blocks per Process tab: the average duration no longer counts blocks resolved entirely outside working hours (0 working hours), so the average is more realistic.',
      },
      {
        sr: 'Tabovi "Sati radnika" i "Efikasnost radnog vremena" sada prikazuju samo proizvodne radnike — administratori i rukovodstvo se više ne pojavljuju u listi.',
        en: 'The Worker Hours and Work Efficiency tabs now show only production workers — administrators and management no longer appear in the list.',
      },
    ],
  },
  {
    id: '2026-05-26-new-reports-and-shift-config',
    date: '2026-05-26',
    title: {
      sr: 'Tri nove analize na stranici Vremena procesa + podešavanja smena',
      en: 'Three new analyses on the Process Times page + shift settings',
    },
    bullets: [
      {
        sr: 'Nova kartica "Blokade po procesu" — pregled svih blokada po procesu sa prosečnim trajanjem u radnim satima (pauze i vikend se ne računaju).',
        en: 'New "Blocks per Process" tab — overview of all blocks per process with average duration in working hours (breaks and weekends excluded).',
      },
      {
        sr: 'Nova kartica "Trajanje izrade proizvoda" — vreme po procesu i pauze između procesa za svaku završenu narudžbinu, sa najzastupljenijom težinom.',
        en: 'New "Product Manufacturing Time" tab — per-process duration and inter-process gaps for each completed order, with the most common complexity.',
      },
      {
        sr: 'Nova kartica "Efikasnost radnog vremena" — po radniku i danu prikazuje pravo vreme rada, vreme aktivno na procesima, pauze i procenat efikasnosti (sa bojama: zeleno ≥80%, žuto 60–79%, crveno <60%).',
        en: 'New "Work Efficiency" tab — per worker and day, shows worked time, active-on-process time, breaks, and efficiency percentage (with color coding: green ≥80%, yellow 60–79%, red <60%).',
      },
      {
        sr: 'Smene (Admin → Smene) sada imaju nova podešavanja: trajanje pauze, maksimalno prekovremeno, automatska odjava i alarm pre odjave.',
        en: 'Shifts (Admin → Shifts) now have new settings: break duration, max overtime, auto-logout, and pre-logout alarm.',
      },
      {
        sr: 'Ako radnik zaboravi da se odjavi, sistem više ne računa višednevne sesije kao stvarno radno vreme — automatski se ograničava na trajanje smene + dozvoljeno prekovremeno.',
        en: 'If a worker forgets to check out, the system no longer counts multi-day sessions as actual work time — automatically capped at shift duration + allowed overtime.',
      },
      {
        sr: 'Tablet pokazuje upozorenje pred kraj smene da radnik ne zaboravi da se odjavi.',
        en: 'Tablet shows a warning near end of shift so the worker remembers to check out.',
      },
      {
        sr: 'Trend grafikon: ispravljene vrednosti MIN/MAX (sada se računaju isto kao u tabeli Vremena) i automatski se otvara sa prvim procesom + srednjom težinom umesto praznog izbora. Dodat izbor perioda (mesec / 3 meseca / 6 meseci / godina).',
        en: 'Trend chart: MIN/MAX values fixed (now computed the same way as in the Times table) and opens automatically with the first process + medium complexity instead of an empty selection. Added period selector (month / 3 months / 6 months / year).',
      },
    ],
  },
  {
    id: '2026-05-24-bugfixes-trend-and-ordertype',
    date: '2026-05-24',
    title: {
      sr: 'Ispravke: zelena zona na Trend grafikonu + Tip narudžbine u tabeli Praćenje vremena',
      en: 'Fixes: green zone on Trend chart + Order type in Time Tracking table',
    },
    bullets: [
      {
        sr: 'Zelena zona MIN/MAX se sada pravilno crta na grafikonu Trend prosečnog vremena (ranije nije bila vidljiva).',
        en: 'The MIN/MAX green zone now renders correctly on the Average Time Trend chart (previously invisible).',
      },
      {
        sr: 'Kolona Tip narudžbine u tabeli Praćenje vremena sada prikazuje ime koje ste podesili u Administracija → Tipovi narudžbina (ranije se ne prenosilo ispravno).',
        en: 'The Order Type column in the Time Tracking table now shows the name you configured in Administration → Order Types (previously not transferring correctly).',
      },
    ],
  },
  {
    id: '2026-05-24-docs-and-meta',
    date: '2026-05-24',
    title: {
      sr: 'Uputstvo dopunjeno + oznaka poslednje izmene',
      en: 'Tutorial updated + last-updated marker',
    },
    bullets: [
      {
        sr: 'Sekcija "Vremena procesa" u Uputstvu prepisana — sada pokriva sve nove izveštaje i grafikone (Realni prosek, St. devijacija, Trend, Analiza kašnjenja, Napredak aktivnih narudžbina, Uključi/Isključi prekidač sa server-side čuvanjem, drill-down pod-procesa, dvosheet XLSX izvoz).',
        en: 'The "Process times" section of the Tutorial was rewritten — now covers all the new reports and charts (Trimmed mean, Std. deviation, Trend, Delivery compliance, Active orders funnel, Include/Exclude switch with server-side persistence, sub-process drill-down, two-sheet XLSX export).',
      },
      {
        sr: 'Strana "Šta je novo" sada prikazuje datum poslednje izmene u zaglavlju — odmah znate koliko je sadržaj svež.',
        en: 'The "What\'s new" page now shows the last-updated date in the header — you immediately see how fresh the content is.',
      },
    ],
  },
  {
    id: '2026-05-24-polish',
    date: '2026-05-24',
    title: {
      sr: 'Tehničke ispravke i stabilnost',
      en: 'Polish and stability fixes',
    },
    bullets: [
      {
        sr: 'Uključi/Isključi prekidač na Praćenje vremena prikazuje znak učitavanja dok se promena čuva.',
        en: 'The Include/Exclude switch on Time Tracking now shows a loading spinner while the change is being saved.',
      },
      {
        sr: 'Greška se javlja ako čuvanje stanja prekidača ne uspe (umesto tihog vraćanja u prethodno stanje).',
        en: 'An error is shown if the save fails (instead of silently reverting).',
      },
    ],
  },
  {
    id: '2026-05-23-charts',
    date: '2026-05-23',
    title: {
      sr: 'Dva nova grafikona na strani Vremena procesa',
      en: 'Two new charts on the Process Times page',
    },
    bullets: [
      {
        sr: 'Trend prosečnog vremena po nedelji — sa filterima Proces, Kompleksnost i Granul (nedelja/mesec). Zelena zona pokazuje MIN/MAX po periodu, plava linija Realni prosek, crvena isprekidana ciljnu vrednost (85% Realnog proseka za ceo period).',
        en: 'Weekly average trend — with Process, Complexity and Granularity (week/month) filters. Green band shows MIN/MAX per period, blue line shows Trimmed mean, red dashed line shows the target (85% of trimmed mean across the whole period).',
      },
      {
        sr: 'Napredak aktivnih narudžbina — broj narudžbina po procesu, podeljeno na "U toku" (plavo), "Spreman za izvršavanje" (sivo) i "Blokirano" (crveno). Filteri: Tip narudžbine i Kompleksnost.',
        en: 'Active orders funnel — orders per process split into "In progress" (blue), "Ready to start" (gray) and "Blocked" (red). Filters: Order type and Complexity.',
      },
    ],
  },
  {
    id: '2026-05-22-reports-feedback',
    date: '2026-05-22',
    title: {
      sr: 'Ispravke na izveštajima prema vašem feedback-u',
      en: 'Reports fixes based on your feedback',
    },
    bullets: [
      {
        sr: 'MIN i MAX se sada računaju po formuli iz Excel-a — ekstremne vrednosti se odbacuju (npr. zaboravljen proces od 48 sati više ne pravi pogrešan MAX).',
        en: 'MIN and MAX now follow the Excel formula — extreme values are filtered out (e.g., an abandoned 48-hour process no longer skews the MAX).',
      },
      {
        sr: 'Vreme procesa sa pod-procesima sada je zbir vremena pod-procesa, umesto ukupnog vremena od početka do kraja koje je uračunavalo i prazne periode bez aktivnosti.',
        en: 'Process time for processes with sub-processes is now the sum of sub-process times, instead of total start-to-end time that included idle periods.',
      },
      {
        sr: 'Uključi/Isključi prekidač se sada čuva u bazi — utiče i na statistike na strani Vremena procesa i na izvoz, i preživljava refresh / promenu uređaja.',
        en: 'The Include/Exclude switch is now saved server-side — it affects statistics on the Process Times page and the export, and survives page refresh / device change.',
      },
      {
        sr: 'Tip narudžbine se sada čita iz vaše Admin → Tipovi narudžbine konfiguracije. Promena imena se pojavi svuda nakon refresh-a.',
        en: 'Order type now reads from your Admin → Order Types configuration. Renaming a type takes effect everywhere after a refresh.',
      },
      {
        sr: 'Boldirani ramovi oko grupa Teško / Srednje / Lako u tabeli — lakše praćenje podataka.',
        en: 'Bold borders frame the Heavy / Medium / Light column groups in the table — easier to scan.',
      },
      {
        sr: 'Novi grafikon: Analiza kašnjenja i poštovanja rokova (% narudžbina na vreme vs % koje kasne, po nedelji ili mesecu).',
        en: 'New chart: Delivery compliance & delay analysis (% of orders on time vs late, weekly or monthly).',
      },
    ],
  },
  {
    id: '2026-05-20-reports-rework',
    date: '2026-05-20',
    title: {
      sr: 'Prerada strane Vremena procesa',
      en: 'Process Times page rework',
    },
    bullets: [
      {
        sr: 'Tabela sa svim metrikama po kompleksnosti: Prosek, min, max, Realni prosek (skraćeni prosek), Standardna devijacija.',
        en: 'Table now shows all metrics per complexity: Average, min, max, Trimmed mean, Standard deviation.',
      },
      {
        sr: 'Pod-procesi su sada vidljivi klikom na strelicu pored reda u Praćenje vremena tabu.',
        en: 'Sub-processes are now visible by clicking the arrow next to each row in the Time Tracking tab.',
      },
      {
        sr: 'Filteri po datumu, kategoriji proizvoda i tipu narudžbine na obe tabele.',
        en: 'Date, product category and order type filters on both tables.',
      },
      {
        sr: 'Izvoz u XLSX sada koristi dva sheet-a (glavni + pod-procesi), CSV koristi jedan fajl sa kolonom "Tip reda".',
        en: 'XLSX export now uses two sheets (main + sub-processes); CSV uses a single file with a "Row type" column.',
      },
    ],
  },
  {
    id: '2026-05-18-security',
    date: '2026-05-18',
    title: {
      sr: 'Sigurnosna poboljšanja',
      en: 'Security improvements',
    },
    bullets: [
      {
        sr: 'Sprečeno brisanje poslednjeg Admin korisnika — firma ne može da ostane bez administratora.',
        en: 'Blocked deletion of the last Admin in a company — a company can never end up without an administrator.',
      },
      {
        sr: 'Promena uloge korisnika sada zahteva SuperAdmin pravo.',
        en: 'Changing a user role now requires SuperAdmin privileges.',
      },
      {
        sr: 'Prilikom promene uloge korisnika, njegove postojeće sesije se odjavljuju — stara prava ne mogu da nastave da važe.',
        en: 'When a user\'s role changes, their existing sessions are signed out — old privileges cannot remain in effect.',
      },
    ],
  },
  {
    id: '2026-05-16-performance',
    date: '2026-05-16',
    title: {
      sr: 'Optimizacije performansi',
      en: 'Performance improvements',
    },
    bullets: [
      {
        sr: 'Master pregled narudžbina značajno brži za firme sa puno aktivnih narudžbina.',
        en: 'The orders master view is significantly faster for companies with lots of active orders.',
      },
      {
        sr: 'Tablet ekrani (lista aktivnih + queue) brže učitavaju.',
        en: 'Tablet screens (active list + queue) load faster.',
      },
      {
        sr: 'Pauza stanice na tabletu sada pravilno čuva stanje pod-procesa pri odjavi i nastavlja pri sledećoj prijavi.',
        en: 'Station pause on the tablet now properly saves sub-process state on logout and resumes on the next login.',
      },
    ],
  },
  {
    id: '2026-05-15-infra',
    date: '2026-05-15',
    title: {
      sr: 'Infrastruktura',
      en: 'Infrastructure',
    },
    bullets: [
      {
        sr: 'Automatsko praćenje rada sistema — administratori i tehnička podrška vide da li sistem radi pre nego što korisnici primete problem.',
        en: 'Automatic system health monitoring — administrators and support can detect issues before users notice them.',
      },
      {
        sr: 'Svaka promena u sistemu (ko je kreirao, ko je poslednji menjao, kada) sada se automatski beleži — kompletna istorija izmena za sve podatke.',
        en: 'Every change (created by, last edited by, when) is now recorded automatically — full change history across all data.',
      },
    ],
  },
];

/** First N entries — what the page shows expanded by default. */
export const DEFAULT_VISIBLE_COUNT = 5;
