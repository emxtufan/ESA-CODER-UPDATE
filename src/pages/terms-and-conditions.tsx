import {getSourceData, text} from '@/lib/text';

const $t = text('/terms-and-conditions');
const company = text('settings/seo');

export default function Page_terms_and_conditions() {
  const sections = Object.keys(getSourceData()['/terms-and-conditions'])
    .filter(key => /^section-\d+-title$/.test(key))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
    .map(key => ({title: $t(key), body: $t(key.replace(/title$/, 'body'))}));
  const email = text('global/Site')('email');
  return (
    <main lang="ro" className="mx-auto max-w-[1425px] px-6 pt-[clamp(80px,9vw,130px)] pb-[clamp(80px,10vw,140px)] md:px-8">
      <article className="max-w-[812px]" style={{overflowWrap: 'anywhere'}}>
        <h1 className="font-display text-[clamp(36px,4.4vw,56px)] leading-[1] font-medium tracking-[-0.03em]">{$t('terms-and-conditions')}</h1>
        <p className="mt-[26px] text-[16px] leading-[1.6] text-fg">{$t('updated')}</p>
        <address className="mt-6 space-y-1 text-[16px] leading-[1.6] text-fg-muted not-italic">
          <p className="font-medium text-fg">{company('company-name')} · {company('legal-name')}</p>
          <p>CUI: {company('company-cui')} · Registrul Comerțului: {company('company-reg')}</p>
          <p>Sediul social: {company('company-address')}</p>
          <p>Email: <a className="underline underline-offset-4" href={'mailto:' + email}>{email}</a></p>
          <p>Telefon: <a className="underline underline-offset-4" href={'tel:' + text('components/layout/Footer')('phone-link')}>{company('company-phone')}</a></p>
        </address>
        {sections.map((section, i) => (
          <section key={section.title} className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">{i + 1}. {section.title}</h2>
            {section.body.split('\n\n').map(paragraph => <p key={paragraph} className="mt-2 text-[16px] leading-[1.6] text-fg-muted">{paragraph}</p>)}
          </section>
        ))}
        <div className="mt-6 space-y-1 text-[16px] leading-[1.6] text-fg-muted">
          <p><a className="underline underline-offset-4" href="/politica-de-confidentialitate">Politica de confidențialitate</a></p>
          <p><a className="underline underline-offset-4" href="/politica-de-cookies">Politica de cookie-uri</a></p>
          <p><a className="underline underline-offset-4" href="https://anpc.ro/">Autoritatea Națională pentru Protecția Consumatorilor</a></p>
        </div>
      </article>
    </main>
  );
}
