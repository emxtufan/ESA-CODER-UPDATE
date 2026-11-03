/**
 * Seed pentru catalogul de servicii (categoriile A–L, serviciile și pachetele din
 * `docs/legal-oferte-spec.md`). Idempotent: inserează doar ce lipsește (după `code` /
 * `name`). Prețurile recomandate (în lei) se scriu la inserare, iar înregistrările rămase
 * fără preț primesc valoarea din seed; prețurile deja setate nu se ating.
 */
import { eq, inArray } from "drizzle-orm";

import type { Currency } from "../../../shared/enums";
import type { Billing, LineStatus } from "../../../shared/offers";
import type { Db } from "../../db/client";
import {
  catalogCategories,
  catalogPackageItems,
  catalogPackages,
  catalogServices,
} from "../../db/schema/legal";

export interface SeedCategory {
  code: string;
  name: string;
  note: string;
}

export interface SeedService {
  code: string;
  category: string;
  name: string;
  shortDescription: string;
  description: string;
  deliverables: string;
  acceptance: string;
  unit: string;
  billing: Billing;
  defaultStatus: Extract<LineStatus, "accepted" | "optional" | "client_direct">;
  advanced: boolean;
}

export interface SeedPackage {
  name: string;
  description: string;
  billing: Billing;
  /** Preț recomandat în lei (întregi); în DB se stochează în bani (lei × 100). */
  price: number;
  codes: string[];
}

export const CATEGORIES: SeedCategory[] = [
  { code: "A", name: "Consultanță, strategie și design", note: "" },
  { code: "B", name: "Website-uri și dezvoltare web", note: "" },
  { code: "C", name: "Panouri de administrare și conținut", note: "" },
  {
    code: "D",
    name: "Soluții pentru grădinițe și instituții educaționale",
    note: "D08–D12 sunt dezvoltări avansate, ofertate separat. Implică date personale și, posibil, date ale minorilor; necesită analiză GDPR, control de acces, protecție a datelor, reguli de retenție și cerințe funcționale aprobate înainte de contractare. Nu se includ implicit în pachete.",
  },
  { code: "E", name: "Formulare, automatizări și integrări", note: "" },
  {
    code: "F",
    name: "SEO, performanță și analiză trafic",
    note: "Optimizările SEO nu garantează poziții, trafic sau rezultate comerciale specifice.",
  },
  {
    code: "G",
    name: "Marketing digital și publicitate",
    note: "Onorariile pentru configurarea și administrarea campaniilor sunt separate de bugetele publicitare. Sumele cheltuite pe Meta, Google sau TikTok sunt achitate de beneficiar direct platformelor, dacă nu se stabilește expres alt aranjament contractual.",
  },
  {
    code: "H",
    name: "Producție video și fotografie",
    note: "Pentru filmări și fotografii care implică minori, proiectul include verificarea drepturilor de utilizare a imaginii și a consimțămintelor necesare.",
  },
  { code: "I", name: "Magazine online și sisteme comerciale", note: "" },
  { code: "J", name: "Aplicații și automatizări avansate", note: "" },
  { code: "K", name: "Hosting, securitate, mentenanță și suport", note: "" },
  {
    code: "L",
    name: "Shopify: website-uri și magazine 100% custom",
    note: "Abonamentul Shopify, aplicațiile plătite și comisioanele de plată sunt contractate și plătite de beneficiar direct către Shopify și furnizorii aplicațiilor. Funcționalitățile depind de planul Shopify ales.",
  },
];

/** Servicii lunare (frecvență „lunar” în spec): unitatea „lună”. */
const MONTHLY = new Set(["G02", "G06", "G10", "G11", "H04", "K04", "K07", "L11", "L13"]);
/** Servicii livrate ca proiect, nu ca prestație punctuală. */
const PROJECT = new Set([
  "A04", "A05", "A06", "B01", "B02", "B03", "B04", "B10", "B11", "B15", "C01", "D08", "H01", "H02", "H05",
  "I01", "I04", "I07", "J01", "J02", "J03", "J04", "J05", "J06", "J08", "L01", "L02", "L03", "L09",
]);
const CLIENT_DIRECT = new Set(["G13", "L13"]);

/** Descriere scurtă (~90 caractere), tăiată la o limită naturală de frază. */
export function shortOf(description: string): string {
  const text = description.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (text.length <= 90) return text;
  const head = text.slice(0, 90);
  let cut = -1;
  for (const sep of [", ", " cu ", " pentru ", " prin ", " și ", " în ", " de "]) {
    const at = head.lastIndexOf(sep);
    if (at > 35) cut = Math.max(cut, at);
  }
  if (cut < 0) cut = head.lastIndexOf(" ");
  return head.slice(0, cut).replace(/[,;]$/, "");
}

/** Tuplu: cod, denumire, descriere, livrabile, criterii de acceptare. */
type Row = [code: string, name: string, description: string, deliverables: string, acceptance: string];

const ROWS: Row[] = [
  // --- A ---
  ["A01", "Audit profesional website", "Analiza unui website existent pentru identificarea problemelor de design, navigare, performanță, accesibilitate și conversie, însoțită de recomandări prioritizate.", "Raport de audit cu problemele identificate și recomandări prioritizate.", "Raportul a fost predat și prezentat Beneficiarului, iar recomandările sunt clar prioritizate."],
  ["A02", "Consultanță pentru digitalizarea afacerii", "Identificarea proceselor care pot fi digitalizate și propunerea unor soluții software potrivite activității beneficiarului.", "Document de recomandări cu procesele analizate și soluțiile propuse.", "Documentul a fost predat și discutat cu Beneficiarul într-o sesiune de prezentare."],
  ["A03", "Strategie de prezență online", "Definirea structurii și obiectivelor prezenței digitale, a publicului vizat și a canalelor de comunicare.", "Document de strategie cu obiective, public-țintă și canale de comunicare.", "Strategia a fost predată în scris și validată de Beneficiar."],
  ["A04", "Design UI/UX personalizat", "Realizarea interfețelor și a fluxurilor de navigare orientate spre claritate, accesibilitate și experiența utilizatorului.", "Machete ale interfeței pentru paginile convenite și fluxurile de navigare aferente.", "Machetele au fost prezentate și aprobate de Beneficiar, cu numărul de revizii prevăzut în contract."],
  ["A05", "Wireframe și prototip website", "Elaborarea structurii vizuale a paginilor și, după caz, a unui prototip interactiv pentru validarea designului înainte de dezvoltare.", "Wireframe-uri ale paginilor convenite și, după caz, un prototip interactiv.", "Structura paginilor a fost aprobată de Beneficiar înainte de începerea dezvoltării."],
  ["A06", "Identitate vizuală digitală", "Stabilirea elementelor grafice digitale, precum paleta cromatică, tipografia, butoanele și regulile de prezentare.", "Set de elemente grafice digitale: paletă cromatică, tipografie, stiluri de butoane și reguli de utilizare.", "Elementele grafice au fost prezentate și aprobate de Beneficiar."],
  ["A07", "Design de materiale publicitare", "Crearea de bannere, machete pentru rețele sociale și alte materiale grafice destinate promovării.", "Materialele grafice convenite, în formatele necesare publicării.", "Materialele au fost predate în formatele convenite și aprobate de Beneficiar."],
  ["A08", "Copywriting pentru website", "Redactarea sau reorganizarea textelor comerciale pentru prezentarea serviciilor, beneficiilor și apelurilor la acțiune.", "Textele paginilor convenite, redactate sau reorganizate pe baza informațiilor furnizate de Beneficiar.", "Textele au fost predate și aprobate de Beneficiar, în limita reviziilor prevăzute."],
  // --- B ---
  ["B01", "Redesign complet website", "Reconstruirea vizuală și funcțională a unui website existent, cu structură modernă, navigare optimizată și adaptare la dispozitive mobile.", "Website reconstruit, publicat sau predat pentru publicare, cu structura și funcțiile convenite.", "Paginile și funcțiile convenite funcționează conform specificațiilor, pe browserele și dispozitivele uzuale."],
  ["B02", "Website de prezentare", "Dezvoltarea unui site cu pagini dedicate companiei, serviciilor, portofoliului și modalităților de contact.", "Website de prezentare cu paginile convenite, gata de publicare.", "Paginile convenite sunt funcționale și conțin informațiile furnizate de Beneficiar."],
  ["B03", "Website multipagină personalizat", "Dezvoltarea unui website cu structură extinsă, secțiuni multiple și funcționalități adaptate activității beneficiarului.", "Website multipagină cu secțiunile și funcționalitățile convenite.", "Secțiunile și funcționalitățile din specificații sunt implementate și funcționează corect."],
  ["B04", "Landing page profesional", "Crearea unei pagini orientate către un obiectiv comercial specific, precum solicitarea unei oferte, rezervarea unei vizite sau înscrierea.", "O pagină de aterizare cu structura, mesajul și apelul la acțiune convenite.", "Pagina este publicată sau predată, iar formularul și butoanele de acțiune funcționează."],
  ["B05", "Pagină web suplimentară", "Proiectarea și implementarea unei pagini noi în website-ul existent.", "Pagina nouă, integrată în structura și navigarea site-ului existent.", "Pagina este afișată corect, este accesibilă din navigare și conține conținutul furnizat."],
  ["B06", "Design responsive", "Adaptarea interfeței pentru telefoane, tablete, laptopuri și desktop.", "Interfață adaptată pentru principalele dimensiuni de ecran.", "Paginile se afișează și funcționează corect pe telefon, tabletă și desktop, în browserele uzuale."],
  ["B07", "Secțiune Hero personalizată", "Realizarea zonei principale a paginii de start, cu titlu, mesaj comercial, elemente vizuale și butoane de acțiune.", "Secțiunea principală a paginii de start, cu titlu, mesaj, elemente vizuale și butoane.", "Secțiunea este afișată conform machetei aprobate și butoanele trimit către paginile corecte."],
  ["B08", "Header și meniu de navigare", "Implementarea unei zone de navigare clare, cu logo, pagini principale, submeniuri și acces rapid către contact.", "Antet cu logo și meniu de navigare, inclusiv submeniuri și acces către contact.", "Toate legăturile din meniu funcționează, iar meniul este utilizabil pe dispozitive mobile."],
  ["B09", "Footer profesional personalizat", "Dezvoltarea secțiunii inferioare cu informații juridice, contact, linkuri utile și elemente de identitate vizuală.", "Secțiune de subsol cu informații juridice, date de contact și legături utile.", "Subsolul apare pe paginile convenite, iar informațiile și legăturile sunt corecte."],
  ["B10", "Website multilingv", "Implementarea posibilității de prezentare a conținutului în mai multe limbi, cu traducerile furnizate sau contractate separat.", "Mecanism de comutare între limbile convenite și structura de conținut multilingv.", "Utilizatorul poate comuta între limbile convenite, iar conținutul furnizat se afișează corect în fiecare limbă."],
  ["B11", "Migrare website existent", "Transferarea structurii și a conținutului convenit către o nouă implementare, cu verificarea linkurilor și a funcționalităților.", "Conținutul convenit, transferat în noua implementare, și lista legăturilor verificate.", "Conținutul convenit este disponibil în noua implementare, iar legăturile și funcțiile verificate funcționează."],
  ["B12", "Optimizare accesibilitate website", "Îmbunătățirea navigării cu tastatura, a contrastului, a etichetelor și a structurii semantice, în limitele standardelor convenite.", "Îmbunătățiri de accesibilitate aplicate pe paginile convenite și lista modificărilor efectuate.", "Îmbunătățirile din lista convenită sunt aplicate și verificate pe paginile incluse."],
  ["B13", "Căutare internă website", "Integrarea unui sistem de căutare pentru articole, pagini, proiecte sau alte categorii de conținut.", "Funcție de căutare internă integrată în website pentru tipurile de conținut convenite.", "Căutarea returnează rezultate relevante din conținutul convenit."],
  ["B14", "Secțiune FAQ interactivă", "Implementarea unei zone cu întrebări frecvente, răspunsuri extensibile și posibilitatea actualizării acestora.", "Secțiune de întrebări frecvente cu răspunsuri extensibile, administrabilă conform specificațiilor.", "Întrebările și răspunsurile furnizate se afișează corect și se pot extinde și restrânge."],
  ["B15", "Website pentru instituții educaționale", "Dezvoltarea unui site pentru grădinițe, școli sau centre educaționale, cu prezentarea grupelor, programelor și activităților.", "Website cu secțiunile pentru grupe, programe și activități, conform specificațiilor.", "Secțiunile convenite sunt funcționale și conțin informațiile furnizate de instituție."],
  // --- C ---
  ["C01", "Panou de administrare CMS", "Construirea unui spațiu de administrare pentru actualizarea conținutului fără modificări directe în cod.", "Panou de administrare autentificat pentru modulele de conținut convenite.", "Beneficiarul poate adăuga și modifica conținutul modulelor convenite din panou, fără intervenții în cod."],
  ["C02", "Administrare pagini website", "Posibilitatea adăugării, editării, publicării și arhivării paginilor.", "Modul de administrare a paginilor: adăugare, editare, publicare și arhivare.", "Paginile se pot adăuga, edita, publica și arhiva din panou, iar modificările apar pe site."],
  ["C03", "Blog și articole", "Sistem pentru publicarea articolelor, știrilor și materialelor informative, cu imagini și categorii.", "Modul de articole cu imagini și categorii, cu pagini de listare și de detaliu.", "Un articol de test poate fi creat, încadrat într-o categorie și publicat pe site."],
  ["C04", "Portofoliu și proiecte", "Modul pentru prezentarea proiectelor finalizate, fiecare cu descriere, imagini și alte informații relevante.", "Modul de proiecte cu pagini de listare și de detaliu, administrabil din panou.", "Un proiect de test poate fi adăugat din panou și apare corect pe site."],
  ["C05", "Galerie foto administrabilă", "Sistem de încărcare, organizare și afișare a fotografiilor în albume sau categorii.", "Galerie foto cu încărcare, organizare pe albume sau categorii și afișare pe site.", "Fotografiile se pot încărca și organiza din panou și se afișează corect în galerie."],
  ["C06", "Galerie video", "Secțiune pentru organizarea și afișarea videoclipurilor de prezentare sau a materialelor media.", "Secțiune de videoclipuri cu organizare pe categorii sau albume.", "Videoclipurile adăugate se afișează și pot fi redate pe site."],
  ["C07", "Anunțuri importante", "Sistem de publicare a comunicatelor, informărilor urgente și anunțurilor cu perioadă de afișare.", "Modul de anunțuri cu perioadă de afișare, administrabil din panou.", "Un anunț de test apare pe site în perioada setată și dispare la expirarea acesteia."],
  ["C08", "Calendar de evenimente", "Modul de administrare și afișare a evenimentelor, activităților și datelor importante.", "Calendar de evenimente administrabil din panou, cu afișare pe site.", "Evenimentele adăugate din panou apar corect în calendar, la datele setate."],
  ["C09", "Administrare tarife și pachete", "Interfață pentru actualizarea prețurilor, serviciilor incluse și condițiilor de tarifare.", "Modul de administrare a tarifelor și pachetelor, cu afișare pe site.", "Modificările de tarife făcute din panou se reflectă corect pe site."],
  ["C10", "Management documente PDF", "Încărcarea și publicarea documentelor informative pentru descărcare.", "Modul de încărcare și publicare a documentelor PDF pentru descărcare.", "Un document încărcat din panou poate fi descărcat de pe site."],
  ["C11", "Roluri și permisiuni de administrare", "Configurarea drepturilor pentru administrator, editor și alți utilizatori autorizați.", "Roluri și permisiuni configurate pentru utilizatorii panoului de administrare.", "Fiecare rol are acces doar la funcțiile stabilite, verificat prin conturi de test."],
  ["C12", "Publicare programată de conținut", "Programarea publicării sau retragerii unor articole și anunțuri la date stabilite.", "Funcție de programare a publicării și retragerii pentru tipurile de conținut convenite.", "Un conținut programat apare și dispare automat la datele setate."],
  // --- D ---
  ["D01", "Prezentarea grupelor educaționale", "Pagini pentru fiecare grupă, cu intervale de vârstă, program și descrierea activităților.", "Pagini dedicate fiecărei grupe, cu vârstă, program și activități.", "Fiecare grupă convenită are pagina proprie, cu informațiile furnizate de instituție."],
  ["D02", "Modul activități educaționale", "Prezentarea programelor, atelierelor și activităților disponibile.", "Modul de prezentare a programelor, atelierelor și activităților, administrabil din panou.", "Activitățile adăugate din panou se afișează corect pe site."],
  ["D03", "Modul excursii și evenimente", "Publicarea excursiilor, vizitelor și activităților speciale, cu galerii și descrieri.", "Modul de excursii și evenimente, cu descrieri și galerii foto.", "O excursie de test poate fi publicată din panou, cu descriere și galerie, și apare corect pe site."],
  ["D04", "Calendar educațional", "Afișarea zilelor speciale, evenimentelor și activităților planificate.", "Calendar educațional cu zilele speciale și activitățile planificate.", "Intrările adăugate din panou apar în calendar la datele corecte."],
  ["D05", "Meniu alimentar săptămânal", "Interfață de administrare și afișare a meniului alimentar actualizat periodic.", "Modul de administrare și afișare a meniului săptămânal.", "Meniul introdus din panou se afișează corect pe site pentru săptămâna aleasă."],
  ["D06", "Formular solicitare înscriere", "Colectarea solicitărilor inițiale de înscriere printr-un formular configurabil.", "Formular de solicitare a înscrierii, cu câmpurile convenite.", "Solicitările trimise prin formular ajung la destinatarii configurați."],
  ["D07", "Programare vizită la grădiniță", "Formular sau calendar prin care părinții pot solicita o vizită și primi confirmarea disponibilității.", "Formular sau calendar pentru solicitarea unei vizite, cu confirmare.", "O solicitare de test ajunge la destinatarii configurați și primește confirmare conform fluxului convenit."],
  ["D08", "Portal privat pentru părinți", "Spațiu securizat, cu autentificare individuală, pentru accesarea comunicărilor și informațiilor autorizate.", "Portal cu autentificare individuală și acces la informațiile autorizate, pe baza cerințelor aprobate.", "Funcțiile din cerințele aprobate sunt implementate, iar accesul este limitat conform drepturilor stabilite."],
  ["D09", "Modul notificări pentru părinți", "Transmiterea anunțurilor către destinatarii autorizați prin canale configurate.", "Modul de trimitere a anunțurilor către destinatarii autorizați, pe canalele convenite.", "O notificare de test ajunge doar la destinatarii autorizați, pe canalele configurate."],
  ["D10", "Jurnal de activități pentru copil", "Funcționalitate privată prin care personalul autorizat poate înregistra și comunica informații individuale către părinții corespunzători.", "Modul privat de înregistrare și transmitere a informațiilor individuale, pe baza cerințelor aprobate.", "Informațiile unui copil sunt vizibile doar personalului autorizat și părinților corespunzători."],
  ["D11", "Galerie foto privată pentru grupe", "Distribuirea controlată a fotografiilor, cu drepturi de acces și mecanisme de respectare a consimțămintelor necesare.", "Galerie privată pe grupe, cu drepturi de acces și evidența consimțămintelor, conform cerințelor aprobate.", "Fotografiile sunt accesibile doar utilizatorilor autorizați ai grupei respective."],
  ["D12", "Management cereri și documente pentru părinți", "Centralizarea solicitărilor și a documentelor transmise, cu acces restricționat.", "Modul de centralizare a cererilor și documentelor transmise, cu acces restricționat.", "Cererile și documentele sunt vizibile doar utilizatorilor autorizați, conform cerințelor aprobate."],
  // --- E ---
  ["E01", "Formular de contact profesional", "Formular cu validare, protecție antispam și transmiterea solicitărilor către adresele de e-mail configurate.", "Formular de contact cu validare și protecție antispam, conectat la adresele de e-mail configurate.", "Un mesaj de test trimis prin formular ajunge la adresele configurate."],
  ["E02", "Formular cerere de ofertă", "Colectarea informațiilor necesare pentru formularea unei propuneri comerciale.", "Formular de cerere de ofertă cu câmpurile convenite.", "Cererile trimise prin formular ajung la adresele configurate, cu toate câmpurile completate."],
  ["E03", "Formular de rezervare", "Sistem pentru solicitarea unei programări, cu date, intervale și confirmări configurabile.", "Formular de rezervare cu date, intervale și confirmări configurabile.", "O rezervare de test este înregistrată și confirmată conform fluxului convenit."],
  ["E04", "Notificări automate prin e-mail", "Trimiterea mesajelor de confirmare sau informare ca urmare a unor acțiuni definite.", "Mesaje automate de confirmare sau informare, pentru acțiunile convenite.", "Mesajele sunt trimise automat la declanșarea acțiunilor convenite."],
  ["E05", "Integrare WhatsApp Business", "Adăugarea canalelor de contact WhatsApp și, dacă este disponibil, conectarea unor automatizări prin soluții autorizate.", "Buton sau legătură de contact WhatsApp și, dacă este posibil, automatizările convenite.", "Canalul de contact WhatsApp funcționează, iar automatizările disponibile sunt configurate conform specificațiilor."],
  ["E06", "Integrare Facebook Page Feed", "Preluarea și afișarea postărilor publicate pe o pagină Facebook, în limitele API-ului, permisiunilor și politicilor Meta.", "Secțiune care afișează postările paginii Facebook, în limitele API-ului și permisiunilor Meta.", "Postările disponibile prin API se afișează pe site; integrarea depinde de permisiunile și politicile Meta."],
  ["E07", "Integrare Instagram", "Afișarea unui feed sau a unor materiale Instagram, în funcție de posibilitățile de integrare disponibile.", "Secțiune de afișare a materialelor Instagram, în limitele integrărilor disponibile.", "Materialele disponibile prin integrare se afișează pe site; funcționarea depinde de politicile platformei."],
  ["E08", "Integrare Google Maps", "Afișarea locației și facilitarea accesului la indicații de orientare.", "Hartă integrată cu locația Beneficiarului și acces la indicații de orientare.", "Harta afișează locația corectă și permite deschiderea indicațiilor de orientare."],
  ["E09", "Integrare newsletter", "Conectarea formularelor de abonare cu o platformă de e-mail marketing.", "Formular de abonare conectat la platforma de e-mail marketing aleasă.", "O abonare de test apare în lista platformei de e-mail marketing."],
  ["E10", "Integrare CRM", "Transmiterea solicitărilor și a datelor relevante către un sistem de management al relațiilor cu clienții.", "Integrare care transmite către CRM solicitările și datele convenite.", "O solicitare de test ajunge în sistemul CRM cu datele convenite."],
  ["E11", "Automatizări de fluxuri de lucru", "Conectarea unor formulare, notificări și aplicații pentru executarea automată a unor procese.", "Fluxuri automate configurate pentru procesele convenite.", "Fluxurile convenite se execută automat la declanșare, verificat prin scenarii de test."],
  ["E12", "Integrare API personalizată", "Conectarea website-ului sau aplicației la servicii externe care oferă interfețe API compatibile.", "Integrare cu serviciul extern convenit, prin interfața API pusă la dispoziție de furnizor.", "Schimbul de date convenit cu serviciul extern funcționează, în limitele API-ului furnizorului."],
  ["E13", "Asistent virtual pentru întrebări frecvente", "Implementarea unui asistent conversațional pentru informații generale despre servicii, program sau proceduri.", "Asistent conversațional configurat cu informațiile generale furnizate de Beneficiar.", "Asistentul răspunde la întrebările din setul convenit și indică limitele răspunsurilor sale."],
  ["E14", "Export de solicitări CSV/Excel", "Posibilitatea exportării datelor colectate în formate utilizabile pentru raportare și administrare.", "Funcție de export al solicitărilor colectate în format CSV sau Excel.", "Exportul generează un fișier care se deschide corect și conține datele colectate."],
  // --- F ---
  ["F01", "SEO tehnic website", "Optimizarea structurii paginilor, adreselor URL, indexabilității și principalelor elemente tehnice relevante pentru motoarele de căutare.", "Optimizări tehnice aplicate pe website și lista modificărilor efectuate.", "Optimizările din lista convenită sunt aplicate și verificate; nu se garantează poziționarea în rezultate."],
  ["F02", "SEO on-page", "Configurarea titlurilor, metadescrierilor, structurii headingurilor și a legăturilor interne pentru paginile convenite.", "Titluri, metadescrieri și structură de titluri configurate pentru paginile convenite.", "Elementele on-page sunt configurate pe paginile convenite; nu se garantează poziționarea în rezultate."],
  ["F03", "SEO local", "Optimizări pentru relevanța geografică a afacerii și a informațiilor de contact.", "Optimizări ale informațiilor de localizare și contact pe website, conform specificațiilor.", "Informațiile de localizare și contact sunt configurate corect; nu se garantează poziționarea în rezultate."],
  ["F04", "Audit SEO", "Analiza problemelor tehnice și de conținut, însoțită de recomandări de îmbunătățire.", "Raport de audit SEO cu problemele identificate și recomandări.", "Raportul a fost predat și prezentat Beneficiarului."],
  ["F05", "Optimizare viteză website", "Reducerea resurselor inutile și optimizarea încărcării paginilor, în funcție de infrastructura disponibilă.", "Optimizări de performanță aplicate și lista modificărilor efectuate.", "Optimizările convenite sunt aplicate; rezultatele depind de infrastructura și conținutul disponibile."],
  ["F06", "Configurare Google Analytics 4", "Instalarea și configurarea măsurării traficului și a evenimentelor relevante.", "Proprietate Google Analytics 4 conectată la website, cu evenimentele convenite.", "Datele de trafic și evenimentele convenite sunt înregistrate în Google Analytics."],
  ["F07", "Configurare Google Search Console", "Conectarea website-ului și verificarea principalelor informații disponibile despre indexare.", "Website verificat în Google Search Console și harta site-ului trimisă.", "Website-ul este verificat în Search Console, iar datele de indexare sunt accesibile."],
  ["F08", "Configurare Google Tag Manager", "Implementarea unei structuri de administrare a etichetelor de măsurare, în funcție de cerințele proiectului.", "Container Google Tag Manager instalat, cu etichetele convenite.", "Containerul este instalat, iar etichetele convenite se declanșează corect."],
  ["F09", "Integrare Meta Pixel", "Configurarea evenimentelor de măsurare pentru Facebook și Instagram, conform mecanismului de consimțământ aplicabil.", "Meta Pixel instalat, cu evenimentele convenite, condiționat de consimțământ.", "Evenimentele convenite sunt înregistrate în Meta Events Manager, după acordarea consimțământului."],
  ["F10", "Integrare TikTok Pixel", "Configurarea instrumentelor TikTok pentru măsurarea evenimentelor și rezultatelor campaniilor, cu respectarea consimțământului.", "TikTok Pixel instalat, cu evenimentele convenite, condiționat de consimțământ.", "Evenimentele convenite sunt înregistrate în TikTok Events Manager, după acordarea consimțământului."],
  ["F11", "Integrare Google Ads Tag", "Configurarea etichetelor pentru măsurarea conversiilor campaniilor Google Ads.", "Etichete Google Ads instalate pentru conversiile convenite.", "Conversiile convenite sunt înregistrate în contul Google Ads."],
  ["F12", "Administrare pixeli din CMS", "Interfață securizată pentru modificarea identificatorilor și a setărilor permise ale instrumentelor de măsurare.", "Secțiune în panou pentru modificarea identificatorilor instrumentelor de măsurare.", "Identificatorii modificați din panou sunt aplicați pe site, doar de utilizatorii autorizați."],
  ["F13", "Configurare cookie consent", "Implementarea mecanismului de consimțământ pentru cookies și tehnologii neesențiale, în funcție de configurația website-ului.", "Bară de consimțământ pentru cookie-uri, configurată pentru tehnologiile folosite pe website.", "Tehnologiile neesențiale se activează doar după acordarea consimțământului; textele juridice rămân în responsabilitatea Beneficiarului."],
  ["F14", "Date structurate Schema.org", "Adăugarea marcajelor structurate potrivite tipurilor de conținut disponibile.", "Marcaje Schema.org adăugate pentru tipurile de conținut convenite.", "Marcajele trec validarea instrumentelor de testare ale motoarelor de căutare; afișarea rezultatelor îmbogățite nu este garantată."],
  ["F15", "Sitemap XML și robots.txt", "Configurarea fișierelor care facilitează descoperirea paginilor și administrarea regulilor de acces pentru crawler-e.", "Fișierele sitemap.xml și robots.txt configurate și publicate.", "Fișierele sunt accesibile public și conțin paginile și regulile convenite."],
  ["F16", "Raport SEO și performanță", "Pregătirea unui raport cu indicatori de trafic, indexare, performanță și recomandări.", "Raport cu indicatori de trafic, indexare și performanță, plus recomandări.", "Raportul a fost predat pentru perioada convenită; indicatorii nu constituie o garanție de rezultate."],
  // --- G ---
  ["G01", "Configurare campanie Facebook Ads", "Pregătirea unei campanii Meta Ads, cu obiectiv, audiență, materiale și parametri conveniți.", "Campanie Meta Ads configurată, cu obiectiv, audiență, materiale și parametri conveniți.", "Campania este configurată și aprobată de Beneficiar înainte de lansare; rezultatele nu sunt garantate."],
  ["G02", "Administrare lunară Facebook Ads", "Monitorizarea, ajustarea și raportarea campaniilor publicitare active.", "Monitorizarea și ajustarea campaniilor active și raport lunar.", "Raportul lunar a fost transmis; rezultatele campaniilor nu sunt garantate."],
  ["G03", "Configurare campanie Instagram Ads", "Pregătirea campaniilor de promovare pe Instagram prin instrumentele Meta.", "Campanie de promovare pe Instagram configurată prin instrumentele Meta.", "Campania este configurată și aprobată de Beneficiar înainte de lansare; rezultatele nu sunt garantate."],
  ["G04", "Configurare Google Search Ads", "Crearea unei campanii de căutare cu grupuri de anunțuri, cuvinte-cheie și măsurarea conversiilor.", "Campanie Google Search cu grupuri de anunțuri, cuvinte-cheie și măsurarea conversiilor.", "Campania este configurată și aprobată de Beneficiar înainte de lansare; rezultatele nu sunt garantate."],
  ["G05", "Configurare Google Display Ads", "Pregătirea campaniilor vizuale în rețeaua de afișare Google.", "Campanie în rețeaua de afișare Google, cu materialele vizuale convenite.", "Campania este configurată și aprobată de Beneficiar înainte de lansare; rezultatele nu sunt garantate."],
  ["G06", "Administrare lunară Google Ads", "Monitorizarea bugetelor, termenilor de căutare, indicatorilor și optimizarea campaniilor.", "Monitorizarea și optimizarea campaniilor Google Ads și raport lunar.", "Raportul lunar a fost transmis; rezultatele campaniilor nu sunt garantate."],
  ["G07", "Configurare TikTok Ads", "Pregătirea campaniilor pentru platforma TikTok, conform instrumentelor și politicilor disponibile.", "Campanie TikTok configurată conform instrumentelor și politicilor platformei.", "Campania este configurată și aprobată de Beneficiar înainte de lansare; rezultatele nu sunt garantate."],
  ["G08", "Remarketing și retargeting", "Configurarea campaniilor către audiențe eligibile, pe baza datelor disponibile și a consimțământurilor necesare.", "Audiențe și campanii de remarketing configurate, în limita datelor și consimțământurilor disponibile.", "Audiențele și campaniile sunt configurate conform specificațiilor; rezultatele nu sunt garantate."],
  ["G09", "Strategie editorială social media", "Realizarea unui calendar orientativ de conținut și identificarea temelor relevante pentru publicul-țintă.", "Calendar orientativ de conținut și lista temelor propuse.", "Calendarul a fost predat și validat de Beneficiar."],
  ["G10", "Administrare pagină Facebook", "Publicarea și programarea conținutului convenit și administrarea activităților incluse în pachet.", "Publicarea și programarea conținutului convenit pe pagina Facebook, în fiecare lună.", "Conținutul convenit pentru luna respectivă a fost publicat; rezultatele nu sunt garantate."],
  ["G11", "Administrare cont Instagram", "Planificarea și publicarea materialelor convenite, cu monitorizarea principalelor rezultate.", "Planificarea și publicarea materialelor convenite pe contul Instagram, în fiecare lună.", "Materialele convenite pentru luna respectivă au fost publicate; rezultatele nu sunt garantate."],
  ["G12", "Raportare campanii publicitare", "Centralizarea cheltuielilor, rezultatelor și indicatorilor relevanți într-un raport periodic.", "Raport periodic cu cheltuielile, rezultatele și indicatorii relevanți.", "Raportul a fost transmis Beneficiarului la termenul convenit."],
  ["G13", "Buget publicitar (achitat direct de client)", "Sumele cheltuite pe Meta, Google sau TikTok, achitate de beneficiar direct platformelor.", "Nu se livrează un serviciu. Poziție informativă pentru bugetul achitat de Beneficiar direct platformelor.", "Nu se aplică recepție; suma nu intră în valoarea contractului și este achitată direct de Beneficiar."],
  // --- H ---
  ["H01", "Videoclip profesional de prezentare", "Producerea unui material video pentru prezentarea companiei, locației, serviciilor sau activităților.", "Un videoclip de prezentare, în formatul și durata convenite.", "Videoclipul a fost predat în formatul convenit și aprobat de Beneficiar, în limita reviziilor prevăzute."],
  ["H02", "Tur video al locației", "Realizarea unui videoclip de prezentare a spațiilor și facilităților.", "Un videoclip de prezentare a spațiilor și facilităților, în formatul convenit.", "Videoclipul a fost predat în formatul convenit și aprobat de Beneficiar."],
  ["H03", "Reel pentru Instagram și Facebook", "Montarea unui material video vertical, de durată scurtă, adaptat publicării pe rețelele sociale.", "Un material video vertical scurt, pregătit pentru publicare.", "Materialul a fost predat în format vertical și aprobat de Beneficiar."],
  ["H04", "Pachet lunar de reels", "Producerea unui număr convenit de videoclipuri verticale în fiecare perioadă contractuală.", "Numărul convenit de videoclipuri verticale, în fiecare lună.", "Numărul de videoclipuri convenit pentru luna respectivă a fost predat."],
  ["H05", "Video publicitar pentru campanii", "Realizarea unui material orientat către promovarea unui produs, serviciu sau eveniment.", "Un material video publicitar în formatul și durata convenite.", "Materialul a fost predat în formatul convenit și aprobat de Beneficiar; rezultatele campaniilor nu sunt garantate."],
  ["H06", "Filmare la locația clientului", "Captarea imaginilor video la locația beneficiarului, în intervalul de producție convenit.", "Materialul filmat brut la locația Beneficiarului, în intervalul de producție convenit.", "Filmarea a avut loc în intervalul stabilit, iar materialul brut a fost predat sau pus la dispoziția montajului."],
  ["H07", "Montaj video profesional", "Selectarea, organizarea și editarea materialelor video, cu tranziții, ajustări și export în formatul convenit.", "Materialul video montat și exportat în formatul convenit.", "Materialul montat a fost predat în formatul convenit și aprobat de Beneficiar, în limita reviziilor prevăzute."],
  ["H08", "Subtitrare videoclip", "Crearea și integrarea subtitrărilor pentru accesibilitate și vizionare fără sunet.", "Subtitrări create și integrate în videoclipurile convenite.", "Subtitrările sunt sincronizate cu materialul video și aprobate de Beneficiar."],
  ["H09", "Motion graphics și animații", "Realizarea unor animații grafice pentru titluri, informații, reclame și prezentări.", "Animațiile grafice convenite, exportate în formatul necesar.", "Animațiile au fost predate în formatul convenit și aprobate de Beneficiar."],
  ["H10", "Fotografie de prezentare", "Realizarea fotografiilor necesare prezentării digitale a spațiilor, activităților sau produselor.", "Setul de fotografii de prezentare, în numărul și rezoluția convenite.", "Fotografiile au fost predate în numărul și formatul convenite; pentru minori se verifică drepturile de utilizare a imaginii."],
  ["H11", "Editare și optimizare fotografii", "Corectarea și pregătirea imaginilor pentru utilizare pe website sau rețele sociale.", "Fotografii corectate și optimizate pentru utilizare online.", "Fotografiile editate au fost predate în formatele convenite pentru website sau rețele sociale."],
  // --- I ---
  ["I01", "Dezvoltare magazin online", "Implementarea unui website pentru prezentarea și comercializarea produselor.", "Magazin online cu funcțiile de prezentare și comandă convenite.", "Fluxul de la alegerea produsului până la plasarea comenzii funcționează conform specificațiilor."],
  ["I02", "Catalog online de produse", "Administrarea produselor, descrierilor, categoriilor, imaginilor și prețurilor.", "Modul de administrare a produselor, categoriilor, imaginilor și prețurilor.", "Un produs de test poate fi adăugat și modificat din panou și apare corect în magazin."],
  ["I03", "Integrare plăți online", "Conectarea unui procesator de plăți autorizat, conform condițiilor furnizorului.", "Procesator de plăți conectat la magazin, conform condițiilor furnizorului.", "O plată de test se finalizează conform fluxului procesatorului; comisioanele sunt stabilite de furnizor."],
  ["I04", "Sistem de rezervări online", "Configurarea unui flux de rezervare pentru servicii sau intervale disponibile.", "Flux de rezervare online pentru serviciile sau intervalele convenite.", "O rezervare de test este înregistrată și confirmată conform fluxului convenit."],
  ["I05", "Sistem de cupoane și promoții", "Administrarea reducerilor, codurilor promoționale și condițiilor de utilizare.", "Modul de administrare a cupoanelor, reducerilor și condițiilor de utilizare.", "Un cod promoțional de test se aplică corect conform condițiilor setate."],
  ["I06", "Integrare facturare electronică", "Conectarea cu un furnizor compatibil de facturare, în funcție de API și de fluxul beneficiarului.", "Integrare cu furnizorul de facturare convenit, în limitele API-ului acestuia.", "Datele convenite sunt transmise furnizorului de facturare, verificat pe o comandă de test."],
  ["I07", "Sistem de abonamente", "Gestionarea planurilor recurente și a perioadelor de acces sau facturare.", "Modul de gestionare a planurilor recurente și a perioadelor de acces sau facturare.", "Un abonament de test este creat, reînnoit și închis conform regulilor convenite."],
  ["I08", "Dashboard de vânzări", "Centralizarea comenzilor, veniturilor și principalilor indicatori comerciali.", "Panou cu comenzile, veniturile și indicatorii comerciali convenți.", "Indicatorii afișați corespund datelor din sistem, verificat prin comenzi de test."],
  // --- J ---
  ["J01", "Aplicație web personalizată", "Dezvoltarea unei aplicații accesibile din browser pentru gestionarea unui proces specific beneficiarului.", "Aplicație web cu funcțiile din specificațiile aprobate.", "Funcțiile din specificațiile aprobate sunt implementate și funcționează conform scenariilor de test convenite."],
  ["J02", "Dashboard administrativ personalizat", "Construirea unei interfețe cu indicatori, filtre, rapoarte și operațiuni de administrare.", "Interfață de administrare cu indicatorii, filtrele și rapoartele convenite.", "Indicatorii, filtrele și operațiunile convenite funcționează corect pe datele de test."],
  ["J03", "Generator automat de documente", "Sistem pentru completarea șabloanelor și generarea automată a documentelor pe baza datelor introduse.", "Sistem de generare a documentelor pe baza șabloanelor și datelor convenite.", "Documentele generate din date de test corespund șabloanelor aprobate."],
  ["J04", "Sistem de management al clienților", "Aplicație pentru evidența clienților, solicitărilor, proiectelor și interacțiunilor.", "Aplicație pentru evidența clienților, solicitărilor, proiectelor și interacțiunilor.", "Funcțiile de evidență din specificații sunt implementate și funcționează pe date de test."],
  ["J05", "Portal securizat pentru clienți", "Spațiu autentificat pentru accesarea documentelor, proiectelor și informațiilor autorizate.", "Portal autentificat cu acces la documentele și informațiile autorizate.", "Fiecare utilizator vede doar informațiile la care are dreptul, verificat prin conturi de test."],
  ["J06", "Management de proiecte", "Modul pentru organizarea sarcinilor, etapelor, responsabilităților și termenelor.", "Modul de organizare a sarcinilor, etapelor, responsabilităților și termenelor.", "Sarcinile, etapele și termenele pot fi create și urmărite conform specificațiilor."],
  ["J07", "Automatizare procese interne", "Implementarea unor fluxuri automate pentru operațiuni repetitive și transferul de informații.", "Fluxuri automate pentru procesele interne convenite.", "Fluxurile convenite se execută automat la declanșare, verificat prin scenarii de test."],
  ["J08", "Integrare AI într-o aplicație", "Adăugarea unor funcționalități bazate pe inteligență artificială, cu limite funcționale, costuri externe și măsuri de protecție a datelor definite.", "Funcționalitate bazată pe inteligență artificială, cu limitele, costurile externe și măsurile de protecție definite.", "Funcționalitatea îndeplinește scenariile de test convenite, în limitele definite; rezultatele AI nu sunt garantate."],
  ["J09", "Migrare și import de date", "Transferarea datelor între sisteme, cu validarea formatelor și verificarea integrității.", "Datele convenite, transferate între sisteme, și raportul de verificare.", "Datele convenite au fost transferate, iar verificarea integrității nu indică diferențe față de sursă."],
  ["J10", "Sistem de notificări și alerte", "Configurarea alertelor automate pentru evenimente, termene sau modificări importante.", "Alerte automate configurate pentru evenimentele și termenele convenite.", "O alertă de test este trimisă destinatarilor configurați la apariția evenimentului."],
  // --- K ---
  ["K01", "Configurare domeniu și DNS", "Asistență pentru conectarea domeniului și configurarea înregistrărilor necesare funcționării serviciilor.", "Domeniu conectat și înregistrări DNS configurate pentru serviciile convenite.", "Domeniul răspunde către serviciile configurate; accesul la contul de domeniu este asigurat de Beneficiar."],
  ["K02", "Configurare găzduire web", "Pregătirea mediului de hosting, a aplicației și a parametrilor tehnici de bază.", "Mediu de găzduire pregătit, cu aplicația instalată și parametrii tehnici de bază.", "Aplicația rulează în mediul de găzduire configurat."],
  ["K03", "Configurare HTTPS și certificat TLS", "Activarea conexiunilor securizate și verificarea configurării certificatului.", "Certificat TLS instalat și conexiuni HTTPS active.", "Website-ul se deschide prin HTTPS, fără avertismente de certificat."],
  ["K04", "Mentenanță lunară website", "Verificări și actualizări periodice în limitele abonamentului contractat.", "Verificări și actualizări periodice, în limitele abonamentului, în fiecare lună.", "Verificările și actualizările din abonament au fost efectuate pentru luna respectivă."],
  ["K05", "Actualizări tehnice și de securitate", "Aplicarea actualizărilor compatibile și remedierea problemelor identificate.", "Actualizări compatibile aplicate și problemele identificate remediate.", "Actualizările compatibile au fost aplicate, iar website-ul funcționează după actualizare."],
  ["K06", "Backup și restaurare", "Configurarea copiilor de siguranță și a procedurii de recuperare, conform perioadei de retenție convenite.", "Copii de siguranță programate și procedura de restaurare, conform retenției convenite.", "Copiile de siguranță se creează la intervalul convenit, iar procedura de restaurare a fost verificată."],
  ["K07", "Monitorizare disponibilitate website", "Verificarea automată a disponibilității și emiterea alertelor pentru întreruperile detectate.", "Monitorizare automată a disponibilității și alerte pentru întreruperile detectate.", "Monitorizarea este activă, iar alertele ajung la destinatarii configurați."],
  ["K08", "Asistență tehnică la cerere", "Intervenții pentru diagnosticarea și soluționarea problemelor raportate.", "Intervenții tehnice la cerere, cu raportarea orelor consumate.", "Intervențiile solicitate au fost efectuate, iar orele consumate au fost raportate Beneficiarului."],
  ["K09", "Modificări periodice de conținut", "Actualizarea textelor, imaginilor, tarifelor și informațiilor publicate.", "Modificările de conținut solicitate, publicate pe website.", "Modificările solicitate sunt publicate și verificate de Beneficiar."],
  ["K10", "Instruire utilizatori și administratori", "Sesiune de prezentare a panoului de administrare și a funcțiilor livrate.", "Sesiune de instruire privind panoul de administrare și funcțiile livrate.", "Sesiunea a avut loc, iar participanții au fost instruiți asupra funcțiilor principale."],
  ["K11", "Documentație tehnică și manual de utilizare", "Pregătirea instrucțiunilor necesare administrării funcționalităților contractate.", "Manual de utilizare și documentație tehnică pentru funcționalitățile contractate.", "Documentația a fost predată și acoperă funcționalitățile contractate."],
  ["K12", "Audit de securitate aplicativă", "Evaluarea controalelor de securitate agreate și formularea recomandărilor de remediere.", "Raport de evaluare a controalelor de securitate agreate, cu recomandări de remediere.", "Raportul a fost predat și prezentat Beneficiarului; nu constituie o garanție de securitate absolută."],
  // --- L ---
  ["L01", "Magazin online Shopify 100% custom", "Dezvoltarea unui magazin pe Shopify cu design și temă construite de la zero, fără teme predefinite, adaptate identității vizuale și fluxului de vânzare al beneficiarului.", "Magazin Shopify cu design și temă construite de la zero, conform identității vizuale a Beneficiarului.", "Fluxul de la alegerea produsului până la comandă funcționează conform specificațiilor, în limitele planului Shopify ales."],
  ["L02", "Website de prezentare pe Shopify", "Site de prezentare sau de brand pe platforma Shopify, cu design personalizat și pagini administrabile din editorul Shopify.", "Site de prezentare pe Shopify, cu design personalizat și pagini administrabile din editor.", "Paginile convenite sunt funcționale și pot fi modificate din editorul Shopify."],
  ["L03", "Temă Shopify custom (Online Store 2.0)", "Dezvoltarea unei teme proprii în Liquid, cu secțiuni și blocuri configurabile din editorul de teme, optimizată pentru viteză și dispozitive mobile.", "Temă proprie Online Store 2.0, cu secțiuni și blocuri configurabile din editorul de teme.", "Tema este instalată, secțiunile se pot configura din editor, iar afișarea este corectă pe dispozitive mobile."],
  ["L04", "Secțiuni și componente Shopify personalizate", "Secțiuni noi (landing, colecții, produse, bundle-uri) adăugate unei teme existente, editabile din editorul de teme.", "Secțiunile personalizate convenite, adăugate temei existente și editabile din editorul de teme.", "Secțiunile sunt disponibile în editorul de teme și se afișează corect pe paginile convenite."],
  ["L05", "Pagini de produs și colecții personalizate", "Template-uri dedicate pentru produse, colecții și landing page-uri, cu câmpuri personalizate (metafields și metaobjects).", "Template-uri personalizate pentru produse, colecții și pagini de aterizare, cu câmpurile personalizate convenite.", "Template-urile se aplică produselor și colecțiilor alese, iar câmpurile personalizate se afișează corect."],
  ["L06", "Migrare pe Shopify", "Transferul produselor, clienților, comenzilor convenite, conținutului și redirecționărilor de pe altă platformă (WooCommerce, PrestaShop sau alta).", "Datele convenite, transferate pe Shopify, și lista redirecționărilor configurate.", "Datele convenite sunt disponibile în Shopify, iar un eșantion verificat împreună cu Beneficiarul este corect."],
  ["L07", "Configurare magazin Shopify", "Configurarea plăților, livrărilor, taxelor, domeniului, notificărilor și politicilor magazinului.", "Magazin configurat: plăți, livrări, taxe, domeniu, notificări și politici.", "Setările convenite sunt aplicate, verificate printr-o comandă de test."],
  ["L08", "Integrări și aplicații Shopify", "Configurarea aplicațiilor din Shopify App Store sau integrări prin API cu ERP, curierat, facturare sau marketplace-uri.", "Aplicațiile și integrările convenite, configurate și conectate la magazin.", "Integrările convenite funcționează, verificat pe o comandă de test; costurile aplicațiilor plătite nu sunt incluse."],
  ["L09", "Aplicație Shopify personalizată", "Dezvoltarea unei aplicații custom pentru funcționalități care nu există în aplicațiile disponibile.", "Aplicație Shopify cu funcțiile din specificațiile aprobate.", "Funcțiile din specificațiile aprobate sunt implementate și funcționează în magazinul de test."],
  ["L10", "Personalizare checkout Shopify", "Personalizări ale procesului de checkout, în limitele permise de planul Shopify al beneficiarului.", "Personalizările de checkout convenite, în limitele permise de planul Shopify.", "Personalizările permise de plan sunt aplicate și verificate printr-o comandă de test."],
  ["L11", "Mentenanță magazin Shopify", "Actualizări ale temei, suport, modificări de conținut și monitorizarea aplicațiilor, lunar.", "Actualizări ale temei, suport, modificări de conținut și monitorizarea aplicațiilor, lunar.", "Activitățile din abonament au fost efectuate pentru luna respectivă."],
  ["L12", "Instruire administrare Shopify", "Prezentarea panoului Shopify pentru produse, comenzi, stocuri și conținut.", "Sesiune de instruire privind administrarea produselor, comenzilor, stocurilor și conținutului.", "Sesiunea a avut loc, iar participanții au fost instruiți asupra funcțiilor principale."],
  ["L13", "Abonament Shopify și aplicații plătite", "Abonamentul platformei Shopify, aplicațiile plătite și comisioanele procesatorilor de plăți, achitate de beneficiar direct către Shopify și furnizori.", "Nu se livrează un serviciu. Poziție informativă pentru costurile achitate de Beneficiar direct către Shopify și furnizori.", "Nu se aplică recepție; sumele nu intră în valoarea contractului și sunt achitate direct de Beneficiar."],
];

export const SERVICES: SeedService[] = ROWS.map(([code, name, description, deliverables, acceptance]) => {
  const monthly = MONTHLY.has(code);
  return {
    code,
    category: code[0]!,
    name,
    shortDescription: shortOf(description),
    description,
    deliverables,
    acceptance,
    unit: monthly ? "lună" : code === "K08" ? "oră" : code === "B05" ? "pagină" : PROJECT.has(code) ? "proiect" : "serviciu",
    billing: monthly ? "monthly" : "one_time",
    defaultStatus: CLIENT_DIRECT.has(code)
      ? "client_direct"
      : code >= "D08" && code <= "D12"
        ? "optional"
        : "accepted",
    advanced: code >= "D08" && code <= "D12",
  };
});

/** Prețuri recomandate în lei (întregi); în DB: lei × 100, monedă RON. G13 și L13 lipsesc: se achită direct de client. */
export const PRICES: Record<string, number> = { A01: 990, A02: 1490, A03: 1990, A04: 1990, A05: 1490, A06: 2990, A07: 390, A08: 990, B01: 4490, B02: 2490, B03: 3490, B04: 1490, B05: 390, B06: 590, B07: 390, B08: 290, B09: 190, B10: 1490, B11: 1990, B12: 1190, B13: 790, B14: 290, B15: 4990, C01: 1490, C02: 590, C03: 790, C04: 690, C05: 490, C06: 390, C07: 390, C08: 690, C09: 490, C10: 490, C11: 890, C12: 390, D01: 490, D02: 590, D03: 590, D04: 590, D05: 390, D06: 490, D07: 490, D08: 6990, D09: 1490, D10: 1990, D11: 1290, D12: 1990, E01: 290, E02: 490, E03: 790, E04: 390, E05: 150, E06: 290, E07: 290, E08: 150, E09: 490, E10: 1490, E11: 1990, E12: 1990, E13: 1990, E14: 490, F01: 990, F02: 690, F03: 790, F04: 1190, F05: 790, F06: 390, F07: 250, F08: 390, F09: 290, F10: 290, F11: 290, F12: 590, F13: 390, F14: 490, F15: 190, F16: 490, G01: 990, G02: 1490, G03: 790, G04: 1290, G05: 990, G06: 1790, G07: 990, G08: 790, G09: 1490, G10: 1290, G11: 1290, G12: 390, H01: 2990, H02: 1990, H03: 450, H04: 1590, H05: 2490, H06: 990, H07: 590, H08: 190, H09: 1290, H10: 990, H11: 390, I01: 9990, I02: 2490, I03: 990, I04: 3990, I05: 790, I06: 1290, I07: 3490, I08: 1990, J01: 24990, J02: 9990, J03: 5990, J04: 12990, J05: 9990, J06: 11990, J07: 2990, J08: 5990, J09: 1990, J10: 1490, K01: 190, K02: 290, K03: 150, K04: 390, K05: 390, K06: 390, K07: 99, K08: 200, K09: 290, K10: 390, K11: 590, K12: 2490, L01: 12990, L02: 4990, L03: 7990, L04: 690, L05: 1490, L06: 2490, L07: 1490, L08: 990, L09: 9990, L10: 1990, L11: 790, L12: 490 };

export const PACKAGES: SeedPackage[] = [
  { name: "Website Start", description: "Website de prezentare de bază, responsive, cu formular de contact, hartă și optimizări SEO on-page.", billing: "one_time", price: 2490, codes: ["B04", "B06", "B07", "B08", "B09", "E01", "E05", "F02", "F13", "K01", "K03"] },
  { name: "Website Business", description: "Website multipagină cu panou de administrare, blog, formulare, măsurare și configurări tehnice de bază.", billing: "one_time", price: 4990, codes: ["B03", "A04", "B06", "B07", "B08", "B09", "C01", "C02", "E01", "E05", "F01", "F05", "F06", "F07", "F13", "F14", "F15", "K01", "K02", "K03"] },
  { name: "Website Premium", description: "Website extins, cu prototip, multilingv, căutare internă, portofoliu, galerie, roluri de administrare și documentație.", billing: "one_time", price: 9990, codes: ["B03", "A04", "B06", "B07", "B08", "B09", "C01", "C02", "E01", "E05", "F01", "F05", "F06", "F07", "F13", "F14", "F15", "K01", "K02", "K03", "A05", "C03", "C04", "C11", "E02", "E04", "E12", "F08", "K10", "K11"] },
  { name: "Website Educațional", description: "Website pentru grădinițe și instituții educaționale, cu module de grupe, activități, excursii, meniu și înscrieri.", billing: "one_time", price: 7990, codes: ["B15", "B06", "B07", "B08", "B09", "C01", "C03", "C04", "C05", "C07", "C08", "C09", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "E01", "E08", "F01", "F02", "F13", "F15"] },
  { name: "Redesign complet website", description: "Reconstruirea completă a unui website existent, cu panou de administrare, module de conținut, integrări și măsurare.", billing: "one_time", price: 5990, codes: ["B01", "B06", "B07", "B08", "B09", "C01", "C03", "C04", "C07", "C09", "D03", "E01", "E04", "E06", "F01", "F02", "F09", "F10", "F11", "F15"] },
  { name: "SEO și Analytics", description: "Optimizare tehnică și on-page, audit, măsurare și raportare, fără garanția poziționării.", billing: "one_time", price: 2990, codes: ["F01", "F02", "F03", "F04", "F06", "F07", "F08", "F13", "F14", "F15", "F16"] },
  { name: "Social Media Management", description: "Strategie editorială, administrarea paginilor de Facebook și Instagram, materiale grafice și raportare, lunar.", billing: "monthly", price: 1990, codes: ["G09", "G10", "G11", "G12", "A07"] },
  { name: "Video & Reels", description: "Reels lunare, montaj și subtitrare pentru rețelele sociale.", billing: "one_time", price: 1990, codes: ["H03", "H04", "H07", "H08"] },
  { name: "Mentenanță Website", description: "Mentenanță, actualizări de securitate, backup, monitorizare și asistență tehnică, lunar.", billing: "monthly", price: 499, codes: ["K04", "K05", "K06", "K07", "K08"] },
  { name: "Promovare Digitală Completă", description: "Campanii Meta și Google, remarketing, raportare și măsurarea conversiilor.", billing: "one_time", price: 3990, codes: ["G01", "G02", "G04", "G06", "G08", "G12", "F06", "F09", "F11"] },
  { name: "Digitalizare Business", description: "Consultanță și aplicații personalizate pentru digitalizarea proceselor, cu instruire și documentație.", billing: "one_time", price: 34990, codes: ["A02", "J01", "J02", "J04", "J06", "J07", "J10", "K10", "K11"] },
  { name: "Magazin Shopify Custom", description: "Magazin Shopify 100% custom: temă proprie, șabloane personalizate, configurare, integrări, instruire și măsurare.", billing: "one_time", price: 14990, codes: ["L01", "L03", "L05", "L07", "L08", "L12", "B06", "F01", "F02", "F06", "F13"] },
];

/**
 * Inserează categoriile, serviciile și pachetele care lipsesc. Nu modifică și nu șterge
 * nimic existent, deci modificările utilizatorului rămân.
 */
/** Completează prețurile lipsă din seed: doar unde prețul e NULL; ce a setat utilizatorul rămâne neatins. */
export async function fillSeedPrices(db: Db): Promise<void> {
  const all = await db.select({ id: catalogServices.id, code: catalogServices.code, price: catalogServices.recommendedPrice }).from(catalogServices);
  const idByCode = new Map(all.map((s) => [s.code, s.id]));
  for (const s of all) {
    const lei = PRICES[s.code];
    if (s.price === null && lei !== undefined) {
      await db.update(catalogServices).set({ recommendedPrice: lei * 100, currency: "RON" }).where(eq(catalogServices.id, s.id));
    }
  }
  for (const pkg of PACKAGES) {
    const [row] = await db.select({ id: catalogPackages.id, price: catalogPackages.recommendedPrice }).from(catalogPackages).where(eq(catalogPackages.name, pkg.name));
    if (!row || row.price !== null) continue;
    await db.transaction(async (tx) => {
      await tx.update(catalogPackages).set({ recommendedPrice: pkg.price * 100, currency: "RON" }).where(eq(catalogPackages.id, row.id));
      await tx.delete(catalogPackageItems).where(eq(catalogPackageItems.packageId, row.id));
      const items = pkg.codes.flatMap((code, i) => {
        const serviceId = idByCode.get(code);
        return serviceId ? [{ packageId: row.id, serviceId, sort: (i + 1) * 10 }] : [];
      });
      if (items.length) await tx.insert(catalogPackageItems).values(items);
    });
  }
}

export async function seedCatalog(db: Db): Promise<void> {
  await fillSeedPrices(db);
  await db
    .insert(catalogCategories)
    .values(CATEGORIES.map((c, i) => ({ code: c.code, name: c.name, note: c.note, sort: (i + 1) * 10 })))
    .onConflictDoNothing();

  const sortInCategory = new Map<string, number>();
  await db
    .insert(catalogServices)
    .values(
      SERVICES.map((s) => {
        const sort = (sortInCategory.get(s.category) ?? 0) + 10;
        sortInCategory.set(s.category, sort);
        return {
          code: s.code,
          categoryCode: s.category,
          name: s.name,
          shortDescription: s.shortDescription,
          description: s.description,
          deliverables: s.deliverables,
          acceptance: s.acceptance,
          unit: s.unit,
          billing: s.billing,
          defaultStatus: s.defaultStatus,
          advanced: s.advanced,
          recommendedPrice: PRICES[s.code] !== undefined ? PRICES[s.code] * 100 : null,
          currency: PRICES[s.code] !== undefined ? ("RON" as Currency) : null,
          sort,
        };
      }),
    )
    .onConflictDoNothing({ target: catalogServices.code });

  const existing = await db.select({ name: catalogPackages.name }).from(catalogPackages);
  const have = new Set(existing.map((p) => p.name));
  const missing = PACKAGES.filter((p) => !have.has(p.name));
  if (missing.length === 0) return;

  const services = await db
    .select({ id: catalogServices.id, code: catalogServices.code })
    .from(catalogServices)
    .where(inArray(catalogServices.code, [...new Set(missing.flatMap((p) => p.codes))]));
  const idByCode = new Map(services.map((s) => [s.code, s.id]));

  for (const pkg of missing) {
    const index = PACKAGES.indexOf(pkg);
    const [row] = await db
      .insert(catalogPackages)
      .values({ name: pkg.name, description: pkg.description, billing: pkg.billing, recommendedPrice: pkg.price * 100, currency: "RON" as Currency, sort: (index + 1) * 10 })
      .onConflictDoNothing({ target: catalogPackages.name })
      .returning({ id: catalogPackages.id });
    if (!row) continue;
    const items = pkg.codes
      .map((code, i) => ({ packageId: row.id, serviceId: idByCode.get(code), sort: (i + 1) * 10 }))
      .filter((item): item is { packageId: string; serviceId: string; sort: number } => Boolean(item.serviceId));
    if (items.length) await db.insert(catalogPackageItems).values(items).onConflictDoNothing();
  }
}

