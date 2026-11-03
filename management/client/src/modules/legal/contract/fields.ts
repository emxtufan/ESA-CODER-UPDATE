/**
 * Definiția formularului generatorului, copiată din „Generator contract ESA.html”
 * (chei, etichete, texte de ajutor, valori implicite, tipuri și validări neschimbate).
 */

export type FieldType = "text" | "number" | "date" | "email" | "select" | "textarea" | "check";

export interface FieldSpec {
  key: string;
  label: string;
  /** Text de ajutor (HTML simplu: `<b>`, `<i>`). */
  help?: string;
  type: FieldType;
  def?: string;
  min?: number;
  max?: number;
  opts?: string[];
  /** Câmpul face parte din „implicitele” prestatorului (salvate prin API). */
  save?: number;
  check?: "iban" | "email" | "cui";
}

export interface Section {
  id: string;
  title: string;
  sub?: string;
  intro: string;
  fields: FieldSpec[];
  open?: boolean;
}

const S = (id: string, title: string, sub: string, intro: string, fields: FieldSpec[], open?: boolean): Section => ({ id, title, sub, intro, fields, open });
const F = (key: string, label: string, help: string, o: Partial<FieldSpec> = {}): FieldSpec => Object.assign({ key, label, help, type: "text" as FieldType }, o);

export const SECTIONS: Section[] = [
S("c","1. Contractul","începe aici","Date generale care apar în antetul contractului, la art. 24 și lângă semnături.",[
 F("nr","Număr contract","<b>Ce introduci:</b> numărul tău intern de înregistrare. Ex: <i>001/2026</i> sau <i>ESA-2026-001</i>. Lasă gol dacă îl scrii de mână."),
 F("data","Data contractului","<b>Ce introduci:</b> data la care se semnează. Apare în titlu, la art. 24.2 și în dreptul semnăturilor.",{type:"date",def:"today"})
],true),
S("cl","2. Clientul (Beneficiarul)","completezi pentru fiecare client","Datele din certificatul de înregistrare al clientului. Le găsești pe <i>mfinante.ro</i> (CUI) sau pe <i>portal.onrc.ro</i>. Dacă nu le știi, lasă gol și completează de mână.",[
 F("clNume","Denumirea clientului","<b>Ce introduci:</b> numele complet exact ca în actele firmei, cu forma juridică. Ex: <i>DELTA BUILD S.R.L.</i> La PFA: <i>POPESCU ION PERSOANĂ FIZICĂ AUTORIZATĂ</i>."),
 F("clSediu","Sediul social","<b>Ce introduci:</b> adresa sediului social din ONRC (stradă, număr, localitate, județ/sector). Nu adresa punctului de lucru. Ex: <i>Cluj-Napoca, str. Memorandumului nr. 5, jud. Cluj</i>."),
 F("clRc","Nr. Registrul Comerțului","<b>Ce introduci:</b> J40/1234/2020 sau formatul nou, ex. J2020012345004. La PFA/II: F40/…/…. Îl ai pe certificatul de înregistrare."),
 F("clCui","CUI","<b>Ce introduci:</b> codul fiscal. Dacă firma e plătitoare de TVA scrie cu RO. Ex: <i>RO12345678</i>.",{check:"cui"}),
 F("clIban","IBAN client","<b>Ce introduci:</b> IBAN-ul firmei (începe cu RO, 24 de caractere). Opțional.",{check:"iban"}),
 F("clBanca","Banca clientului","<b>Ce introduci:</b> numele băncii. Ex: <i>Banca Transilvania</i>. Opțional."),
 F("clEmail","E-mail client","<b>Ce introduci:</b> adresa pe care clientul chiar o citește. Pe ea merg notificările contractuale (art. 21): factură, reziliere, suspendare.",{type:"email",check:"email"}),
 F("clTel","Telefon client","<b>Ce introduci:</b> numărul de contact. Ex: <i>0722 123 456</i>."),
 F("clRep","Reprezentant legal","<b>Ce introduci:</b> numele și prenumele celui care semnează pentru client. Trebuie să fie persoana cu drept de reprezentare (vezi certificatul sau ANAF). Ex: <i>Popescu Ion</i>."),
 F("clFunctie","Funcția reprezentantului","<b>Ce introduci:</b> Administrator, Director general, Asociat unic sau Împuternicit (dacă semnează pe bază de procură).")
]),
S("e","3. Prestatorul (ESA)","preîncărcat, se salvează","Datele firmei tale sunt deja completate. Doar <b>IBAN-ul</b> și <b>banca</b> trebuie introduse o singură dată: rămân salvate în acest browser.",[
 F("esaNume","Denumire firmă","Precompletat: ELEXA SOCIETY S.R.L.",{def:"ELEXA SOCIETY S.R.L.",save:1}),
 F("esaCui","CUI","Precompletat. Dacă devii plătitoare de TVA, schimbă în RO52745149.",{def:"52745149",save:1}),
 F("esaRc","Nr. Reg. Comerțului","Precompletat.",{def:"J2025080665008",save:1}),
 F("esaAdresa","Sediu social","Precompletat.",{def:"București, Sector 6, Bulevardul Timișoara nr. 101V, ap. 4",save:1}),
 F("esaIban","IBAN ESA","<b>Ce introduci:</b> IBAN-ul în care vrei să încaseze plățile (24 de caractere, începe cu RO). Se salvează pentru următoarele contracte.",{save:1,check:"iban"}),
 F("esaBanca","Banca ESA","<b>Ce introduci:</b> banca în care e deschis contul. Se salvează.",{save:1}),
 F("esaEmail","E-mail","Precompletat. Apare în contract și în footer.",{def:"support@esa-coder-solutions.com",save:1}),
 F("esaTel","Telefon","Precompletat. Apare în contract și în footer.",{def:"0755 938 367",save:1}),
 F("esaSite","Website","Precompletat.",{def:"https://esa-coder-solutions.com",save:1}),
 F("esaRep","Reprezentant legal","Precompletat.",{def:"Tufan Constantin Emanuel",save:1}),
 F("esaFunctie","Funcția","Precompletat. Schimbă dacă ai altă calitate în actele firmei.",{def:"administrator",save:1})
]),
S("k","4. Condiții comerciale","valori implicite","Sunt deja setate valorile recomandate pentru ESA. Modifică doar dacă negociezi altceva cu clientul.",[
 F("avans","Avans (%)","<b>Ce introduci:</b> procentul din preț plătit la semnare. Lucrul începe numai după ce intră avansul, iar el nu se restituie (art. 5.2).",{type:"number",def:"50",min:0,max:100}),
 F("termenPlata","Termen de plată (zile lucrătoare)","<b>Ce introduci:</b> în câte zile lucrătoare de la factură trebuie plătit. Legea 72/2013 permite maximum 60 de zile calendaristice între firme.",{type:"number",def:"5",min:1,max:40}),
 F("penalitate","Penalitate de întârziere (% pe zi)","<b>Ce introduci:</b> procent pe zi din suma restantă. 0,1% pe zi înseamnă circa 36% pe an, față de dobânda legală între firme de circa 14,5% (≈0,04% pe zi). Instanța poate reduce o penalitate văzută ca excesivă. Mai sigur: <i>0,05</i>.",{def:"0,1"}),
 F("comision","Comision pentru servicii de la terți (%)","<b>Ce introduci:</b> cât adaugi când achiziționezi tu în numele clientului domenii, licențe, găzduire și le refacturezi (art. 5.6).",{type:"number",def:"10",min:0,max:100}),
 F("revizii","Runde de revizii incluse","<b>Ce introduci:</b> câte runde de modificări sunt incluse în preț, pe etapă de design. Peste ele, schimbările se taxează (art. 7).",{type:"number",def:"2",min:1,max:9}),
 F("garantie","Garanție (zile)","<b>Ce introduci:</b> câte zile după recepție remediezi gratuit defectele (art. 13).",{type:"number",def:"30",min:0,max:365}),
 F("compensatie","Compensație la anulare (%)","<b>Ce introduci:</b> procentul din valoarea etapelor neîncepute pe care îl plătește clientul dacă renunță la proiect sau dispare (art. 6.9, 19.2, 19.4).",{type:"number",def:"30",min:0,max:100}),
 F("nesol","Penalitate nesolicitare angajați (euro)","<b>Ce introduci:</b> suma minimă plătită de client dacă îți angajează un om din echipă (art. 20). Se aplică cea mai mare dintre aceasta și salariul pe 12 luni.",{type:"number",def:"10000",min:0}),
 F("tarifOrar","Tarif orar (lei, fără TVA)","<b>Ce introduci:</b> prețul pe oră pentru lucrările din afara specificației. Lasă gol dacă vrei să-l comunici clientului în scris, de la caz la caz.",{type:"number",min:0})
]),
S("p","5. Comanda / proiectul","opțional, pentru Anexa 1","Completează dacă vrei ca Anexa 1 (Comanda) să iasă gata făcută. Ce lași gol rămâne puncte sau text-model, de completat de mână.",[
 F("cmdNr","Număr comandă","<b>Ce introduci:</b> numărul comenzii pentru acest proiect. Ex: <i>1</i> sau <i>C-001</i>."),
 F("cmdData","Data comenzii","<b>Ce introduci:</b> data semnării comenzii (de obicei aceeași cu a contractului).",{type:"date"}),
 F("proiect","Denumirea proiectului","<b>Ce introduci:</b> pe scurt, ce se face. Ex: <i>Site de prezentare cu rezervări online</i>."),
 F("tip","Tipul serviciului","<b>Ce alegi:</b> categoria principală.",{type:"select",opts:["","Site de prezentare","Magazin online","Aplicație web","Aplicație mobilă","Software la comandă","Motion design și animații","Integrare AI / automatizări","Mentenanță","Găzduire administrată"]}),
 F("spec","Specificația","<b>Ce introduci:</b> paginile, funcțiile, integrările și limbile site-ului. Ex: <i>8 pagini, formular de contact, blog, RO/EN, integrare Google Analytics</i>. Orice nu e scris aici nu e inclus în preț.",{type:"textarea"}),
 F("livrabile","Livrabile","<b>Ce introduci:</b> ce predai la final. Ex: <i>site publicat, cod sursă, machete Figma</i>.",{type:"textarea"}),
 F("tehnologii","Tehnologii","<b>Ce introduci:</b> stack-ul folosit. Ex: <i>React, TypeScript, Tailwind CSS, Framer Motion</i>."),
 F("accesib","Accesibilitate (Legea 232/2022)","<b>Ce alegi:</b> „da” doar dacă clientul cere explicit cerințe de accesibilitate (obligatorii pentru magazine online către consumatori). Altfel contractul îl pune pe client să decidă.",{type:"select",opts:["","Nu","Da – nivel WCAG 2.1 AA"]}),
 F("etape","Etape și termene","<b>Ce introduci:</b> fiecare etapă cu termenul ei și dacă termenul e <i>estimativ</i> sau <i>ferm</i>. Doar termenele marcate „ferm” atrag penalități pentru tine (art. 6).",{type:"textarea"}),
 F("pret","Preț total (fără TVA)","<b>Ce introduci:</b> suma totală pentru proiect, fără TVA.",{type:"number",min:0}),
 F("moneda","Moneda","<b>Ce alegi:</b> în ce monedă e prețul. Plata se face în lei la cursul BNR.",{type:"select",opts:["euro","lei"]}),
 F("plati","Plăți pe etape","<b>Ce introduci:</b> cum se împarte prețul. Ex: <i>50% la semnare, 30% la aprobarea machetelor, 20% la predare</i>.",{type:"textarea"}),
 F("regim","Regimul drepturilor","<b>Ce alegi:</b> <i>cesiune</i> = clientul devine titular după plată (art. 10.3). <i>Licență</i> = clientul doar folosește, tu păstrezi codul (art. 10.4).",{type:"select",opts:["","Cesiune – art. 10.3","Licență – art. 10.4"]}),
 F("cod","Predai codul sursă?","<b>Ce alegi:</b> „da” înseamnă că după plata integrală clientul primește codul (art. 10.10).",{type:"select",opts:["","Da","Nu"]}),
 F("terti","Servicii de la terți și cine le plătește","<b>Ce introduci:</b> găzduire, domeniu, licențe, API-uri, servicii AI și cine le plătește (clientul direct sau tu cu refacturare). Ex: <i>Domeniu și găzduire: Beneficiar direct</i>.",{type:"textarea"}),
 F("mentenanta","Mentenanță / găzduire administrată","<b>Ce introduci:</b> ce e inclus, câte ore pe lună, timpi de răspuns, preț lunar. Lasă gol dacă nu vinzi mentenanță.",{type:"textarea"}),
 F("confidential","Proiect confidențial?","<b>Ce alegi:</b> „da” înseamnă că nu îl poți arăta în portofoliu (art. 10.9).",{type:"select",opts:["","Nu","Da"]}),
 F("datePers","Prelucrezi date personale ale clienților lui?","<b>Ce alegi:</b> „da” dacă ai acces la baze de date cu clienți, comenzi, formulare (găzduire, magazin online). Atunci Anexa 3 este obligatorie.",{type:"select",opts:["","Da","Nu"]}),
 F("derog","Clauze derogatorii","<b>Ce introduci:</b> doar dacă ai negociat ceva diferit de contract. Scrie articolul și noua regulă. Ex: <i>Prin derogare de la art. 5.8, termenul de plată este de 15 zile.</i>",{type:"textarea"})
]),
S("a","6. Anexa 3 (date personale)","opțional","Se completează doar dacă clientul îți dă acces la date personale. Dacă nu, poți debifa anexa mai jos.",[
 F("a3Date","Ce date colectează site-ul/aplicația","<b>Ce introduci:</b> categoriile de date. Ex: <i>nume, e-mail, telefon, adresă de livrare, istoric comenzi</i>."),
 F("a3Pers","Cine sunt persoanele vizate","<b>Ce introduci:</b> Ex: <i>clienții magazinului, abonații la newsletter</i>."),
 F("a3Sub","Subîmputerniciți (furnizorii tăi)","<b>Ce introduci:</b> câte un furnizor pe linie, în forma <i>nume | serviciu | locația datelor</i>. Ex: <i>Hetzner | găzduire | UE (Germania)</i>. Aici intră firmele prin care trec datele clientului (găzduire, backup, e-mail).",{type:"textarea"})
]),
S("o","7. Ce include PDF-ul","","Bifează ce anexe vrei în fișier. Contractul propriu-zis (art. 1–24) este mereu inclus.",[
 {key:"inc1",label:"Anexa 1 – Comanda",type:"check",def:"1"},
 {key:"inc2",label:"Anexa 2 – Proces-verbal de recepție",type:"check",def:"1"},
 {key:"inc3",label:"Anexa 3 – Acord de prelucrare a datelor (GDPR)",type:"check",def:"1"}
])
];

export const CHECKS: Record<"iban" | "email" | "cui", (v: string) => string> = {
 iban:v=>!v||/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/i.test(v.replace(/\s/g,""))?"":"IBAN-ul românesc are 24 de caractere (RO + 2 cifre + 4 litere + 16).",
 email:v=>!v||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)?"":"Adresa de e-mail pare incompletă.",
 cui:v=>!v||/^(RO)?\d{2,10}$/i.test(v.replace(/\s/g,""))?"":"CUI-ul are doar cifre, opțional cu prefix RO."
};

export const today = (): string => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

/** Valorile implicite ale tuturor câmpurilor (data = azi). */
export function defaultValues(): Record<string, string> {
  const V: Record<string, string> = {};
  SECTIONS.forEach((s) => s.fields.forEach((f) => { V[f.key] = f.def === "today" ? today() : f.def || ""; }));
  return V;
}

/** Cheile câmpurilor prestatorului, salvabile ca implicite. */
export const PROVIDER_KEYS: string[] = SECTIONS.flatMap((s) => s.fields.filter((f) => f.save).map((f) => f.key));
