'use client'

import type { ChangeEvent, FormEvent, InputHTMLAttributes } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import { Button, FormSectionCard, Input, Select, Textarea } from '@webfudge/ui'

type SelectOption = { value: string; label: string }

type Field =
  | {
      key: string
      type: 'input'
      label: string
      placeholder?: string
      required?: boolean
      inputType?: InputHTMLAttributes<HTMLInputElement>['type']
      colSpan?: 'full' | 'span2'
    }
  | {
      key: string
      type: 'select'
      label: string
      placeholder?: string
      required?: boolean
      options: SelectOption[]
      colSpan?: 'full' | 'span2'
    }
  | {
      key: string
      type: 'textarea'
      label: string
      placeholder?: string
      required?: boolean
      rows?: number
      colSpan?: 'full' | 'span2'
    }

type Section = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  fields: Field[]
}

const booksFieldContainerClass =
  '[&_label]:text-[var(--books-text-secondary,#9ca3af)] [&_p.text-red-600]:text-red-400'

const booksInputClass =
  'rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)] shadow-sm placeholder:text-[var(--books-input-placeholder,#6b7280)] focus:border-orange-400/70 focus:ring-orange-500/25'

const booksSelectClass =
  'rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)]'

export default function BooksCrmAddEntityPage({
  sections,
  submitLabel = 'Create',
  redirectOnCancelHref,
  redirectOnSuccessHref,
  initialValues,
  onSubmitSuccess,
  theme = 'books',
  embedded = false,
}: {
  sections: Section[]
  submitLabel?: string
  redirectOnCancelHref?: string
  redirectOnSuccessHref?: string
  initialValues?: Record<string, string>
  onSubmitSuccess?: (values: Record<string, string>) => void | Promise<void>
  theme?: 'default' | 'books'
  /** When true, omit outer page padding/background (use inside entity pages). */
  embedded?: boolean
}) {
  const router = useRouter()
  const isBooks = theme === 'books'

  const fieldKeys = useMemo(() => sections.flatMap((s) => s.fields.map((f) => f.key)), [sections])
  const keyToLabel = useMemo(() => {
    const map: Record<string, string> = {}
    for (const section of sections) {
      for (const f of section.fields) map[f.key] = f.label
    }
    return map
  }, [sections])

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const k of fieldKeys) {
      if (initialValues?.[k]) {
        init[k] = initialValues[k]
      } else if (k === 'type') {
        init[k] = 'Service'
      } else if (k === 'status') {
        init[k] = 'Active'
      } else if (k === 'unit') {
        init[k] = 'fixed'
      } else {
        init[k] = ''
      }
    }
    return init
  })

  useEffect(() => {
    if (!initialValues) return
    setValues((prev) => {
      const next = { ...prev }
      for (const k of fieldKeys) {
        if (initialValues[k] !== undefined) next[k] = initialValues[k]
      }
      return next
    })
  }, [initialValues, fieldKeys])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiredFields = useMemo(() => {
    return sections.flatMap((s) => s.fields.filter((f) => f.required).map((f) => f.key))
  }, [sections])

  const validate = () => {
    const next: Record<string, string> = {}
    for (const key of requiredFields) {
      const v = values[key] ?? ''
      if (!v || String(v).trim().length === 0) {
        next[key] = 'Required'
      }
    }
    return next
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      if (onSubmitSuccess) {
        await onSubmitSuccess(values)
      } else {
        await new Promise((r) => setTimeout(r, 500))
      }
      if (redirectOnSuccessHref) {
        router.replace(redirectOnSuccessHref)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={
        embedded
          ? 'space-y-6'
          : isBooks
            ? 'min-h-full space-y-6 bg-[var(--books-bg-page)] p-4 md:p-6'
            : 'min-h-full space-y-6 bg-white p-4 md:p-6'
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div
            className={
              isBooks
                ? 'rounded-xl border border-red-500/40 bg-red-500/10 p-5 shadow-lg'
                : 'rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-lg'
            }
          >
            <div className="flex items-start gap-3">
              <AlertCircle className={`mt-0.5 h-6 w-6 shrink-0 ${isBooks ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <h4 className={`mb-2 text-lg font-semibold ${isBooks ? 'text-red-300' : 'text-red-900'}`}>
                  Validation Error
                </h4>
                <p className={`mb-3 ${isBooks ? 'text-red-200/90' : 'text-red-700'}`}>
                  Please fill in all required fields.
                </p>
                <ul className={`list-inside list-disc space-y-1 ${isBooks ? 'text-red-200/90' : 'text-red-700'}`}>
                  {Object.keys(errors).map((k) => (
                    <li key={k} className="font-medium">
                      {keyToLabel[k] ?? k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {sections.map((section) => (
          <FormSectionCard
            key={section.title}
            theme={theme}
            icon={section.icon}
            title={section.title}
            description={section.description}
            cardClassName={
              isBooks
                ? 'border border-[color:var(--books-border,rgba(255,255,255,0.08))] !bg-[var(--books-bg-card,#1e2128)] shadow-[var(--books-shell-shadow)]'
                : 'rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl'
            }
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field) => {
                const common = {
                  value: values[field.key] ?? '',
                  onChange: (v: string) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: v,
                    })),
                  error: errors[field.key],
                }

                const colClass =
                  field.colSpan === 'span2'
                    ? 'lg:col-span-2'
                    : field.colSpan === 'full'
                      ? 'md:col-span-2 lg:col-span-3'
                      : undefined

                if (field.type === 'input') {
                  return (
                    <div key={field.key} className={colClass}>
                      <Input
                        label={field.label}
                        placeholder={field.placeholder}
                        required={field.required}
                        type={field.inputType ?? 'text'}
                        error={errors[field.key]}
                        value={common.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => common.onChange(e.target.value)}
                        className={isBooks ? booksInputClass : undefined}
                        containerClassName={isBooks ? booksFieldContainerClass : undefined}
                      />
                    </div>
                  )
                }

                if (field.type === 'select') {
                  return (
                    <div key={field.key} className={colClass}>
                      <Select
                        label={field.label}
                        placeholder={field.placeholder ?? 'Select an option'}
                        required={field.required}
                        error={errors[field.key]}
                        value={common.value}
                        onChange={(v: string) => common.onChange(v)}
                        options={field.options}
                        className={isBooks ? booksSelectClass : undefined}
                        containerClassName={isBooks ? booksFieldContainerClass : undefined}
                      />
                    </div>
                  )
                }

                return (
                  <div key={field.key} className={colClass}>
                    <div className={isBooks ? booksFieldContainerClass : undefined}>
                      <Textarea
                        label={field.label}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={field.rows ?? 3}
                        error={errors[field.key]}
                        value={common.value}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => common.onChange(e.target.value)}
                        className={isBooks ? booksInputClass : undefined}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </FormSectionCard>
        ))}

        <div
          className={`flex items-center justify-between border-t pt-6 ${
            isBooks ? 'border-[color:var(--books-border,rgba(255,255,255,0.08))]' : 'border-gray-200'
          }`}
        >
          <Button
            type="button"
            onClick={() => (redirectOnCancelHref ? router.push(redirectOnCancelHref) : router.back())}
            variant="outline"
            className={
              isBooks
                ? 'flex items-center gap-2 border-[color:var(--books-border)] text-[var(--books-text-primary)] hover:bg-[var(--books-bg-card)]'
                : 'flex items-center gap-2'
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="flex min-w-[160px] items-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">{submitLabel.endsWith('e') ? `${submitLabel.slice(0, -1)}ing…` : 'Saving…'}</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
