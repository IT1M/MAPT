# Vercel Analytics Setup Guide

This guide explains how to enable and configure Vercel Analytics for monitoring application performance and user behavior.

## Overview

Vercel provides two analytics products:

1. **Web Analytics** - Privacy-friendly analytics for tracking page views and user behavior
2. **Speed Insights** - Real User Monitoring (RUM) for Core Web Vitals and performance metrics

## Prerequisites

- Application deployed to Vercel
- Vercel account with appropriate permissions
- Node.js and npm installed

## Installation Steps

### 1. Install Required Packages

```bash
npm install @vercel/analytics @vercel/speed-insights
```

### 2. Enable Analytics in Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** > **Analytics**
3. Enable **Web Analytics**
4. Enable **Speed Insights** (if available on your plan)

### 3. Add Analytics Components to Your App

Update your root layout file to include the analytics components:

**File: `src/app/layout.tsx`**

```typescript
import { VercelAnalytics } from '@/components/shared/VercelAnalytics';
import { WebVitalsTracker } from '@/components/shared/WebVitalsTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Add these components */}
        <VercelAnalytics />
        <WebVitalsTracker />
      </body>
    </html>
  );
}
```

### 4. Uncomment Analytics Code

In `src/components/shared/VercelAnalytics.tsx`, uncomment the following lines:

```typescript
// Uncomment these imports:
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Uncomment this return statement:
return (
  <>
    <Analytics />
    <SpeedInsights />
  </>
);
```

### 5. Deploy to Vercel

```bash
git add .
git commit -m "Enable Vercel Analytics"
git push origin main
```

## Features

### Web Analytics

Tracks:
- Page views
- Unique visitors
- Top pages
- Referrers
- Countries
- Devices and browsers

### Speed Insights

Monitors:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response time

## Custom Event Tracking

Track custom events using the provided utilities:

```typescript
import { trackEvent, trackInteraction, trackPageView } from '@/components/shared/VercelAnalytics';

// Track custom events
trackEvent('button_click', { button: 'submit', page: 'contact' });

// Track user interactions
trackInteraction('click', 'navigation', 'menu-item', 1);

// Track page views
trackPageView('/dashboard', { userId: '123' });
```

## Performance Monitoring

The application automatically tracks:

1. **Core Web Vitals** - Sent to Vercel Analytics
2. **API Response Times** - Logged and monitored
3. **Component Render Times** - Tracked in development
4. **Database Query Performance** - Logged for slow queries

## Viewing Analytics Data

### In Vercel Dashboard

1. Go to your project in Vercel
2. Click on **Analytics** tab
3. View metrics:
   - **Overview** - Traffic and performance summary
   - **Web Vitals** - Core Web Vitals scores
   - **Audience** - Visitor demographics
   - **Top Pages** - Most visited pages

### Custom Dashboards

Create custom dashboards by:

1. Exporting data via Vercel API
2. Using the Vercel Analytics API
3. Integrating with external tools (Datadog, Grafana)

## Performance Thresholds

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

### API Response Time Targets

- **Good**: < 500ms
- **Acceptable**: 500ms - 1000ms
- **Slow**: 1000ms - 3000ms
- **Critical**: > 3000ms

## Alerts and Notifications

### Setting Up Alerts

1. Go to **Settings** > **Notifications** in Vercel
2. Configure alerts for:
   - Performance degradation
   - Error rate spikes
   - Deployment failures
   - Custom thresholds

### Alert Channels

- Email notifications
- Slack integration
- Webhook endpoints
- PagerDuty integration

## Privacy Considerations

Vercel Web Analytics is privacy-friendly:

- No cookies used
- No personal data collected
- GDPR compliant
- No cross-site tracking
- Aggregated data only

## Troubleshooting

### Analytics Not Showing Data

1. Verify analytics is enabled in Vercel dashboard
2. Check that packages are installed: `npm list @vercel/analytics`
3. Ensure components are added to root layout
4. Wait 5-10 minutes for data to appear
5. Check browser console for errors

### Speed Insights Not Working

1. Verify Speed Insights is enabled in your Vercel plan
2. Check that `@vercel/speed-insights` is installed
3. Ensure component is rendered on client side
4. Test in production (doesn't work in development)

### Custom Events Not Tracking

1. Verify `window.va` is available
2. Check browser console for errors
3. Ensure events are called on client side
4. Test in production environment

## Cost Considerations

- **Hobby Plan**: Limited analytics (10k events/month)
- **Pro Plan**: Full analytics (100k events/month)
- **Enterprise Plan**: Unlimited analytics

Check your current usage in Vercel dashboard under **Settings** > **Usage**.

## Best Practices

1. **Track Meaningful Events** - Focus on user actions that matter
2. **Avoid Over-Tracking** - Don't track every click
3. **Use Descriptive Names** - Make event names clear and consistent
4. **Add Context** - Include relevant properties with events
5. **Monitor Regularly** - Review analytics weekly
6. **Set Baselines** - Establish performance benchmarks
7. **Act on Insights** - Use data to drive improvements

## Additional Resources

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Speed Insights Documentation](https://vercel.com/docs/speed-insights)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Core Web Vitals](https://web.dev/articles/vitals)

## Support

For issues or questions:

1. Check Vercel documentation
2. Visit Vercel community forums
3. Contact Vercel support (Pro/Enterprise plans)
4. Review application logs for errors
