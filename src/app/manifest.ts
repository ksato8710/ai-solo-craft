import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Solo Craft',
    short_name: 'AI Solo Craft',
    description: 'AIソロ開発者のためのニュースキュレーション',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5',
    theme_color: '#FAFAF5',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
