import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load your variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase (Database only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Cloudflare R2 (Storage only)
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function runMigration() {
  console.log("🔍 Fetching existing pages from Supabase Database...");
  const { data: pages, error } = await supabase.from('manga_pages').select('*');

  if (error) {
    console.error("Failed to fetch pages:", error);
    return;
  }

  // Find only the images that are still hosted on Supabase
  const toMigrate = pages.filter(p => p.image_url && p.image_url.includes('supabase.co'));
  console.log(`🚀 Found ${toMigrate.length} pages to migrate to Cloudflare R2.\n`);

  let successCount = 0;

  for (const page of toMigrate) {
    try {
      console.log(`Migrating Page ID ${page.id} (Ch ${page.chapter_id}, Pg ${page.page_number})...`);

      // 1. Download the image buffer directly from the Supabase public URL
      const res = await fetch(page.image_url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract the original folder structure (e.g., manga-1/ch-3/file.png)
      const urlParts = page.image_url.split('/manga-pages/');
      const storagePath = urlParts.length > 1 ? urlParts[1] : `migrated/${Date.now()}-page.png`;

      // 2. Upload the buffer to Cloudflare R2
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: storagePath,
        Body: buffer,
        ContentType: res.headers.get('content-type') || 'image/png',
      }));

      // 3. Update the Database with the new R2 URL
      const newPublicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storagePath}`;
      const { error: updateError } = await supabase
        .from('manga_pages')
        .update({ image_url: newPublicUrl })
        .eq('id', page.id);

      if (updateError) throw updateError;

      console.log(`✅ Success: Moved to ${newPublicUrl}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to migrate Page ID ${page.id}:`, err.message);
    }
  }

  console.log(`\n🎉 Migration Complete! Successfully moved ${successCount}/${toMigrate.length} pages.`);
}

runMigration();