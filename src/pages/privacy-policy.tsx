import {getSourceData, text} from '@/lib/text';
import {usePathname} from '@/lib/navigation';
import CookieSettingsButton from '@/components/layout/CookieSettingsButton';

export default function PrivacyPolicy() {
  const cookies = usePathname() === '/politica-de-cookies';
  const scope = cookies ? '/politica-de-cookies' : '/politica-de-confidentialitate';
  const t = text(scope);
  const company = text('settings/seo');
  const email = text('global/Site')('email');
  const sections = Object.keys(getSourceData()[scope])
    .filter(key => /^section-\d+-title$/.test(key))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
    .map(key => ({title: t(key), body: t(key.replace(/title$/, 'body'))}));
  return (
    <main lang="ro" className="mx-auto max-w-[1425px] px-6 pt-[clamp(80px,9vw,130px)] pb-[clamp(80px,10vw,140px)] md:px-8">
      <article className="max-w-[812px]" style={{overflowWrap: 'anywhere'}}>
        <h1 className="font-display text-[clamp(36px,4.4vw,56px)] leading-[1] font-medium tracking-[-0.03em]">{t('heading')}</h1>
        <p className="mt-6 text-[16px] leading-[1.6] text-fg-muted">{t('updated')}</p>
        <address className="mt-6 space-y-1 text-[16px] leading-[1.6] text-fg-muted not-italic">
          <p className="font-medium text-fg">{company('company-name')} · {company('legal-name')}</p>
          <p>CUI: {company('company-cui')} · Registrul Comerțului: {company('company-reg')}</p>
          <p>Sediul social: {company('company-address')}</p>
          <p>Contact pentru protecția datelor: <a className="underline underline-offset-4" href={'mailto:' + email}>{email}</a></p>
        </address>
        <nav aria-label="Cuprins" className="mt-6">
          <h2 className="text-[18px] font-medium">Cuprins</h2>
          <ol className="mt-2 space-y-1">
            {sections.map((s, i) => <li key={s.title}><a className="underline underline-offset-4 text-fg-muted" href={'#sectiunea-' + (i + 1)}>{i + 1}. {s.title}</a></li>)}
          </ol>
        </nav>
        {sections.map((s, i) => (
          <section key={s.title} id={'sectiunea-' + (i + 1)} className="mt-[42px]" style={{scrollMarginTop: 100}}>
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">{i + 1}. {s.title}</h2>
            {s.body.split('\n\n').map(p => <p key={p} className="mt-2 text-[16px] leading-[1.6] text-fg-muted">{p}</p>)}
          </section>
        ))}
        <div className="mt-6 space-y-1 text-[16px] leading-[1.6]">
          <h3 className="text-[18px] font-medium">Contact și resurse</h3>
          <p><a className="underline" href={'mailto:' + email}>{email}</a></p>
          <p><a className="underline" href={cookies ? '/politica-de-confidentialitate' : '/politica-de-cookies'}>{cookies ? 'Politica de confidențialitate' : 'Politica de cookie-uri'}</a></p>
          <p><CookieSettingsButton className="underline" /></p>
          <p><a className="underline" href="https://www.dataprotection.ro/?page=Plangeri_pagina_principala">Depune o plângere la ANSPDCP</a></p>
          <p><a className="underline" href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">Regulamentul (UE) 2016/679</a></p>
          <p><a className="underline" href="https://legislatie.just.ro/Public/DetaliiDocument/203151">Legea nr. 190/2018</a></p>
          <p><a className="underline" href="https://legislatie.just.ro/Public/DetaliiDocument/56973">Legea nr. 506/2004</a></p>
        </div>
      </article>
    </main>
  );
}
