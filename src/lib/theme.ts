// The app's theme. The choice is stored in profiles.preferences; a copy in
// localStorage lets the page pick the right colours before the profile has loaded.
import type { Preferences } from './preferences'

export type ThemeChoice = Preferences['theme']

export const THEME_STORAGE_KEY = 'fm-theme'
export const APP_ROOT_ID = 'fm-app'

/** "system" follows the device; anything unknown is treated as "system". */
export function resolveTheme(choice: string | null | undefined, deviceIsDark: boolean): 'light' | 'dark' {
  if (choice === 'light' || choice === 'dark') return choice
  return deviceIsDark ? 'dark' : 'light'
}

/** Sets the theme on the app's root element and remembers the choice for the next load. */
export function applyTheme(choice: ThemeChoice) {
  const root = document.getElementById(APP_ROOT_ID)
  if (!root) return
  root.dataset.theme = resolveTheme(choice, window.matchMedia('(prefers-color-scheme: dark)').matches)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // private windows may refuse storage; the theme still applies for this visit
  }
}

// Runs before the first paint, so a dark-theme user never sees a light flash.
// Kept in step with resolveTheme() above.
export const themeScript = `(function(){try{var c=localStorage.getItem('${THEME_STORAGE_KEY}');var d=c==='dark'||(c!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.getElementById('${APP_ROOT_ID}').dataset.theme=d?'dark':'light'}catch(e){}})()`
