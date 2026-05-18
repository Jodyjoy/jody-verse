const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, 'public', 'sw.js');

if (fs.existsSync(swPath)) {
  let data = fs.readFileSync(swPath, 'utf8');
  
  const interceptorCode = `// === JODY-VERSE SUPABASE MULTIVERSE INTERCEPTOR ===
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET" && event.request.url.includes("supabase")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => networkResponse)
        .catch(async () => {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            if (name.startsWith("manga-")) {
              const openedCache = await caches.open(name);
              const imageMatch = await openedCache.match(event.request);
              if (imageMatch) {
                return imageMatch;
              }
            }
          }
          return new Response("Offline Content Unavailable", { status: 503 });
        })
    );
  }
});
// === END JODY-VERSE INTERCEPTOR ===\n`;

  // Make sure we don't accidentally double-inject it
  if (!data.includes("JODY-VERSE SUPABASE MULTIVERSE INTERCEPTOR")) {
    fs.writeFileSync(swPath, interceptorCode + data, 'utf8');
    console.log('⚡ Jody-Verse Interceptor successfully injected into compiled Service Worker!');
  } else {
    console.log('✨ Interceptor already present in compiled Service Worker.');
  }
} else {
  console.error('❌ Error: public/sw.js was not found during build phase execution.');
}