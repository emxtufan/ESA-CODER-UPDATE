import {text} from '@/lib/text';

const $t = text("components/sections/Marquee");

// Server component, converted 1:1 from the RSC payload.
export default function Marquee() {
  return (
    <section className="relative overflow-hidden bg-surface py-5">
      <div className="vv-marquee-track flex w-max text-[24px] leading-[1.2] text-fg-strong" style={{ "--vv-marquee-copies": 5 }}>
        <span className="flex shrink-0 items-center whitespace-nowrap">
          <span className="flex items-center">
            {$t("ui-ux-design")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("brand-identity")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("code-customization")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("website-design-development")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
        </span>
        <span aria-hidden className="flex shrink-0 items-center whitespace-nowrap">
          <span className="flex items-center">
            {$t("ui-ux-design")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("brand-identity")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("code-customization")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("website-design-development")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
        </span>
        <span aria-hidden className="flex shrink-0 items-center whitespace-nowrap">
          <span className="flex items-center">
            {$t("ui-ux-design")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("brand-identity")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("code-customization")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("website-design-development")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
        </span>
        <span aria-hidden className="flex shrink-0 items-center whitespace-nowrap">
          <span className="flex items-center">
            {$t("ui-ux-design")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("brand-identity")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("code-customization")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("website-design-development")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
        </span>
        <span aria-hidden className="flex shrink-0 items-center whitespace-nowrap">
          <span className="flex items-center">
            {$t("ui-ux-design")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("brand-identity")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("code-customization")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
          <span className="flex items-center">
            {$t("website-design-development")}
            <span aria-hidden className="mx-[18px] text-fg-subtle">
              {"•"}
            </span>
          </span>
        </span>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4" style={{ background: "linear-gradient(90deg, var(--vv-surface) 6%, transparent 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/4" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-surface) 94%)" }} />
    </section>
  );
}
