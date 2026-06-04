'use client'

import type { ChangeEvent, FormEvent, InputHTMLAttributes } from 'react'
import { useMemo, useState } from 'react'
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
  icon: any
  title: string
  description?: string
  fields: Field[]
}

export default function BooksCrmAddEntityPage({
  sections,
  submitLabel = 'Create',
  redirectOnCancelHref,
}: {
  sections: Section[]
  submitLabel?: string
  redirectOnCancelHref?: string
}) {
  const router = useRouter()

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
    for (const k of fieldKeys) init[k] = ''
    return init
  })

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
    // Placeholder submit - backend not connected yet.
    await new Promise((r) => setTimeout(r, 500))
    setIsSubmitting(false)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <form onSubmit={onSubmit} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-900 font-semibold text-lg mb-2">Validation Error</h4>
                <p className="text-red-700 mb-3">Please fill in all required fields.</p>
                <ul className="list-disc list-inside space-y-1 text-red-700">
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
            icon={section.icon}
            title={section.title}
            description={section.description}
            cardClassName="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6"
            iconContainerClassName="bg-gradient-to-br from-orange-500 to-pink-500"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                const colClass = field.colSpan === 'span2' ? 'lg:col-span-2' : undefined

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
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          common.onChange(e.target.value)}
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
                      />
                    </div>
                  )
                }

                return (
                  <div key={field.key} className={colClass}>
                    <Textarea
                      label={field.label}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={field.rows ?? 3}
                      error={errors[field.key]}
                      value={common.value}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        common.onChange(e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          </FormSectionCard>
        ))}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={() => (redirectOnCancelHref ? router.push(redirectOnCancelHref) : router.back())}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white flex items-center gap-2 min-w-[160px]"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Creating...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

