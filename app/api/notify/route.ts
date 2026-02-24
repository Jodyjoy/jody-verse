import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Admin (Needs to fetch from the vault)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// It's best practice to use a SERVICE_ROLE key here if you have one, 
// otherwise the anon key works for testing if RLS allows reading.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Arm the Notification Engine with your VAPID Keys
webpush.setVapidDetails(
  'mailto:jodyjoe019@gmail.com', // Change to your actual email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { title, body, url } = await req.json();

    // 3. Fetch all active subscriptions from your database
    const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
    
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: 'No subscribers found' });
    }

    // 4. Construct the payload
    const notificationPayload = JSON.stringify({ title, body, url });

    // 5. Blast the notification to every device concurrently
    const pushPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (err: any) {
        // 🧹 Auto-cleanup: If a user revoked permissions on their phone, delete them from the DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true, count: subs.length });
    
  } catch (error: any) {
    console.error('Push Broadcast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}