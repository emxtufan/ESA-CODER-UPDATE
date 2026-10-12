// module 9755
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from '@/lib/navigation';
import RollText from '@/components/RollText';
import countries from './countries';
import timeZoneCountries from './timeZoneCountries';

import {text} from '@/lib/text';

const $t = text("components/contact/ContactForm");

const selectClass =
  'h-10 w-full rounded-[10px] border px-3 text-[14px] transition-colors border-[var(--vv-field-border)] bg-[var(--vv-field-bg)] text-fg-strong focus:border-fg/60 focus:outline-none';
const inputClass =
  'h-10 w-full rounded-[10px] border border-[var(--vv-field-border)] bg-[var(--vv-field-bg)] px-3 text-[14px] text-fg-strong transition-colors placeholder:text-fg-subtle focus:border-fg/60 focus:outline-none';

function CountryCombobox({
  name = 'country',
  placeholder = $t("your-country"),
  value,
  onPick,
}: {
  name?: string;
  placeholder?: string;
  value: string;
  onPick: (country: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? countries.filter((c) =>
          c
            .toLowerCase()
            .split(/[\s-]+/)
            .some((word) => word.startsWith(q)),
        )
      : countries;
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (ev: Event) => {
      rootRef.current?.contains(ev.target as Node) || setOpen(false);
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
    };
  }, [open]);

  useEffect(() => {
    open && listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (country: string) => {
    setQuery('');
    setOpen(false);
    onPick(country);
  };

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={`${selectClass} pr-9 placeholder:text-fg-subtle focus:border-fg/60 focus:outline-none`}
        value={open ? query : value}
        placeholder={(open && value) || placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) return setOpen(true);
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setActive((cur) => (cur + step + filtered.length) % Math.max(filtered.length, 1));
          } else if (e.key === 'Enter' && open) {
            e.preventDefault();
            filtered[active] && pick(filtered[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`pointer-events-none absolute top-5 right-[14px] size-4 -translate-y-1/2 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute top-[44px] right-0 left-0 z-20 max-h-[220px] overflow-y-auto rounded-[10px] border border-fg/20 bg-bg py-1 shadow-[var(--vv-pop-shadow)]"
        >
          {filtered.length ? (
            filtered.map((country, idx) => (
              <li
                key={country}
                role="option"
                aria-selected={country === value}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pick(country);
                }}
                onPointerEnter={() => setActive(idx)}
                className={`cursor-pointer px-3 py-2 text-[14px] ${idx === active ? 'bg-fg/10 text-fg' : 'text-fg-strong'}`}
              >
                {country}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-[14px] text-fg-subtle">{$t("no-match")}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

const projectTypes = [
  $t("website-design"),
  $t("website-redesign"),
  'eCommerce',
  $t("framer-development"),
  $t("wix-studio-development"),
  'Other',
];
const pageCounts = ['1 – 3', '4 – 6', '7 – 10', '10+', $t("not-sure-yet")];
const budgetsUsd = ['$350 – $800', '$800 – $1,500', '$1,500 – $3,000', 'Above $3,000'];
const budgetsInr = [
  '₹20,000 – ₹50,000',
  '₹50,000 – ₹80,000',
  '₹80,000 – ₹1,50,000',
  'Above ₹1,50,000',
];
const INDIA = 'India';
const subscribeNoop = () => () => {};

// Country guessed from the browser time zone
function detectCountry() {
  try {
    return timeZoneCountries[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? '';
  } catch {
    return '';
  }
}

const responseMethods = ['Email', 'WhatsApp'];

function SelectField({
  name,
  placeholder,
  options,
}: {
  name: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <span className="relative block">
      <select name={name} defaultValue="" className={`${selectClass} appearance-none pr-9`}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-[14px] size-4 -translate-y-1/2 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden className="text-blue-500">
        {' '}*
      </span>
      <span className="sr-only">{$t("required")}</span>
    </>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  return message ? (
    <span id={id} role="alert" className="text-[13px] leading-[1.4] text-[#ff6a4d]">
      {message}
    </span>
  ) : null;
}

function Field({
  label,
  required,
  error,
  name,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[14px] leading-[1.4] text-fg-muted">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      {children}
      <FieldError id={name ? `${name}-error` : undefined} message={error} />
    </label>
  );
}

export default function ContactForm() {
  const [budget, setBudget] = useState('');
  const [pickedCountry, setPickedCountry] = useState('');
  const [method, setMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const detected = useSyncExternalStore(subscribeNoop, detectCountry, () => '');
  const country = pickedCountry || detected;
  const clearError = (key: string) => setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  const budgets = country === INDIA ? budgetsInr : budgetsUsd;

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (submitting) return;
    const form = ev.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? '').trim();
    const found: Record<string, string> = {};
    get('name') || (found.name = $t("please-add-your-name"));
    const email = get('email');
    if (email) {
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || (found.email = $t("that-email-address-does-not-look"));
    } else {
      found.email = $t("please-add-your-email");
    }
    get('country') || (found.country = $t("please-choose-your-country"));
    get('budget') || (found.budget = $t("please-choose-a-budget-range"));
    const preferred = get('preferred_response_method');
    preferred || (found.preferred_response_method = $t("please-choose-how-we-should-reply"));
    'WhatsApp' !== preferred ||
      get('phone') ||
      (found.phone = $t("add-a-phone-number-so-we"));
    if (Object.keys(found).length) {
      setErrors(found);
      setFormError(null);
      const first = Object.keys(found)[0];
      const target: any =
        form.querySelector(`[name="${first}"]:not([type="hidden"])`) ??
        form
          .querySelector(`[name="${first}"]`)
          ?.closest('label')
          ?.querySelector('input:not([type="hidden"]), select, textarea, [role="combobox"]') ??
        null;
      target?.focus();
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    setFormError(null);
    try {
      // NOTE: relative endpoint kept as compiled (original site: /api/contact)
      const res = await fetch('/api/contact', { method: 'POST', body: data });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setSubmitting(false);
        setFormError(json?.error ?? $t("your-message-did-not-send-please"));
        return;
      }
      router.push('/contact/thank-you');
    } catch {
      setSubmitting(false);
      setFormError($t("your-message-did-not-send-check"));
    }
  }

  return (
    <form className="flex w-full flex-col gap-6 lg:w-[450px]" onSubmit={onSubmit}>
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <div className="grid grid-cols-2 gap-x-3 gap-y-[21px]">
        <Field label={$t("name")} required name="name" error={errors.name}>
          <input
            name="name"
            autoComplete="name"
            placeholder={$t("name")}
            className={inputClass}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onChange={() => clearError('name')}
          />
        </Field>
        <Field label={$t("email")} required name="email" error={errors.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={$t("email")}
            className={inputClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={() => clearError('email')}
          />
        </Field>
        <Field label={$t("country")} required name="country" error={errors.country}>
          <CountryCombobox
            value={country}
            onPick={(picked) => {
              setPickedCountry(picked);
              clearError('country');
              const nextBudgets = picked === INDIA ? budgetsInr : budgetsUsd;
              budget && !nextBudgets.includes(budget) && setBudget('');
            }}
          />
        </Field>
        <Field label={$t("phone")} required={method === 'WhatsApp'} name="phone" error={errors.phone}>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={$t("phone-number")}
            className={inputClass}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            onChange={() => clearError('phone')}
          />
        </Field>
        <Field label={$t("project-type")}>
          <SelectField name="projectType" placeholder={$t("select")} options={projectTypes} />
        </Field>
        <Field label={$t("number-of-pages")}>
          <SelectField name="pages" placeholder={$t("select")} options={pageCounts} />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[14px] leading-[1.4] text-fg-muted">
          {$t("budget-range")}
          <RequiredMark />
        </legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {budgets.map((option) => (
            <label
              key={option}
              className={`grid h-10 cursor-pointer place-items-center rounded-[10px] border text-[14px] transition-colors ${budget === option ? 'border-blue-500 bg-blue-500/10 text-fg' : 'border-[var(--vv-field-border)] bg-[var(--vv-field-bg)] text-fg-strong'}`}
            >
              <input
                type="radio"
                name="budget"
                value={option}
                checked={budget === option}
                onChange={() => {
                  setBudget(option);
                  clearError('budget');
                }}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
        <FieldError id="budget-error" message={errors.budget} />
      </fieldset>
      <Field label={$t("what-do-you-need-help-with")}>
        <textarea
          name="message"
          rows={3}
          placeholder={$t("tell-us-what-you-re-looking")}
          className="w-full resize-y rounded-[10px] border border-[var(--vv-field-border)] bg-[var(--vv-field-bg)] px-3 py-2.5 text-[14px] leading-[1.6] text-fg-strong transition-colors placeholder:text-fg-subtle focus:border-fg/60 focus:outline-none"
        />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-[14px] leading-[1.4] text-fg-muted">
          {$t("preferred-response-method")}
          <RequiredMark />
        </legend>
        <div className="flex gap-[155px]">
          {responseMethods.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-[14px] text-fg-strong">
              <input
                type="radio"
                name="preferred_response_method"
                value={option}
                checked={method === option}
                onChange={() => {
                  setMethod(option);
                  clearError('preferred_response_method');
                  'WhatsApp' !== option && clearError('phone');
                }}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`grid size-4 place-items-center rounded-full border transition-colors ${method === option ? 'border-blue-500' : 'border-fg/35'}`}
              >
                {method === option ? <span className="size-2 rounded-full bg-blue-500" /> : null}
              </span>
              {option}
            </label>
          ))}
        </div>
        <FieldError id="preferred_response_method-error" message={errors.preferred_response_method} />
      </fieldset>
      {formError ? (
        <p role="alert" className="text-[14px] leading-[1.5] text-[var(--critical,#ff6a4d)]">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="h-[39px] w-[142px] rounded-full bg-fg text-[14px] font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RollText text={submitting ? $t("sending") : $t("submit")} />
      </button>
    </form>
  );
}
