import { z } from 'zod'

const registrationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Please enter a valid email address')
  .max(254, 'Email address is too long')
  .email('Please enter a valid email address')
  .refine((email) => {
    const [local, domain] = email.split('@')
    return Boolean(local && domain?.includes('.'))
  }, 'Please enter a valid email address')
  .refine((email) => {
    const [local] = email.split('@')
    if (!local) return false
    if (local.startsWith('.') || local.endsWith('.')) return false
    return !/\.\./.test(local)
  }, 'Please enter a valid email address')

export type ParsedRegistrationEmail =
  | { ok: true; email: string }
  | { ok: false; message: string }

export function parseRegistrationEmail(
  email: string
): ParsedRegistrationEmail {
  const result = registrationEmailSchema.safeParse(email)

  if (!result.success) {
    return {
      ok: false,
      message:
        result.error.issues[0]?.message ?? 'Please enter a valid email address',
    }
  }

  return { ok: true, email: result.data }
}

export const registrationEmailZodSchema = registrationEmailSchema
