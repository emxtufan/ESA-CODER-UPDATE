import CookieSettingsButton from '@/components/layout/CookieSettingsButton';
import FooterMark from '@/components/layout/FooterMark';
import Link from '@/components/Link';
import RollText from '@/components/RollText';

import {text} from '@/lib/text';

const $t = text("components/layout/Footer");
const site = text("global/Site");

// Server component, converted 1:1 from the RSC payload.
export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-bg pt-[120px]">
      <div className="mx-auto max-w-[1425px] px-6 md:px-8">
        <h2 className="text-center font-display text-[clamp(40px,5.2vw,72px)] leading-[1] font-medium tracking-[-0.06em]">
          {$t("create-bold")}
          <br />
          {$t("deliver-better")}
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href={$t("see-our-work-link")} className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
            <RollText text={$t("see-our-work")} />
          </Link>
          <Link href={$t("get-in-touch-link")} className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
            <RollText text={$t("get-in-touch")} />
          </Link>
        </div>
      </div>
      <FooterMark />
      <div className="mx-auto max-w-[1425px] px-6 md:px-8">
        <div className="relative mt-[172px] backdrop-blur-[20px] md:mt-[305px]" style={{ background: "var(--vv-footer-veil)" }}>
          <div aria-hidden className="pointer-events-none absolute top-0 -right-[100vw] -left-[100vw] border-t border-line" />
          <div className="border-x border-line">
            <ul className="grid grid-cols-2 md:grid-cols-4">
              <li className="border-b border-line md:border-b-0 [&:nth-child(even)]:border-l md:[&:not(:first-child)]:border-l">
                <a href={$t("instagram-link")} target="_blank" rel="noreferrer" className="group/social flex h-[52px] items-center gap-2.5 px-4 text-[12px] text-fg-strong transition-colors hover:text-fg md:h-[62px] md:px-6 md:text-body-s">
                  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                  <span>
                    {$t("instagram")}
                  </span>
                  <span className="ml-auto text-fg-muted transition-transform duration-300 ease-brand group-hover/social:translate-x-1">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              </li>
              <li className="border-b border-line md:border-b-0 [&:nth-child(even)]:border-l md:[&:not(:first-child)]:border-l">
                <a href={$t("linkedin-link")} target="_blank" rel="noreferrer" className="group/social flex h-[52px] items-center gap-2.5 px-4 text-[12px] text-fg-strong transition-colors hover:text-fg md:h-[62px] md:px-6 md:text-body-s">
                  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="currentColor">
                    <path d="M20.45 2H3.55A1.53 1.53 0 0 0 2 3.51v16.98A1.53 1.53 0 0 0 3.55 22h16.9A1.53 1.53 0 0 0 22 20.49V3.51A1.53 1.53 0 0 0 20.45 2ZM8.02 18.34H5.07V9.5h2.95v8.84ZM6.54 8.29a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.4 10.05h-2.94v-4.3c0-1.03-.02-2.35-1.43-2.35-1.44 0-1.66 1.12-1.66 2.28v4.37H9.98V9.5h2.82v1.21h.04a3.1 3.1 0 0 1 2.78-1.53c2.98 0 3.53 1.96 3.53 4.5v4.66Z" />
                  </svg>
                  <span>
                    {$t("linkedin")}
                  </span>
                  <span className="ml-auto text-fg-muted transition-transform duration-300 ease-brand group-hover/social:translate-x-1">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              </li>
              <li className="border-b border-line md:border-b-0 [&:nth-child(even)]:border-l md:[&:not(:first-child)]:border-l">
                <a href={$t("twitter-link")} target="_blank" rel="noreferrer" className="group/social flex h-[52px] items-center gap-2.5 px-4 text-[12px] text-fg-strong transition-colors hover:text-fg md:h-[62px] md:px-6 md:text-body-s">
                  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="currentColor">
                    <path d="M21.5 5.9a7.6 7.6 0 0 1-2.2.6 3.85 3.85 0 0 0 1.69-2.12c-.74.44-1.56.76-2.43.93a3.83 3.83 0 0 0-6.62 2.62c0 .3.03.59.1.87A10.87 10.87 0 0 1 4.15 4.8a3.83 3.83 0 0 0 1.19 5.11c-.63-.02-1.22-.19-1.74-.48v.05a3.83 3.83 0 0 0 3.07 3.75c-.3.09-.63.13-.97.13-.24 0-.47-.02-.69-.07a3.83 3.83 0 0 0 3.58 2.66A7.69 7.69 0 0 1 2.9 17.5a10.84 10.84 0 0 0 5.87 1.72c7.04 0 10.9-5.84 10.9-10.9l-.01-.5a7.77 7.77 0 0 0 1.84-1.92Z" />
                  </svg>
                  <span>
                    {$t("twitter")}
                  </span>
                  <span className="ml-auto text-fg-muted transition-transform duration-300 ease-brand group-hover/social:translate-x-1">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              </li>
              <li className="border-b border-line md:border-b-0 [&:nth-child(even)]:border-l md:[&:not(:first-child)]:border-l">
                <a href={$t("whatsapp-link")} target="_blank" rel="noreferrer" className="group/social flex h-[52px] items-center gap-2.5 px-4 text-[12px] text-fg-strong transition-colors hover:text-fg md:h-[62px] md:px-6 md:text-body-s">
                  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  <span>
                    {$t("whatsapp")}
                  </span>
                  <span className="ml-auto text-fg-muted transition-transform duration-300 ease-brand group-hover/social:translate-x-1">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
              </li>
            </ul>
            <div className="grid grid-cols-2 border-t border-line md:grid-cols-4">
              <div className="border-line px-4 pt-6 pb-6 md:px-6 md:pt-[48px] md:pb-[40px] [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 md:[&:not(:first-child)]:border-l">
                <h3 className="font-text text-[12px] leading-[12px] font-normal text-fg md:text-body-s md:leading-normal md:text-fg-dim">
                  {$t("company")}
                </h3>
                <ul className="mt-[15px] flex flex-col gap-[6px] md:mt-3 md:gap-[8px]">
                  <li>
                    <Link href={$t("about-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("about")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("work-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("work")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("privacy-policy-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("privacy-policy")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("terms-and-conditions-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("terms-and-conditions")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="border-line px-4 pt-6 pb-6 md:px-6 md:pt-[48px] md:pb-[40px] [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 md:[&:not(:first-child)]:border-l">
                <h3 className="font-text text-[12px] leading-[12px] font-normal text-fg md:text-body-s md:leading-normal md:text-fg-dim">
                  {$t("services")}
                </h3>
                <ul className="mt-[15px] flex flex-col gap-[6px] md:mt-3 md:gap-[8px]">
                  <li>
                    <Link href={$t("crafted-websites-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("crafted-websites")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("website-redesign-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("website-redesign")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("ecommerce-design-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("ecommerce-design")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("cms-dynamic-sites-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("cms-dynamic-sites")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="border-line px-4 pt-6 pb-6 md:px-6 md:pt-[48px] md:pb-[40px] [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 md:[&:not(:first-child)]:border-l">
                <h3 className="font-text text-[12px] leading-[12px] font-normal text-fg md:text-body-s md:leading-normal md:text-fg-dim">
                  {$t("resources")}
                </h3>
                <ul className="mt-[15px] flex flex-col gap-[6px] md:mt-3 md:gap-[8px]">
                  <li>
                    <Link href={$t("blog-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("blog")}
                    </Link>
                  </li>
                  <li>
                    <Link href={$t("templates-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("templates")}
                    </Link>
                  </li>
                  <li>
                    <CookieSettingsButton className="block w-full py-1 text-left text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s" />
                  </li>
                  <li>
                    <Link href={$t("faqs-link")} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("faqs")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="border-line px-4 pt-6 pb-6 md:px-6 md:pt-[48px] md:pb-[40px] [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 md:[&:not(:first-child)]:border-l">
                <h3 className="font-text text-[12px] leading-[12px] font-normal text-fg md:text-body-s md:leading-normal md:text-fg-dim">
                  {$t("contact")}
                </h3>
                <ul className="mt-[15px] flex flex-col gap-[6px] md:mt-3 md:gap-[8px]">
                  <li>
                    <Link href={`mailto:${site("email")}`} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {`${$t("email-prefix")}${site("email")}`}
                    </Link>
                  </li>
                  <li>
                    <Link href={`tel:${$t("phone-link")}`} className="block py-1 text-[12px] leading-[1.3] text-fg-strong transition-colors hover:text-fg md:text-body-s">
                      {$t("phone-91-9278388499")}
                    </Link>
                  </li>
                  <li>
                    <span className="block py-1 text-[12px] leading-[1.3] text-fg-strong md:text-body-s">
                      {$t("based-in-india")}
                    </span>
                  </li>
                  <li>
                    <span className="block py-1 text-[12px] leading-[1.3] text-fg-strong md:text-body-s">
                      {$t("serving-the-us-uk-worldwide")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="relative">
            <div aria-hidden className="pointer-events-none absolute top-0 -right-[100vw] -left-[100vw] border-t border-line" />
            <p className="py-[22px] text-center text-caption text-fg-dim">
              {"© "}
              {2026}
              {$t("visuvate-all-rights-reserved")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
