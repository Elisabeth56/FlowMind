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
  const theme = resolveTheme(choice, window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = theme
  setBarColour(theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // private windows may refuse storage; the theme still applies for this visit
  }
}

// The browser's and the installed app's title bar, which would otherwise stay light over a dark page
const BAR_COLOUR = { light: '#F2F0EC', dark: '#161615' }

export function setBarColour(theme: 'light' | 'dark') {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOUR[theme])
}

// Runs before the first paint, so a dark-theme user never sees a light flash.
// Kept in step with resolveTheme() above.
export const themeScript = `(function(){try{var c=localStorage.getItem('${THEME_STORAGE_KEY}');var d=c==='dark'||(c!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.getElementById('${APP_ROOT_ID}').dataset.theme=d?'dark':'light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${BAR_COLOUR.dark}':'${BAR_COLOUR.light}')}catch(e){}})()`
