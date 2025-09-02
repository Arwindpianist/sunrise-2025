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
      options.body = `🚨 URGENT SOS ALERT: ${data.user_name} needs IMMEDIATE assistance!`;
      options.vibrate = [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]; // Very urgent vibration pattern
      options.requireInteraction = true;
      options.tag = `sos-alert-${Date.now()}`; // Unique tag for each SOS alert
      options.silent = false; // Force sound for SOS
      options.actions = [
        {
          action: 'view',
          title: '🚨 VIEW NOW'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ];
      
      // Play emergency sound for SOS alerts
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 1.0;
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Audio creation failed:', e);
      }
      
      // Show SOS notification multiple times to ensure it's not missed
      event.waitUntil(
        Promise.all([
          self.registration.showNotification(data.title || '🚨 URGENT SOS ALERT', options),
          // Show a second notification after 5 seconds if first one is dismissed
          new Promise(resolve => setTimeout(resolve, 5000)).then(() => {
            return self.registration.showNotification(
              '🚨 SOS ALERT - Still Active',
              {
                ...options,
                body: `🚨 ${data.user_name} still needs assistance! Please respond immediately!`,
                tag: `sos-reminder-${Date.now()}`
              }
            );
          })
        ])
      );
    } else {
      // Regular notifications
      event.waitUntil(
        self.registration.showNotification(data.title || 'Sunrise Notification', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app or specific page based on notification type
    const data = event.notification.data;
    
    if (data && data.type === 'sos_alert') {
      // For SOS alerts, open the SOS page directly
      event.waitUntil(
        clients.openWindow('/dashboard/sos')
      );
    } else {
      // For other notifications, open the notifications page
      event.waitUntil(
        clients.openWindow('/dashboard/notifications')
      );
    }
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
