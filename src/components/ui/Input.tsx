'use client'

import { useId } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from './cn'

const fieldClass =
  'w-full min-h-11 rounded-row border bg-surface px-4 text-body text-ink placeholder:text-ink-3 ' +
  'transition-[border-color,box-shadow] duration-200 ease-ui focus:border-accent focus:outline-none focus:shadow-focus'

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** Says how to fix it; shown under the field and announced */
  error?: string
  hint?: string
}

/** A form field. The label is always visible above it; the placeholder is an example, never the label. */
export function Field({ label, error, hint, className, id, ...props }: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const noteId = `${fieldId}-note`
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-2 block text-label text-ink">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? noteId : undefined}
        className={cn(fieldClass, error ? 'border-danger' : 'border-hairline')}
        {...props}
      />
      {(error || hint) && (
        <p id={noteId} className={cn('mt-2 text-small', error ? 'text-danger' : 'text-ink-3')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }

/** A labelled dropdown, for a choice among many options. */
export function Select({ label, hint, className, id, children, ...props }: SelectProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-2 block text-label text-ink">
        {label}
      </label>
      <select id={fieldId} aria-describedby={hint ? `${fieldId}-note` : undefined} className={cn(fieldClass, 'border-hairline')} {...props}>
        {children}
      </select>
      {hint && (
        <p id={`${fieldId}-note`} className="mt-2 text-small text-ink-3">
          {hint}
        </p>
      )}
    </div>
  )
}

/** The capture bar: the app's most used control. It floats, and Enter saves. */
export function CaptureBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Drop anything in. A task, a note, a link.',
  inputRef,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  inputRef?: React.Ref<HTMLInputElement>
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim()) onSubmit()
      }}
      className="flex items-center gap-2 rounded-full bg-surface py-2 pl-6 pr-2 shadow-soft focus-within:shadow-[var(--fm-shadow-soft),var(--fm-shadow-focus)]"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Capture"
        className="min-h-11 flex-1 bg-transparent text-body text-ink placeholder:text-ink-3 focus:outline-none focus:shadow-none"
      />
      <button
        type="submit"
        aria-label="Save"
        disabled={!value.trim()}
        className="grid size-11 place-items-center rounded-full bg-accent text-on-accent transition-[transform,opacity] duration-200 ease-ui active:scale-[0.96] disabled:opacity-40"
      >
        <ArrowUp className="size-5" strokeWidth={1.75} />
      </button>
    </form>
  )
}
