// Service Worker for Sunrise PWA Push Notifications
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.message || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.priority === 'high' || data.priority === 'urgent',
      tag: data.tag || 'sunrise-notification',
      renotify: true
    };

    // Special handling for SOS alerts
    if (data.type === 'sos_alert') {
      // Enhanced emergency notification options
      options.body = `🚨 URGENT SOS ALERT: ${data.user_name} needs IMMEDIATE assistance!`;
      options.vibrate = [1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000]; // Extended urgent vibration pattern
      options.requireInteraction = true;
      options.tag = `sos-alert-${Date.now()}`;
      options.silent = false; // Force sound for SOS
      options.renotify = true; // Allow renotifying
      options.actions = [
        {
          action: 'view',
          title: '🚨 VIEW EMERGENCY'
        },
        {
          action: 'acknowledge',
          title: '✓ I\'M RESPONDING'
        },
        {
          action: 'call',
          title: '📞 CALL NOW'
        }
      ];
      
      // Play emergency sounds for SOS alerts
      try {
        // Import and use emergency sound generator
        importScripts('/emergency-sound.js');
        
        // Create emergency sound generator instance
        const soundGenerator = new EmergencySoundGenerator();
        
        // Play SOS pattern immediately
        soundGenerator.generateSOSPattern();
        
        // Play escalating pattern after 5 seconds
        setTimeout(() => {
          soundGenerator.generateEscalatingPattern();
        }, 5000);
        
        // Play critical pattern after 15 seconds
        setTimeout(() => {
          soundGenerator.generateCriticalPattern();
        }, 15000);
        
      } catch (e) {
        console.log('Emergency sound generation failed:', e);
        
        // Fallback to basic audio
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO+eizEIHWq+8+OWT');
          audio.volume = 1.0;
          audio.play().catch(e => console.log('Fallback audio play failed:', e));
        } catch (fallbackError) {
          console.log('Fallback audio creation failed:', fallbackError);
        }
      }
      
      // Show multiple SOS notifications with escalating urgency
      event.waitUntil(
        Promise.all([
          // Immediate notification
          self.registration.showNotification(data.title || '🚨 URGENT SOS ALERT', options),
          
          // First reminder after 10 seconds
          new Promise(resolve => setTimeout(resolve, 10000)).then(() => {
            return self.registration.showNotification(
              '🚨 SOS ALERT - 10s Reminder',
              {
                ...options,
                body: `🚨 ${data.user_name} still needs assistance! Please respond immediately!`,
                tag: `sos-reminder-10s-${Date.now()}`,
                vibrate: [2000, 1000, 2000, 1000, 2000] // More intense vibration
              }
            );
          }),
          
          // Second reminder after 30 seconds
          new Promise(resolve => setTimeout(resolve, 30000)).then(() => {
            return self.registration.showNotification(
              '🚨 SOS ALERT - 30s URGENT',
              {
                ...options,
                body: `🚨 CRITICAL: ${data.user_name} needs IMMEDIATE help! This is your final alert!`,
                tag: `sos-reminder-30s-${Date.now()}`,
                vibrate: [3000, 500, 3000, 500, 3000, 500, 3000] // Most intense vibration
              }
            );
          }),
          
          // Final escalation after 60 seconds
          new Promise(resolve => setTimeout(resolve, 60000)).then(() => {
            return self.registration.showNotification(
              '🚨 SOS ALERT - FINAL ESCALATION',
              {
                ...options,
                body: `🚨 EMERGENCY: ${data.user_name} has been waiting for 1 minute! IMMEDIATE ACTION REQUIRED!`,
                tag: `sos-escalation-60s-${Date.now()}`,
                vibrate: [5000, 1000, 5000, 1000, 5000, 1000, 5000, 1000, 5000] // Maximum intensity
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
  } else if (event.action === 'acknowledge') {
    // Handle acknowledge action for SOS alerts
    const data = event.notification.data;
    
    if (data && data.type === 'sos_alert') {
      // Send acknowledgment to the server
      event.waitUntil(
        fetch('/api/sos/acknowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sos_alert_id: data.sos_alert_id,
            acknowledged_at: new Date().toISOString()
          })
        }).then(response => {
          if (response.ok) {
            console.log('SOS alert acknowledged successfully');
            // Show confirmation notification
            return self.registration.showNotification(
              '✓ SOS Alert Acknowledged',
              {
                body: `You have acknowledged the SOS alert from ${data.user_name}`,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'sos-acknowledged',
                silent: true
              }
            );
          } else {
            console.error('Failed to acknowledge SOS alert');
          }
        }).catch(error => {
          console.error('Error acknowledging SOS alert:', error);
        })
      );
    }
  } else if (event.action === 'call') {
    // Handle call action for SOS alerts
    const data = event.notification.data;
    
    if (data && data.type === 'sos_alert' && data.user_phone) {
      // Open phone dialer with the emergency contact's number
      event.waitUntil(
        clients.openWindow(`tel:${data.user_phone}`)
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
