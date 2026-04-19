"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TextFieldProps extends Omit<React.ComponentProps<"input">, "className"> {
  /** Label. When provided: empty state shows this text in the field; on focus or when filled, label moves above. When label is set, placeholder is not used for the empty state. */
  label?: string;
  /** Optional start adornment (e.g. Search icon). */
  startAdornment?: React.ReactNode;
  /** Optional end adornment (e.g. chevron). */
  endAdornment?: React.ReactNode;
  /** Used only when no label is provided. */
  placeholder?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

/**
 * Text field with native floating-label behavior. When label is provided: empty = label text in field; focus/filled = label above. Same behavior every time.
 */
function TextField({
  label,
  startAdornment,
  endAdornment,
  wrapperClassName,
  inputClassName,
  id: idProp,
  value,
  onFocus,
  onBlur,
  placeholder,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const id = React.useId();
  const inputId = idProp ?? id;
  const [focused, setFocused] = useState(false);
  const hasValue = value != null && String(value).trim() !== "";
  const showLabelAbove = focused || hasValue;
  /** With label: empty state always shows label in the field. Without label: use placeholder. */
  const effectivePlaceholder = showLabelAbove ? undefined : (label != null ? label : (placeholder ?? ""));

  return (
    <div
      className={cn(
        "group flex items-center gap-3 w-full min-h-[64px] pl-4 pr-3 rounded-[8px] border border-[#dadada] transition-[border-color,padding]",
        "focus-within:border-[#101010] focus-within:border-2",
        showLabelAbove && label != null ? "py-2" : "py-3",
        wrapperClassName
      )}
    >
      {startAdornment != null && <div className="shrink-0">{startAdornment}</div>}
      <div className="flex flex-col flex-1 min-w-0 gap-0.5 justify-center">
        {label != null && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-[14px] font-medium leading-[22px] text-[#101010] shrink-0 transition-opacity",
              showLabelAbove ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none"
            )}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={effectivePlaceholder}
          data-slot="text-field-input"
          className={cn(
            "w-full min-w-0 bg-transparent text-[16px] leading-[24px] text-[#101010]",
            "placeholder:text-[#666] outline-none border-0 p-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
          {...inputProps}
        />
      </div>
      {endAdornment != null ? (
        <div className="shrink-0 self-center">{endAdornment}</div>
      ) : null}
    </div>
  );
}

export interface TextAreaFieldProps
  extends Omit<React.ComponentProps<"textarea">, "className"> {
  label?: string;
  placeholder?: string;
  wrapperClassName?: string;
  inputClassName?: string;
}

/** Multiline variant: same floating-label rules as {@link TextField}. */
function TextAreaField({
  label,
  wrapperClassName,
  inputClassName,
  id: idProp,
  value,
  onFocus,
  onBlur,
  placeholder,
  rows = 4,
  ...textareaProps
}: TextAreaFieldProps) {
  const id = React.useId();
  const inputId = idProp ?? id;
  const [focused, setFocused] = useState(false);
  const hasValue = value != null && String(value).trim() !== "";
  const showLabelAbove = focused || hasValue;
  const effectivePlaceholder = showLabelAbove
    ? undefined
    : (label != null ? label : (placeholder ?? ""));

  return (
    <div
      className={cn(
        "group flex w-full min-h-[120px] flex-col gap-0 rounded-[8px] border border-[#dadada] px-4 py-3 transition-[border-color,padding]",
        "focus-within:border-[#101010] focus-within:border-2",
        showLabelAbove && label != null ? "py-2" : "py-3",
        wrapperClassName
      )}
    >
      {label != null && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-[14px] font-medium leading-[22px] text-[#101010] shrink-0 transition-opacity",
            showLabelAbove ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none"
          )}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholder={effectivePlaceholder}
        data-slot="text-area-field-input"
        className={cn(
          "min-h-[88px] w-full min-w-0 flex-1 resize-none bg-transparent text-[16px] leading-[24px] text-[#101010]",
          "placeholder:text-[#666] outline-none border-0 p-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        )}
        {...textareaProps}
      />
    </div>
  );
}

export { TextField, TextAreaField };
