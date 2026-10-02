// The shape of profiles.preferences. The database only checks it is an object;
// this is where the keys and their defaults are defined.
import { z } from 'zod'

const theme = z.enum(['light', 'dark', 'system'])

export const preferencesSchema = z.object({
  theme: theme.default('system'),
  notifications: z
    .object({
      daily_plan_email: z.boolean().default(false),
      weekly_summary_email: z.boolean().default(false),
    })
    .default({ daily_plan_email: false, weekly_summary_email: false }),
})

export type Preferences = z.infer<typeof preferencesSchema>

/** Whatever is stored, the app gets a complete, valid set: unknown or bad values become defaults. */
export function readPreferences(stored: unknown): Preferences {
  const parsed = preferencesSchema.safeParse(stored ?? {})
  return parsed.success ? parsed.data : preferencesSchema.parse({})
}

/** Applies a partial change on top of what is stored. Throws a ZodError if the change is invalid. */
export function mergePreferences(stored: unknown, change: unknown): Preferences {
  const current = readPreferences(stored)
  const patch = z
    .object({
      theme: theme.optional(),
      notifications: z
        .object({ daily_plan_email: z.boolean(), weekly_summary_email: z.boolean() })
        .partial()
        .optional(),
    })
    .strict()
    .parse(change)
  return {
    theme: patch.theme ?? current.theme,
    notifications: { ...current.notifications, ...patch.notifications },
  }
}
