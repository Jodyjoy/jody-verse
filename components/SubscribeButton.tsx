'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function SubscribeButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // FIX 1: Use getRegistration instead of ready so it doesn't hang
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.pushManager.getSubscription().then((subscription) => {
            setIsSubscribed(!!subscription);
          });
        }
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
      if (permission !== 'granted') {
        alert("You need to allow notifications to get Jody-Verse updates!");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
         alert("Service Worker is offline! Try refreshing the page or building the app.");
         return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
          alert("VAPID Public Key is missing! Did you restart the server?");
          return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subJSON = subscription.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .insert([{
          endpoint: subJSON.endpoint,
          auth_key: subJSON.keys?.auth,
          p256dh_key: subJSON.keys?.p256dh
        }]);

      if (error && error.code !== '23505') { 
        console.error("Database error:", error);
      }

      setIsSubscribed(true);
      alert("Success! You'll now be notified when new chapters drop. 🚀");
      
    } catch (error) {
      console.error('Subscription failed:', error);
      alert("Something went wrong setting up notifications. Check the console!");
    } finally {
      // FIX 2: The finally block ensures the loading spinner ALWAYS stops, even on errors
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSubscribe}
      disabled={isSubscribed || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
        isSubscribed 
          ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50 cursor-default' 
          : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/50'
      }`}
    >
      {isSubscribed ? <BellRing size={18} /> : <Bell size={18} />}
      {isSubscribed ? 'Alerts On' : loading ? 'Setting up...' : 'Get Chapter Alerts'}
    </button>
  );
}