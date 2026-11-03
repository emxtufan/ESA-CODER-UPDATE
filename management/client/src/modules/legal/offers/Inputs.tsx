/** Câmpuri numerice cu virgulă zecimală: bani în unități majore (salvați în minore) și numere simple. */
import { cloneElement, isValidElement, useEffect, useId, useState } from "react";

import { Field, Input, type FieldProps, type InputProps } from "@/components/ui";

import { minorToText, numberToText, parseNumber } from "./lib";

type Base = Omit<InputProps, "value" | "onChange" | "type">;

/** Suma în unități majore („400”, „49,90”); valoarea externă e în unități minore. */
export function MoneyInput({
  value,
  onChange,
  nullable = false,
  ...rest
}: Base & { value: number | null; onChange: (minor: number | null) => void; nullable?: boolean }) {
  const [text, setText] = useState(minorToText(value));
  const parse = (t: string): number | null => {
    const n = parseNumber(t);
    return n === null ? null : Math.max(0, Math.round(n * 100));
  };
  useEffect(() => {
    const current = parse(text);
    if (current !== value && !(current === null && (value === null || (!nullable && value === 0)))) setText(minorToText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Input
      {...rest}
      inputMode="decimal"
      value={text}
      invalid={rest.invalid || (text.trim() !== "" && parse(text) === null)}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parse(event.target.value);
        if (event.target.value.trim() === "") onChange(nullable ? null : 0);
        else if (parsed !== null) onChange(parsed);
      }}
    />
  );
}

/** Număr zecimal (cantitate, procent, zile). */
export function NumInput({
  value,
  onChange,
  min,
  max,
  integer = false,
  ...rest
}: Base & { value: number; onChange: (n: number) => void; min?: number; max?: number; integer?: boolean }) {
  const [text, setText] = useState(numberToText(value));
  useEffect(() => {
    if (parseNumber(text) !== value && !(parseNumber(text) === null && value === 0)) setText(numberToText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Input
      {...rest}
      inputMode="decimal"
      value={text}
      invalid={rest.invalid || (text.trim() !== "" && parseNumber(text) === null)}
      onChange={(event) => {
        setText(event.target.value);
        let n = parseNumber(event.target.value);
        if (event.target.value.trim() === "") n = 0;
        if (n === null) return;
        if (integer) n = Math.trunc(n);
        if (min !== undefined) n = Math.max(min, n);
        if (max !== undefined) n = Math.min(max, n);
        onChange(n);
      }}
    />
  );
}

/** `Field` cu eticheta legată de control (id generat), pentru accesibilitate și teste. */
export function LabeledField({ children, ...props }: FieldProps) {
  const id = useId();
  const child = isValidElement<{ id?: string }>(children) ? cloneElement(children, { id: children.props.id ?? id }) : children;
  return (
    <Field {...props} htmlFor={props.htmlFor ?? id}>
      {child}
    </Field>
  );
}
