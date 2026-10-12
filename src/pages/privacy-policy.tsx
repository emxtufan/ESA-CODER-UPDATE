import {text} from '@/lib/text';

const $t = text("/privacy-policy");

// Converted 1:1 from the RSC payload of /privacy-policy.
export default function Page_privacy_policy() {
  return (
    <>
      <main className="mx-auto max-w-[1425px] px-6 pt-[clamp(80px,9vw,130px)] pb-[clamp(80px,10vw,140px)] md:px-8">
        <article className="max-w-[812px]">
          <h1 className="font-display text-[clamp(36px,4.4vw,56px)] leading-[1] font-medium tracking-[-0.03em]">
            {$t("privacy-policy")}
          </h1>
          <p className="mt-[26px] text-[16px] leading-[1.6] text-fg">
            {$t("last-updated-december-2025")}
          </p>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("1-introduction")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("visuvate-studio-we-us-or-our")}
            </p>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("2-information-we-collect")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("we-may-collect-personal-information-that")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-[26px] marker:text-fg-subtle">
              <li className="text-[16px] leading-[1.6] text-fg-muted">
                {$t("contact-data-your-name-email-address")}
              </li>
              <li className="text-[16px] leading-[1.6] text-fg-muted">
                {$t("usage-data-information-on-how-you")}
              </li>
            </ul>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("3-how-we-use-your-data")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("we-use-your-information-solely-for")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-[26px] marker:text-fg-subtle">
              <li className="text-[16px] leading-[1.6] text-fg-muted">
                {$t("responding-to-your-project-inquiries-and")}
              </li>
              <li className="text-[16px] leading-[1.6] text-fg-muted">
                {$t("sending-administrative-information-such-as")}
              </li>
              <li className="text-[16px] leading-[1.6] text-fg-muted">
                {$t("improving-our-website-functionality-and-security")}
              </li>
            </ul>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("4-third-party-sharing")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("we-do-not-sell-trade-or")}
            </p>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("5-cookies")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("we-use-one-optional-cookie-and")}
            </p>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("6-your-rights-gdpr-ccpa")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("depending-on-your-location-you-have")}
            </p>
          </section>
          <section className="mt-[42px]">
            <h2 className="text-[18px] leading-[1.6] font-medium text-fg">
              {$t("7-contact-us")}
            </h2>
            <p className="mt-2 text-[16px] leading-[1.6] text-fg-muted">
              {$t("if-you-have-questions-about-this")}
            </p>
          </section>
          <address className="mt-6 space-y-1 text-[16px] leading-[1.6] text-fg-muted not-italic">
            <p>
              {$t("visuvate-studio")}
            </p>
            <p>
              {$t("gorakhpur-uttar-pradesh-india")}
            </p>
            <p>
              {$t("email-contact-visuvate-com")}
            </p>
          </address>
        </article>
      </main>
    </>
  );
}
