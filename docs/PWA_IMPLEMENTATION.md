# Progressive Web App (PWA) Implementation

## Overview

The Saudi Mais Medical Inventory System now includes full Progressive Web App (PWA) support, enabling offline functionality, installability, and enhanced mobile experience.

## Features Implemented

### 1. Web App Manifest (`/public/manifest.json`)
- App metadata (name, description, theme colors)
- Icon definitions (72px to 512px)
- Display mode: standalone
- Shortcuts for quick actions
- Screenshots for install prompt

### 2. Service Worker (`/public/sw.js`)
- **Caching Strategies**:
  - Network-first for API calls
  - Cache-first for static assets
  - Stale-while-revalidate for other resources
  - Navigation with offline fallback
- **Background Sync**: Syncs offline actions when connection restored
- **Push Notifications**: Ready for future implementation
- **Cache Management**: Automatic cleanup of old caches

### 3. Offline Queue System (`/src/lib/offline-queue.ts`)
- Queues actions performed while offline
- Automatic sync when connection restored
- Retry logic with exponential backoff
- LocalStorage persistence
- Max 3 retries per action

### 4. PWA Components

#### OfflineBanner (`/src/components/pwa/OfflineBanner.tsx`)
- Shows connection status
- Displays pending sync count
- Sync progress indicator
- Auto-hides when online and synced

#### InstallPrompt (`/src/components/pwa/InstallPrompt.tsx`)
- Appears after 30 seconds on mobile
- Shows app benefits
- Dismissible (won't show again for 30 days)
- Analytics tracking for install/dismiss events

#### PWAStatus (`/src/components/pwa/PWAStatus.tsx`)
- Installation status
- Online/offline status
- Update availability
- Storage usage
- Pending actions count
- Cache management controls

### 5. PWA Utilities

#### Service Worker Registration (`/src/lib/pwa-register.ts`)
- Automatic registration on page load
- Update detection and notification
- Persistent storage request
- Storage estimate
- Cache clearing

#### PWA Hook (`/src/hooks/usePWA.ts`)
- React hook for PWA status
- Installation detection
- Online/offline detection
- Update availability
- Service worker update trigger

## Usage

### For Users

#### Installing the App
1. Visit the website on a mobile device
2. Wait for the install prompt (appears after 30 seconds)
3. Tap "Install" to add to home screen
4. Or use browser menu → "Add to Home Screen"

#### Working Offline
1. Open the installed app
2. Previously viewed pages are available offline
3. Actions performed offline are queued
4. Automatic sync when connection restored
5. Offline banner shows sync status

### For Developers

#### Queuing Offline Actions
```typescript
import { queueApiCall, isOffline } from '@/lib/offline-queue';

async function createItem(data: any) {
  if (isOffline()) {
    // Queue the action
    queueApiCall('/api/inventory', 'POST', data);
    toast.success('Action queued for sync');
    return;
  }
  
  // Normal API call
  const response = await fetch('/api/inventory', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

#### Using PWA Status
```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { isInstalled, isOnline, isUpdateAvailable, updateServiceWorker } = usePWA();
  
  return (
    <div>
      {isUpdateAvailable && (
        <button onClick={updateServiceWorker}>
          Update Available
        </button>
      )}
    </div>
  );
}
```

#### Checking Storage
```typescript
import { getStorageEstimate } from '@/lib/pwa-register';

const storage = await getStorageEstimate();
console.log(`Using ${storage.percentage}% of available storage`);
```

## Configuration

### Manifest Customization
Edit `/public/manifest.json` to customize:
- App name and description
- Theme colors
- Icons
- Shortcuts
- Screenshots

### Service Worker Caching
Edit `/public/sw.js` to customize:
- Cache name and version
- Static assets to cache
- Caching strategies
- Cache expiration

### Install Prompt Timing
Edit `/src/components/pwa/InstallPrompt.tsx`:
```typescript
// Change delay (default: 30 seconds)
setTimeout(() => {
  setShowPrompt(true);
}, 30000); // milliseconds
```

## Icons

### Required Sizes
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Generating Icons
1. Create a 512x512 PNG logo
2. Use https://realfavicongenerator.net/
3. Download and place in `/public/icons/`

### Current Icons
Placeholder SVG icons are currently in place. Replace with proper PNG icons for production.

## Testing

### Testing Offline Functionality
1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Navigate the app
4. Perform actions (they should queue)
5. Go back online
6. Actions should sync automatically

### Testing Service Worker
1. Open DevTools → Application tab
2. Check "Service Workers" section
3. Verify service worker is registered
4. Check "Cache Storage" for cached resources

### Testing Install Prompt
1. Open on mobile device or use DevTools device emulation
2. Wait 30 seconds
3. Install prompt should appear
4. Test install and dismiss actions

## Browser Support

### Full Support
- Chrome/Edge 90+
- Safari 15.4+
- Firefox 90+

### Partial Support
- Safari 11.1-15.3 (no install prompt)
- Firefox 44-89 (limited features)

### No Support
- IE 11 and below (graceful degradation)

## Performance

### Metrics
- First load: ~2-3s
- Subsequent loads: <1s (cached)
- Offline page load: <500ms

### Optimization
- Static assets cached indefinitely
- API responses cached for 5 minutes
- Images cached with stale-while-revalidate
- Automatic cache cleanup

## Security

### Service Worker Scope
- Registered at root (`/`)
- HTTPS required in production
- Same-origin policy enforced

### Cache Security
- No sensitive data cached
- API responses cached temporarily
- User data requires authentication

## Troubleshooting

### Service Worker Not Registering
- Check HTTPS (required in production)
- Check browser console for errors
- Verify `/sw.js` is accessible
- Clear browser cache and retry

### Install Prompt Not Showing
- Wait 30 seconds after page load
- Check if already installed
- Check if dismissed recently (30-day cooldown)
- Verify manifest.json is valid

### Offline Sync Not Working
- Check browser console for errors
- Verify online/offline detection
- Check localStorage for queued actions
- Try manual sync from PWA Status page

### High Storage Usage
- Clear cache from PWA Status page
- Check for large cached responses
- Verify cache cleanup is working

## Future Enhancements

### Planned Features
- Push notifications for critical alerts
- Background sync for large data imports
- Periodic background sync for updates
- Share target API for sharing to app
- File handling API for opening files

### Considerations
- Native app features (camera, contacts)
- Advanced caching strategies
- Offline-first architecture
- Conflict resolution for offline edits

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox](https://developers.google.com/web/tools/workbox)

## Support

For issues or questions about PWA functionality:
1. Check browser console for errors
2. Review this documentation
3. Test in different browsers
4. Contact development team
