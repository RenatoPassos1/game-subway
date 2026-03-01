(function() {
  'use strict';

  var API_BASE = '';

  function setApiBase(base) {
    API_BASE = base.replace(/\/$/, '');
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function getToken() {
    try {
      var stored = localStorage.getItem('clickwin_token');
      return stored || null;
    } catch (e) {
      return null;
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported: no service worker');
      return null;
    }
    try {
      var registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
      return null;
    }
  }

  async function getVapidPublicKey() {
    try {
      var res = await fetch(API_BASE + '/push/vapid-public-key');
      var data = await res.json();
      return data.publicKey;
    } catch (err) {
      console.error('Failed to get VAPID key:', err);
      return null;
    }
  }

  async function subscribePush(preferences) {
    var registration = await registerServiceWorker();
    if (!registration) return { success: false, error: 'Service worker not available' };

    var permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    var publicKey = await getVapidPublicKey();
    if (!publicKey) return { success: false, error: 'VAPID key not available' };

    try {
      var subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      var token = await getToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      var subJson = subscription.toJSON();

      var res = await fetch(API_BASE + '/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
          preferences: preferences || undefined,
        }),
      });

      if (!res.ok) {
        var errData = await res.json().catch(function() { return {}; });
        return { success: false, error: errData.message || 'Subscribe failed' };
      }

      return { success: true };
    } catch (err) {
      console.error('Push subscribe error:', err);
      return { success: false, error: err.message };
    }
  }

  async function unsubscribePush() {
    var token = await getToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      var registration = await navigator.serviceWorker.ready;
      var subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch(API_BASE + '/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function isPushSubscribed() {
    try {
      var registration = await navigator.serviceWorker.ready;
      var subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (e) {
      return false;
    }
  }

  async function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Expose globally
  window.ClickWinPush = {
    setApiBase: setApiBase,
    subscribePush: subscribePush,
    unsubscribePush: unsubscribePush,
    isPushSubscribed: isPushSubscribed,
    isPushSupported: isPushSupported,
    registerServiceWorker: registerServiceWorker,
  };
})();
