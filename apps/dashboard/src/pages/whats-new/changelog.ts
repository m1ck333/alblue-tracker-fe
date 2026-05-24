/**
 * Source of truth for the in-app "Šta je novo" page. User-facing — keep
 * the language concrete and focused on what Sale/Bojan can SEE / DO
 * differently after the change. Skip BE-only / dev-facing churn (those
 * belong in repo-root CHANGELOG.md).
 *
 * Entries are newest-first. The page shows the first 5 expanded by
 * default; the rest are behind a "Stariji unosi" toggle. No automatic
 * "unread" tracking yet — add localStorage-based badge later if needed.
 *
 * To add an entry: prepend to the array. Write both sr + en — Serbian
 * is the production language, English keeps parity for new/easy-mes
 * tenants and for screenshots / docs.
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
    id: '2026-05-24-polish',
    date: '2026-05-24',
    title: {
      sr: 'Tehničke ispravke i stabilnost',
      en: 'Polish and stability fixes',
    },
    bullets: [
      {
        sr: 'Uključi/Isključi prekidač na Praćenje vremena prikazuje znak učitavanja dok BE potvrđuje promenu.',
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
        sr: 'MIN i MAX se sada računaju po formuli iz Excel-a — vrednosti van μ±σ prozora se isključuju (npr. zaboravljen proces od 48 sati više ne pravi pogrešan MAX).',
        en: 'MIN and MAX now follow the Excel formula — values outside the μ±σ window are excluded (e.g., an abandoned 48-hour process no longer skews the MAX).',
      },
      {
        sr: 'Vreme procesa sa pod-procesima sada je zbir vremena pod-procesa, umesto wall-clock vremena koje je uračunavalo prazne periode između aktivnosti.',
        en: 'Process time for processes with sub-processes is now the sum of sub-process times, instead of wall-clock time that counted idle gaps between activities.',
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
        sr: 'Sprečeno brisanje poslednjeg Admin korisnika — tenant ne može da ostane bez administratora.',
        en: 'Blocked deletion of the last Admin in a tenant — a tenant can never end up without an administrator.',
      },
      {
        sr: 'Promena uloge korisnika sada zahteva SuperAdmin pravo.',
        en: 'Changing a user role now requires SuperAdmin privileges.',
      },
      {
        sr: 'Refresh tokeni se poništavaju pri promeni uloge — stari token sa starim pravima ne može da nastavi posle promene.',
        en: 'Refresh tokens are revoked on role change — an old token with old privileges cannot continue after a change.',
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
        sr: 'Master pregled narudžbina značajno brži za velike tenant-e (eliminisano N+1 učitavanje).',
        en: 'Master view of orders is significantly faster for large tenants (eliminated N+1 query loading).',
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
        sr: 'Server sada izlaže /api/health/live i /api/health/ready endpointe — monitoring može da detektuje pad pre nego što korisnici primete.',
        en: 'The server now exposes /api/health/live and /api/health/ready endpoints — monitoring can detect outages before users notice.',
      },
      {
        sr: 'Svaka tabela automatski beleži CreatedAt / UpdatedAt / autora promene — kompletan audit trail.',
        en: 'Every table automatically records CreatedAt / UpdatedAt / change author — complete audit trail.',
      },
    ],
  },
];

/** First N entries — what the page shows expanded by default. */
export const DEFAULT_VISIBLE_COUNT = 5;
