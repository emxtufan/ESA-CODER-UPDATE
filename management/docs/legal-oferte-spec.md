# Specificație: ofertare, contractare și dosar contractual

Sursa: cerința proprietarului din 2026-11-03. Generatorul de oferte original: `Generator_Oferta_ESA (1).html` (copie lizibilă, fără biblioteci, în scratchpad-ul sesiunii: `oferta-lite.html`).

## Cerința, pe scurt

Un sistem unificat care generează din aceeași configurație: oferta comercială, contractul de prestări servicii, anexa de servicii și deviz, anexa cu graficul de implementare și plată, procesul-verbal de predare-primire și recepție, actul adițional, anexa de mentenanță și servicii recurente, centralizatorul de servicii și costuri. Toate documentele folosesc aceleași informații, aceeași valoare contractuală și aceleași servicii acceptate. Șabloanele juridice existente (contractul-cadru) rămân neschimbate.

### Catalog de servicii (panou lateral glisant în dreapta)

Căutare instantanee (denumire, descriere), filtru pe categorie, selectare multiplă, serviciu personalizat, descriere editabilă pentru fiecare client, preț unitar editabil, cantitate și unitate de măsură, discount procentual sau fix, plată unică sau recurentă, servicii incluse în pachet (fără dublarea costului), servicii opționale neacceptate, total calculat automat, TVA și monedă configurabile, salvarea serviciilor în catalog pentru utilizări viitoare.

Fiecare element din catalog are: ID unic și categorie, denumire comercială, descriere scurtă, descriere detaliată (editabilă în ofertă și anexe), livrabile și criterii de acceptare, unitate și cantitate, preț recomandat opțional (configurat de administrator, NU inventat), monedă, taxe, reducere și frecvență, stare (inclus în pachet / acceptat suplimentar / opțional neacceptat / cost suportat direct de client), durată și condiții specifice.

Doar serviciile acceptate și cele incluse în pachetul acceptat intră în contract și în anexele de execuție. Tarifele lunare apar distinct de costurile unice. Un serviciu inclus într-un pachet nu se taxează a doua oară.

### Pachete reutilizabile (șabloane, fără prețuri presupuse)

Website Start, Website Business, Website Premium, Website Educațional, SEO și Analytics, Social Media Management, Video & Reels, Mentenanță Website, Promovare Digitală Completă, Digitalizare Business, plus Redesign complet website și Magazin Shopify Custom. La selectarea unui pachet, componentele se afișează detaliat, dar nu se adună de două ori la total. Serviciile și prețul pachetului se pot modifica pentru fiecare client.

### Dosarul

1. Oferta comercială: servicii, beneficii, prețuri, opționale, termene, condiții.
2. Contractul: părți, obiect, valoare, drepturi, obligații, trimiteri la anexele acceptate.
3. Anexa de servicii și deviz: fiecare serviciu contractat, descriere, cantitate, unitate, preț, livrabil, criteriu de recepție.
4. Anexa cu graficul de implementare și plată: etape, scadențe, avansuri, diferențe de plată.
5. PV de predare-primire și recepție: livrabilele contractate și câmpuri de completat la predare.
6. Actul adițional: modificări ulterioare acceptate, cu diferențele evidențiate.
7. Anexa de mentenanță: numai dacă există servicii de întreținere sau abonamente.
8. Centralizatorul de servicii și costuri.

Nu se consideră automat nimic semnat, acceptat, achitat sau recepționat. Export PDF cu text selectabil, Word editabil și pachet ZIP. Versiuni istorice, numerotare coerentă, copie nemodificabilă a configurației comerciale acceptate. Schimbările din catalog nu modifică retroactiv documentele acceptate. Export și import de ciorne, compatibil cu formatul vechi `{"format":"esa-oferta","version":1,"state":{…}}` unde e posibil.

### Prestatorul (preset)

ESA Coder Solutions (marcă), ELEXA SOCIETY S.R.L., CUI 52745149, J2025080665008, support@esa-coder-solutions.com, telefon **0748 452 215**. Editabile din setările firmei.

### Exemplu: Grădinița Georgi

Client: Grădinița Georgi, website gradinitageorgi.ro. Pachet: Redesign complet website, 400 EUR. Include: pagini de prezentare, hero, header și footer, design responsive, administrare de conținut, blog, proiecte, excursii, anunțuri, tarife, formular de contact cu transmitere pe e-mail, optimizări SEO, integrările de măsurare (Meta Pixel, TikTok Pixel, Google tag). Preluarea postărilor Facebook e condiționată de disponibilitatea tehnică și permisiunile Meta. SEO = optimizare tehnică și on-page, fără garanție de poziționare. Video, Reels, administrarea campaniilor, dezvoltările avansate pentru părinți și bugetele de publicitate sunt separate și nu intră în cei 400 EUR.

### Test obligatoriu

Fără TVA și fără reduceri: website acceptat 400 EUR unic; mentenanță acceptată 50 EUR/lună × 3 luni; videoclip propus, neacceptat, 150 EUR; buget publicitar achitat direct de client 200 EUR. Valoarea contractuală = **550 EUR** (400 unic + 150 mentenanță). Videoclipul și bugetul nu intră.

## Catalogul inițial

Format: `cod | denumire | descriere`. Note de categorie la final de categorie.

### A — Consultanță, strategie și design
- A01 | Audit profesional website | Analiza unui website existent pentru identificarea problemelor de design, navigare, performanță, accesibilitate și conversie, însoțită de recomandări prioritizate.
- A02 | Consultanță pentru digitalizarea afacerii | Identificarea proceselor care pot fi digitalizate și propunerea unor soluții software potrivite activității beneficiarului.
- A03 | Strategie de prezență online | Definirea structurii și obiectivelor prezenței digitale, a publicului vizat și a canalelor de comunicare.
- A04 | Design UI/UX personalizat | Realizarea interfețelor și a fluxurilor de navigare orientate spre claritate, accesibilitate și experiența utilizatorului.
- A05 | Wireframe și prototip website | Elaborarea structurii vizuale a paginilor și, după caz, a unui prototip interactiv pentru validarea designului înainte de dezvoltare.
- A06 | Identitate vizuală digitală | Stabilirea elementelor grafice digitale, precum paleta cromatică, tipografia, butoanele și regulile de prezentare.
- A07 | Design de materiale publicitare | Crearea de bannere, machete pentru rețele sociale și alte materiale grafice destinate promovării.
- A08 | Copywriting pentru website | Redactarea sau reorganizarea textelor comerciale pentru prezentarea serviciilor, beneficiilor și apelurilor la acțiune.

### B — Website-uri și dezvoltare web
- B01 | Redesign complet website | Reconstruirea vizuală și funcțională a unui website existent, cu structură modernă, navigare optimizată și adaptare la dispozitive mobile.
- B02 | Website de prezentare | Dezvoltarea unui site cu pagini dedicate companiei, serviciilor, portofoliului și modalităților de contact.
- B03 | Website multipagină personalizat | Dezvoltarea unui website cu structură extinsă, secțiuni multiple și funcționalități adaptate activității beneficiarului.
- B04 | Landing page profesional | Crearea unei pagini orientate către un obiectiv comercial specific, precum solicitarea unei oferte, rezervarea unei vizite sau înscrierea.
- B05 | Pagină web suplimentară | Proiectarea și implementarea unei pagini noi în website-ul existent.
- B06 | Design responsive | Adaptarea interfeței pentru telefoane, tablete, laptopuri și desktop.
- B07 | Secțiune Hero personalizată | Realizarea zonei principale a paginii de start, cu titlu, mesaj comercial, elemente vizuale și butoane de acțiune.
- B08 | Header și meniu de navigare | Implementarea unei zone de navigare clare, cu logo, pagini principale, submeniuri și acces rapid către contact.
- B09 | Footer profesional personalizat | Dezvoltarea secțiunii inferioare cu informații juridice, contact, linkuri utile și elemente de identitate vizuală.
- B10 | Website multilingv | Implementarea posibilității de prezentare a conținutului în mai multe limbi, cu traducerile furnizate sau contractate separat.
- B11 | Migrare website existent | Transferarea structurii și a conținutului convenit către o nouă implementare, cu verificarea linkurilor și a funcționalităților.
- B12 | Optimizare accesibilitate website | Îmbunătățirea navigării cu tastatura, a contrastului, a etichetelor și a structurii semantice, în limitele standardelor convenite.
- B13 | Căutare internă website | Integrarea unui sistem de căutare pentru articole, pagini, proiecte sau alte categorii de conținut.
- B14 | Secțiune FAQ interactivă | Implementarea unei zone cu întrebări frecvente, răspunsuri extensibile și posibilitatea actualizării acestora.
- B15 | Website pentru instituții educaționale | Dezvoltarea unui site pentru grădinițe, școli sau centre educaționale, cu prezentarea grupelor, programelor și activităților.

### C — Panouri de administrare și conținut
- C01 | Panou de administrare CMS | Construirea unui spațiu de administrare pentru actualizarea conținutului fără modificări directe în cod.
- C02 | Administrare pagini website | Posibilitatea adăugării, editării, publicării și arhivării paginilor.
- C03 | Blog și articole | Sistem pentru publicarea articolelor, știrilor și materialelor informative, cu imagini și categorii.
- C04 | Portofoliu și proiecte | Modul pentru prezentarea proiectelor finalizate, fiecare cu descriere, imagini și alte informații relevante.
- C05 | Galerie foto administrabilă | Sistem de încărcare, organizare și afișare a fotografiilor în albume sau categorii.
- C06 | Galerie video | Secțiune pentru organizarea și afișarea videoclipurilor de prezentare sau a materialelor media.
- C07 | Anunțuri importante | Sistem de publicare a comunicatelor, informărilor urgente și anunțurilor cu perioadă de afișare.
- C08 | Calendar de evenimente | Modul de administrare și afișare a evenimentelor, activităților și datelor importante.
- C09 | Administrare tarife și pachete | Interfață pentru actualizarea prețurilor, serviciilor incluse și condițiilor de tarifare.
- C10 | Management documente PDF | Încărcarea și publicarea documentelor informative pentru descărcare.
- C11 | Roluri și permisiuni de administrare | Configurarea drepturilor pentru administrator, editor și alți utilizatori autorizați.
- C12 | Publicare programată de conținut | Programarea publicării sau retragerii unor articole și anunțuri la date stabilite.

### D — Soluții pentru grădinițe și instituții educaționale
- D01 | Prezentarea grupelor educaționale | Pagini pentru fiecare grupă, cu intervale de vârstă, program și descrierea activităților.
- D02 | Modul activități educaționale | Prezentarea programelor, atelierelor și activităților disponibile.
- D03 | Modul excursii și evenimente | Publicarea excursiilor, vizitelor și activităților speciale, cu galerii și descrieri.
- D04 | Calendar educațional | Afișarea zilelor speciale, evenimentelor și activităților planificate.
- D05 | Meniu alimentar săptămânal | Interfață de administrare și afișare a meniului alimentar actualizat periodic.
- D06 | Formular solicitare înscriere | Colectarea solicitărilor inițiale de înscriere printr-un formular configurabil.
- D07 | Programare vizită la grădiniță | Formular sau calendar prin care părinții pot solicita o vizită și primi confirmarea disponibilității.
- D08 | Portal privat pentru părinți | Spațiu securizat, cu autentificare individuală, pentru accesarea comunicărilor și informațiilor autorizate. **[avansat]**
- D09 | Modul notificări pentru părinți | Transmiterea anunțurilor către destinatarii autorizați prin canale configurate. **[avansat]**
- D10 | Jurnal de activități pentru copil | Funcționalitate privată prin care personalul autorizat poate înregistra și comunica informații individuale către părinții corespunzători. **[avansat]**
- D11 | Galerie foto privată pentru grupe | Distribuirea controlată a fotografiilor, cu drepturi de acces și mecanisme de respectare a consimțămintelor necesare. **[avansat]**
- D12 | Management cereri și documente pentru părinți | Centralizarea solicitărilor și a documentelor transmise, cu acces restricționat. **[avansat]**

Notă D: D08–D12 sunt dezvoltări avansate, ofertate separat. Implică date personale și, posibil, date ale minorilor; necesită analiză GDPR, control de acces, protecție a datelor, reguli de retenție și cerințe funcționale aprobate înainte de contractare. Nu se includ implicit în pachete.

### E — Formulare, automatizări și integrări
- E01 | Formular de contact profesional | Formular cu validare, protecție antispam și transmiterea solicitărilor către adresele de e-mail configurate.
- E02 | Formular cerere de ofertă | Colectarea informațiilor necesare pentru formularea unei propuneri comerciale.
- E03 | Formular de rezervare | Sistem pentru solicitarea unei programări, cu date, intervale și confirmări configurabile.
- E04 | Notificări automate prin e-mail | Trimiterea mesajelor de confirmare sau informare ca urmare a unor acțiuni definite.
- E05 | Integrare WhatsApp Business | Adăugarea canalelor de contact WhatsApp și, dacă este disponibil, conectarea unor automatizări prin soluții autorizate.
- E06 | Integrare Facebook Page Feed | Preluarea și afișarea postărilor publicate pe o pagină Facebook, în limitele API-ului, permisiunilor și politicilor Meta.
- E07 | Integrare Instagram | Afișarea unui feed sau a unor materiale Instagram, în funcție de posibilitățile de integrare disponibile.
- E08 | Integrare Google Maps | Afișarea locației și facilitarea accesului la indicații de orientare.
- E09 | Integrare newsletter | Conectarea formularelor de abonare cu o platformă de e-mail marketing.
- E10 | Integrare CRM | Transmiterea solicitărilor și a datelor relevante către un sistem de management al relațiilor cu clienții.
- E11 | Automatizări de fluxuri de lucru | Conectarea unor formulare, notificări și aplicații pentru executarea automată a unor procese.
- E12 | Integrare API personalizată | Conectarea website-ului sau aplicației la servicii externe care oferă interfețe API compatibile.
- E13 | Asistent virtual pentru întrebări frecvente | Implementarea unui asistent conversațional pentru informații generale despre servicii, program sau proceduri.
- E14 | Export de solicitări CSV/Excel | Posibilitatea exportării datelor colectate în formate utilizabile pentru raportare și administrare.

### F — SEO, performanță și analiză trafic
- F01 | SEO tehnic website | Optimizarea structurii paginilor, adreselor URL, indexabilității și principalelor elemente tehnice relevante pentru motoarele de căutare.
- F02 | SEO on-page | Configurarea titlurilor, metadescrierilor, structurii headingurilor și a legăturilor interne pentru paginile convenite.
- F03 | SEO local | Optimizări pentru relevanța geografică a afacerii și a informațiilor de contact.
- F04 | Audit SEO | Analiza problemelor tehnice și de conținut, însoțită de recomandări de îmbunătățire.
- F05 | Optimizare viteză website | Reducerea resurselor inutile și optimizarea încărcării paginilor, în funcție de infrastructura disponibilă.
- F06 | Configurare Google Analytics 4 | Instalarea și configurarea măsurării traficului și a evenimentelor relevante.
- F07 | Configurare Google Search Console | Conectarea website-ului și verificarea principalelor informații disponibile despre indexare.
- F08 | Configurare Google Tag Manager | Implementarea unei structuri de administrare a etichetelor de măsurare, în funcție de cerințele proiectului.
- F09 | Integrare Meta Pixel | Configurarea evenimentelor de măsurare pentru Facebook și Instagram, conform mecanismului de consimțământ aplicabil.
- F10 | Integrare TikTok Pixel | Configurarea instrumentelor TikTok pentru măsurarea evenimentelor și rezultatelor campaniilor, cu respectarea consimțământului.
- F11 | Integrare Google Ads Tag | Configurarea etichetelor pentru măsurarea conversiilor campaniilor Google Ads.
- F12 | Administrare pixeli din CMS | Interfață securizată pentru modificarea identificatorilor și a setărilor permise ale instrumentelor de măsurare.
- F13 | Configurare cookie consent | Implementarea mecanismului de consimțământ pentru cookies și tehnologii neesențiale, în funcție de configurația website-ului.
- F14 | Date structurate Schema.org | Adăugarea marcajelor structurate potrivite tipurilor de conținut disponibile.
- F15 | Sitemap XML și robots.txt | Configurarea fișierelor care facilitează descoperirea paginilor și administrarea regulilor de acces pentru crawler-e.
- F16 | Raport SEO și performanță | Pregătirea unui raport cu indicatori de trafic, indexare, performanță și recomandări.

Notă F: optimizările SEO nu garantează poziții, trafic sau rezultate comerciale specifice.

### G — Marketing digital și publicitate
- G01 | Configurare campanie Facebook Ads | Pregătirea unei campanii Meta Ads, cu obiectiv, audiență, materiale și parametri conveniți.
- G02 | Administrare lunară Facebook Ads | Monitorizarea, ajustarea și raportarea campaniilor publicitare active. (lunar)
- G03 | Configurare campanie Instagram Ads | Pregătirea campaniilor de promovare pe Instagram prin instrumentele Meta.
- G04 | Configurare Google Search Ads | Crearea unei campanii de căutare cu grupuri de anunțuri, cuvinte-cheie și măsurarea conversiilor.
- G05 | Configurare Google Display Ads | Pregătirea campaniilor vizuale în rețeaua de afișare Google.
- G06 | Administrare lunară Google Ads | Monitorizarea bugetelor, termenilor de căutare, indicatorilor și optimizarea campaniilor. (lunar)
- G07 | Configurare TikTok Ads | Pregătirea campaniilor pentru platforma TikTok, conform instrumentelor și politicilor disponibile.
- G08 | Remarketing și retargeting | Configurarea campaniilor către audiențe eligibile, pe baza datelor disponibile și a consimțământelor necesare.
- G09 | Strategie editorială social media | Realizarea unui calendar orientativ de conținut și identificarea temelor relevante pentru publicul-țintă.
- G10 | Administrare pagină Facebook | Publicarea și programarea conținutului convenit și administrarea activităților incluse în pachet. (lunar)
- G11 | Administrare cont Instagram | Planificarea și publicarea materialelor convenite, cu monitorizarea principalelor rezultate. (lunar)
- G12 | Raportare campanii publicitare | Centralizarea cheltuielilor, rezultatelor și indicatorilor relevanți într-un raport periodic.
- G13 | Buget publicitar (achitat direct de client) | Sumele cheltuite pe Meta, Google sau TikTok, achitate de beneficiar direct platformelor. (stare implicită: cost suportat direct de client)

Notă G: onorariile pentru configurarea și administrarea campaniilor sunt separate de bugetele publicitare. Sumele cheltuite pe Meta, Google sau TikTok sunt achitate de beneficiar direct platformelor, dacă nu se stabilește expres alt aranjament contractual.

### H — Producție video și fotografie
- H01 | Videoclip profesional de prezentare | Producerea unui material video pentru prezentarea companiei, locației, serviciilor sau activităților.
- H02 | Tur video al locației | Realizarea unui videoclip de prezentare a spațiilor și facilităților.
- H03 | Reel pentru Instagram și Facebook | Montarea unui material video vertical, de durată scurtă, adaptat publicării pe rețelele sociale.
- H04 | Pachet lunar de reels | Producerea unui număr convenit de videoclipuri verticale în fiecare perioadă contractuală. (lunar)
- H05 | Video publicitar pentru campanii | Realizarea unui material orientat către promovarea unui produs, serviciu sau eveniment.
- H06 | Filmare la locația clientului | Captarea imaginilor video la locația beneficiarului, în intervalul de producție convenit.
- H07 | Montaj video profesional | Selectarea, organizarea și editarea materialelor video, cu tranziții, ajustări și export în formatul convenit.
- H08 | Subtitrare videoclip | Crearea și integrarea subtitrărilor pentru accesibilitate și vizionare fără sunet.
- H09 | Motion graphics și animații | Realizarea unor animații grafice pentru titluri, informații, reclame și prezentări.
- H10 | Fotografie de prezentare | Realizarea fotografiilor necesare prezentării digitale a spațiilor, activităților sau produselor.
- H11 | Editare și optimizare fotografii | Corectarea și pregătirea imaginilor pentru utilizare pe website sau rețele sociale.

Notă H: pentru filmări și fotografii care implică minori, proiectul include verificarea drepturilor de utilizare a imaginii și a consimțămintelor necesare.

### I — Magazine online și sisteme comerciale
- I01 | Dezvoltare magazin online | Implementarea unui website pentru prezentarea și comercializarea produselor.
- I02 | Catalog online de produse | Administrarea produselor, descrierilor, categoriilor, imaginilor și prețurilor.
- I03 | Integrare plăți online | Conectarea unui procesator de plăți autorizat, conform condițiilor furnizorului.
- I04 | Sistem de rezervări online | Configurarea unui flux de rezervare pentru servicii sau intervale disponibile.
- I05 | Sistem de cupoane și promoții | Administrarea reducerilor, codurilor promoționale și condițiilor de utilizare.
- I06 | Integrare facturare electronică | Conectarea cu un furnizor compatibil de facturare, în funcție de API și de fluxul beneficiarului.
- I07 | Sistem de abonamente | Gestionarea planurilor recurente și a perioadelor de acces sau facturare.
- I08 | Dashboard de vânzări | Centralizarea comenzilor, veniturilor și principalilor indicatori comerciali.

### J — Aplicații și automatizări avansate
- J01 | Aplicație web personalizată | Dezvoltarea unei aplicații accesibile din browser pentru gestionarea unui proces specific beneficiarului.
- J02 | Dashboard administrativ personalizat | Construirea unei interfețe cu indicatori, filtre, rapoarte și operațiuni de administrare.
- J03 | Generator automat de documente | Sistem pentru completarea șabloanelor și generarea automată a documentelor pe baza datelor introduse.
- J04 | Sistem de management al clienților | Aplicație pentru evidența clienților, solicitărilor, proiectelor și interacțiunilor.
- J05 | Portal securizat pentru clienți | Spațiu autentificat pentru accesarea documentelor, proiectelor și informațiilor autorizate.
- J06 | Management de proiecte | Modul pentru organizarea sarcinilor, etapelor, responsabilităților și termenelor.
- J07 | Automatizare procese interne | Implementarea unor fluxuri automate pentru operațiuni repetitive și transferul de informații.
- J08 | Integrare AI într-o aplicație | Adăugarea unor funcționalități bazate pe inteligență artificială, cu limite funcționale, costuri externe și măsuri de protecție a datelor definite.
- J09 | Migrare și import de date | Transferarea datelor între sisteme, cu validarea formatelor și verificarea integrității.
- J10 | Sistem de notificări și alerte | Configurarea alertelor automate pentru evenimente, termene sau modificări importante.

### K — Hosting, securitate, mentenanță și suport
- K01 | Configurare domeniu și DNS | Asistență pentru conectarea domeniului și configurarea înregistrărilor necesare funcționării serviciilor.
- K02 | Configurare găzduire web | Pregătirea mediului de hosting, a aplicației și a parametrilor tehnici de bază.
- K03 | Configurare HTTPS și certificat TLS | Activarea conexiunilor securizate și verificarea configurării certificatului.
- K04 | Mentenanță lunară website | Verificări și actualizări periodice în limitele abonamentului contractat. (lunar)
- K05 | Actualizări tehnice și de securitate | Aplicarea actualizărilor compatibile și remedierea problemelor identificate.
- K06 | Backup și restaurare | Configurarea copiilor de siguranță și a procedurii de recuperare, conform perioadei de retenție convenite.
- K07 | Monitorizare disponibilitate website | Verificarea automată a disponibilității și emiterea alertelor pentru întreruperile detectate. (lunar)
- K08 | Asistență tehnică la cerere | Intervenții pentru diagnosticarea și soluționarea problemelor raportate. (unitate: oră)
- K09 | Modificări periodice de conținut | Actualizarea textelor, imaginilor, tarifelor și informațiilor publicate.
- K10 | Instruire utilizatori și administratori | Sesiune de prezentare a panoului de administrare și a funcțiilor livrate.
- K11 | Documentație tehnică și manual de utilizare | Pregătirea instrucțiunilor necesare administrării funcționalităților contractate.
- K12 | Audit de securitate aplicativă | Evaluarea controalelor de securitate agreate și formularea recomandărilor de remediere.

### L — Shopify: website-uri și magazine 100% custom (adăugat la cererea proprietarului)
- L01 | Magazin online Shopify 100% custom | Dezvoltarea unui magazin pe Shopify cu design și temă construite de la zero, fără teme predefinite, adaptate identității vizuale și fluxului de vânzare al beneficiarului.
- L02 | Website de prezentare pe Shopify | Site de prezentare sau de brand pe platforma Shopify, cu design personalizat și pagini administrabile din editorul Shopify.
- L03 | Temă Shopify custom (Online Store 2.0) | Dezvoltarea unei teme proprii în Liquid, cu secțiuni și blocuri configurabile din editorul de teme, optimizată pentru viteză și dispozitive mobile.
- L04 | Secțiuni și componente Shopify personalizate | Secțiuni noi (landing, colecții, produse, bundle-uri) adăugate unei teme existente, editabile din editorul de teme.
- L05 | Pagini de produs și colecții personalizate | Template-uri dedicate pentru produse, colecții și landing page-uri, cu câmpuri personalizate (metafields și metaobjects).
- L06 | Migrare pe Shopify | Transferul produselor, clienților, comenzilor convenite, conținutului și redirecționărilor de pe altă platformă (WooCommerce, PrestaShop sau alta).
- L07 | Configurare magazin Shopify | Configurarea plăților, livrărilor, taxelor, domeniului, notificărilor și politicilor magazinului.
- L08 | Integrări și aplicații Shopify | Configurarea aplicațiilor din Shopify App Store sau integrări prin API cu ERP, curierat, facturare sau marketplace-uri.
- L09 | Aplicație Shopify personalizată | Dezvoltarea unei aplicații custom pentru funcționalități care nu există în aplicațiile disponibile.
- L10 | Personalizare checkout Shopify | Personalizări ale procesului de checkout, în limitele permise de planul Shopify al beneficiarului.
- L11 | Mentenanță magazin Shopify | Actualizări ale temei, suport, modificări de conținut și monitorizarea aplicațiilor, lunar. (lunar)
- L12 | Instruire administrare Shopify | Prezentarea panoului Shopify pentru produse, comenzi, stocuri și conținut.
- L13 | Abonament Shopify și aplicații plătite | Abonamentul platformei Shopify, aplicațiile plătite și comisioanele procesatorilor de plăți, achitate de beneficiar direct către Shopify și furnizori. (lunar; stare implicită: cost suportat direct de client)

Notă L: abonamentul Shopify, aplicațiile plătite și comisioanele de plată sunt contractate și plătite de beneficiar direct către Shopify și furnizorii aplicațiilor. Funcționalitățile depind de planul Shopify ales.

## Pachete inițiale (fără prețuri)

| Pachet | Componente |
|---|---|
| Website Start | B02, B06, B07, B08, B09, E01, E08, F02, F15, K03 |
| Website Business | B03, A04, B06, B07, B08, B09, C01, C02, C03, E01, E02, E04, E08, F01, F02, F06, F07, F13, F14, F15, K01, K02, K03, K10 |
| Website Premium | A04, A05, B03, B06, B07, B08, B09, B10, B13, B14, C01, C02, C03, C04, C05, C11, E01, E02, E04, E08, E09, F01, F02, F05, F06, F07, F08, F13, F14, F15, K01, K02, K03, K06, K10, K11 |
| Website Educațional | B15, B06, B07, B08, B09, C01, C03, C04, C05, C07, C08, C09, D01, D02, D03, D04, D05, D06, D07, E01, E08, F01, F02, F13, F15 |
| Redesign complet website | B01, B06, B07, B08, B09, C01, C03, C04, C07, C09, D03, E01, E04, E06, F01, F02, F09, F10, F11, F15 |
| SEO și Analytics | F01, F02, F03, F04, F06, F07, F08, F13, F14, F15, F16 |
| Social Media Management (lunar) | G09, G10, G11, G12, A07 |
| Video & Reels | H03, H04, H07, H08 |
| Mentenanță Website (lunar) | K04, K05, K06, K07, K08 |
| Promovare Digitală Completă | G01, G02, G04, G06, G08, G12, F06, F09, F11 |
| Digitalizare Business | A02, J01, J02, J04, J06, J07, J10, K10, K11 |
| Magazin Shopify Custom | L01, L03, L05, L07, L08, L12, B06, F01, F02, F06, F13 |
