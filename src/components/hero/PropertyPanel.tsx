// module 1659 (inspector property panel)
import type {ReactNode} from 'react';

import {text} from '@/lib/text';

const $t = text("components/hero/PropertyPanel");

const chevronDown = (
  <svg viewBox="0 0 24 24" className="size-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const bar = {rx: 0.75};

const alignIcons = [
  <>
    <rect x="1" y="2" width="1.5" height="12" {...bar} />
    <rect x="4.5" y="5.75" width="9.5" height="4.5" rx="1.6" />
  </>,
  <>
    <rect x="7.25" y="2" width="1.5" height="12" {...bar} />
    <rect x="3.25" y="5.75" width="9.5" height="4.5" rx="1.6" />
  </>,
  <>
    <rect x="2" y="5.75" width="9.5" height="4.5" rx="1.6" />
    <rect x="13.5" y="2" width="1.5" height="12" {...bar} />
  </>,
  <>
    <rect x="2" y="1" width="12" height="1.5" {...bar} />
    <rect x="5.75" y="4.5" width="4.5" height="9.5" rx="1.6" />
  </>,
  <>
    <rect x="2" y="7.25" width="12" height="1.5" {...bar} />
    <rect x="5.75" y="3.25" width="4.5" height="9.5" rx="1.6" />
  </>,
  <>
    <rect x="5.75" y="2" width="4.5" height="9.5" rx="1.6" />
    <rect x="2" y="13.5" width="12" height="1.5" {...bar} />
  </>,
  <>
    <rect x="1" y="2" width="1.5" height="12" {...bar} />
    <rect x="5.75" y="4" width="4.5" height="8" rx="1.6" />
    <rect x="13.5" y="2" width="1.5" height="12" {...bar} />
  </>,
  <>
    <rect x="2" y="1" width="12" height="1.5" {...bar} />
    <rect x="4" y="5.75" width="8" height="4.5" rx="1.6" />
    <rect x="2" y="13.5" width="12" height="1.5" {...bar} />
  </>,
];

function Group({title, plus, children}: {title: string; plus?: boolean; children?: ReactNode}) {
  return (
    <section className={`border-b border-hairline px-[15px] pt-[17px] ${children ? 'pb-4' : 'pb-[17px]'}`}>
      <header className="flex items-center justify-between">
        <p className="font-text text-[13px] leading-[1.2] font-semibold tracking-normal text-fg">{title}</p>
        {plus && (
          <svg viewBox="0 0 24 24" className="size-3 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </header>
      {children && <div className="mt-[17px] flex flex-col gap-2.5">{children}</div>}
    </section>
  );
}

function Row({label, dim, children}: {label: string; dim?: boolean; children?: ReactNode}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_134px] items-center">
      <span className={`pl-[15px] text-[12px] ${dim ? 'text-fg-subtle' : 'text-fg-muted'}`}>{label}</span>
      {children}
    </div>
  );
}

const fieldClass = 'flex h-[30px] items-center rounded-[6px] bg-field px-2.5 text-[12px] text-fg';

function Field({children}: {children?: ReactNode}) {
  return <span className={fieldClass}>{children}</span>;
}

function Select({children}: {children?: ReactNode}) {
  return (
    <span className={`${fieldClass} justify-between gap-0.5 !px-2`}>
      <span className="whitespace-nowrap">{children}</span>
      <span className="text-fg-muted">{chevronDown}</span>
    </span>
  );
}

function Pair({children}: {children?: ReactNode}) {
  return <span className="grid grid-cols-2 gap-2.5">{children}</span>;
}

function Segmented({items, active}: {items: ReactNode[]; active: number}) {
  return (
    <span className="flex h-[30px] gap-0 rounded-[6px] bg-field p-0.5">
      {items.map((item, i) => (
        <span
          key={i}
          className={`flex flex-1 items-center justify-center rounded-[4px] text-[12px] ${i === active ? 'bg-tint-strong shadow-[0_1px_2px_var(--vv-raise-shadow)] text-fg' : 'text-fg-subtle'}`}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

function Slider({pct}: {pct: number}) {
  return (
    <span className="relative flex h-[30px] items-center">
      <span className="h-[2px] w-full rounded-full bg-field" />
      <span className="absolute left-0 h-[2px] rounded-full bg-blue-500" style={{width: `${pct}%`}} />
      <span
        className="absolute size-[11px] -translate-x-1/2 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
        style={{left: `${pct}%`}}
      />
    </span>
  );
}

export default function PropertyPanel({t = (e: string) => e}: {t?: (word: string) => string}) {
  return (
    <div aria-hidden className="w-full select-none">
      <div className="flex items-center justify-between border-b border-hairline px-[15px] py-[22px]">
        {alignIcons.map((icon, i) => (
          <svg key={i} viewBox="0 0 16 16" className="size-4 fill-icon">
            {icon}
          </svg>
        ))}
      </div>
      <Group title={t('Position')}>
        <Row label={t('Type')}>
          <Field>{t('Relative')}</Field>
        </Row>
      </Group>
      <Group title={t('Size')} plus>
        <Row label={t('Width')}>
          <Pair>
            <Field>{$t("1fr")}</Field>
            <Select>{t('Fill')}</Select>
          </Pair>
        </Row>
        <Row label={t('Height')}>
          <Pair>
            <Field>{t('Auto')}</Field>
            <Select>{t('Fit')}</Select>
          </Pair>
        </Row>
        <Row label={t($t("max-width"))}>
          <Pair>
            <Field>1200</Field>
            <Select>{t('Fixed')}</Select>
          </Pair>
        </Row>
      </Group>
      <Group title={t('Layout')}>
        <Row label={t('Direction')}>
          <Segmented
            active={1}
            items={[
              <svg key="h" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
              </svg>,
              <svg key="v" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" />
              </svg>,
            ]}
          />
        </Row>
        <Row label={t('Distribute')}>
          <Select>{t('End')}</Select>
        </Row>
        <Row label={t('Align')}>
          <Segmented
            active={0}
            items={[
              <svg key="0" viewBox="0 0 16 16" className="size-4 fill-current">
                {alignIcons[0]}
              </svg>,
              <svg key="1" viewBox="0 0 16 16" className="size-4 fill-current">
                {alignIcons[1]}
              </svg>,
              <svg key="2" viewBox="0 0 16 16" className="size-4 fill-current">
                {alignIcons[2]}
              </svg>,
            ]}
          />
        </Row>
        <Row label={t('Wrap')}>
          <Segmented active={1} items={['Yes', 'No']} />
        </Row>
        <Row label={t('Gap')}>
          <Pair>
            <Field>15</Field>
            <Slider pct={25} />
          </Pair>
        </Row>
        <Row label={t('Padding')}>
          <Pair>
            <Field>10</Field>
            <Segmented
              active={0}
              items={[
                <svg key="all" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>,
                <svg key="side" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4">
                  <rect x="5" y="5" width="14" height="14" rx="3" />
                </svg>,
              ]}
            />
          </Pair>
        </Row>
      </Group>
      <Group title={t('Effects')} plus>
        <Row label={t('Appear')}>
          <span className={`${fieldClass} gap-2 px-1`}>
            <span className="grid size-[22px] shrink-0 place-items-center rounded-[5px] bg-blue-500">
              <svg viewBox="0 0 24 24" className="size-3.5 fill-white">
                <path d="M12 2.5l1.9 5.35a3 3 0 0 0 1.8 1.8L21 11.5l-5.3 1.85a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.35a3 3 0 0 0-1.8-1.8L3 11.5l5.3-1.85a3 3 0 0 0 1.8-1.8L12 2.5Z" />
              </svg>
            </span>
            {$t("effect")}
          </span>
        </Row>
      </Group>
      <Group title={t('Overlays')} plus />
      <Group title={t('Cursor')} plus />
      <Group title={t('Styles')} plus>
        <Row label={t('Opacity')}>
          <Pair>
            <Field>1</Field>
            <Slider pct={100} />
          </Pair>
        </Row>
        <Row label={t('Visible')} dim>
          <Segmented active={0} items={['True', 'No']} />
        </Row>
      </Group>
    </div>
  );
}
