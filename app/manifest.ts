import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Project Rift',
    short_name: 'Rift',
    description: 'The official manga reader for Project Rift.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.jpeg',  // Change .png to .jpeg
        sizes: '192x192',
        type: 'image/jpeg',     // Change png to jpeg
      },
      {
        src: '/icon-512.jpeg',  // Change .png to .jpeg
        sizes: '512x512',
        type: 'image/jpeg',     // Change png to jpeg
      },
    ],
  }
}