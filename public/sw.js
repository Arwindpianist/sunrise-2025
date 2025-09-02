// Service Worker for Sunrise PWA Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.message || '',
      icon: '/favicon.svg', // Use favicon instead of missing icon
      badge: '/favicon.svg', // Use favicon instead of missing icon
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.priority === 'high' || data.priority === 'urgent',
      tag: data.tag || 'sunrise-notification',
      renotify: true
    };

    // Special handling for SOS alerts
    if (data.type === 'sos_alert') {
      options.body = `🚨 SOS Alert: ${data.user_name} needs immediate assistance!`;
      options.vibrate = [500, 200, 500, 200, 500]; // More urgent vibration pattern
      options.requireInteraction = true;
      options.tag = 'sos-alert';
      options.actions = [
        {
          action: 'view',
          title: 'View Details'
          // Removed icon reference
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
          // Removed icon reference
        }
      ];
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Sunrise Notification', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app or specific page
    event.waitUntil(
      clients.openWindow('/dashboard/notifications')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

// Handle background sync for offline functionality
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event);
  
  if (event.tag === 'sos-sync') {
    event.waitUntil(handleSosSync());
  }
});

async function handleSosSync() {
  // Handle offline SOS alerts when connection is restored
  console.log('Handling SOS sync...');
}

// Install event - cache important resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open('sunrise-v1').then(function(cache) {
      // Only cache files that exist
      return cache.addAll([
        '/',
        '/dashboard',
        '/dashboard/sos',
        '/dashboard/notifications'
        // Removed icon files that don't exist
      ]).catch(function(error) {
        console.log('Cache addAll failed:', error);
        // Continue installation even if caching fails
        return Promise.resolve();
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== 'sunrise-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
