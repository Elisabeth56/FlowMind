import type { MetadataRoute } from 'next'

// What Chrome and Android use when FlowMind is installed as an app. It opens on the
// inbox in its own window; the colours are the light theme's (the page sets the bar's
// colour itself once it knows the theme).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlowMind',
    short_name: 'FlowMind',
    description: 'Drop in notes, tasks and ideas. FlowMind files them, plans your day and tells you what can wait.',
    start_url: '/dash',
    scope: '/',
    display: 'standalone',
    background_color: '#F2F0EC',
    theme_color: '#F2F0EC',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
