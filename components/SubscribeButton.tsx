'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const out     = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
};

interface Props {
  accentColor?: string;
  accentRgb?: string;
}

export default function SubscribeButton({ accentColor = "#8B5CF6", accentRgb = "139,92,246" }: Props) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.pushManager.getSubscription().then(sub => setIsSubscribed(!!sub));
      });
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert("Push notifications aren't supported in your browser.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert("Allow notifications to get chapter alerts!"); return; }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) { alert("Service Worker offline — try refreshing."); return; }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { alert("Notification key missing — restart the server."); return; }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const sub = subscription.toJSON();

      const { error } = await supabase.from('push_subscriptions').insert([{
        endpoint:   sub.endpoint,
        auth_key:   sub.keys?.auth,
        p256dh_key: sub.keys?.p256dh,
      }]);
      if (error && error.code !== '23505') console.error("DB error:", error);

      setIsSubscribed(true);
    } catch (err) {
      console.error('Subscription failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={isSubscribed || loading}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "8px 16px", borderRadius: 2, cursor: isSubscribed || loading ? "default" : "pointer",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.18em",
        border: isSubscribed
          ? `1px solid rgba(${accentRgb},0.35)`
          : "1px solid rgba(255,255,255,0.15)",
        background: isSubscribed
          ? `rgba(${accentRgb},0.1)`
          : "rgba(255,255,255,0.05)",
        color: isSubscribed ? accentColor : "rgba(255,255,255,0.6)",
        transition: "all 0.2s",
      }}
    >
      {isSubscribed ? <BellRing size={13} /> : <Bell size={13} />}
      {isSubscribed ? "Alerts On" : loading ? "Setting up…" : "Get Alerts"}
    </button>
  );
}
