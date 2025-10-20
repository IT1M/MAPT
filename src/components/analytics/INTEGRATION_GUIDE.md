# Analytics Dashboard Integration Guide

## Overview

The Analytics Dashboard is now fully integrated with all components wired together. This document describes the complete integration architecture and how all pieces work together.

## Architecture

### Component Hierarchy

```
AnalyticsPage (Server Component)
└── AnalyticsDashboard (Client Component)
    ├── GlobalFilters
    ├── KPICardsSection
    ├── Charts
    │   ├── InventoryTrendChart
    │   ├── DestinationChart
    │   ├── CategoryChart
    │   ├── RejectAnalysisChart
    │   ├── UserActivityHeatmap (ADMIN/SUPERVISOR only)
    │   └── MonthlyComparisonChart
    ├── AIInsightsPanel
    └── DashboardExporter
```

## State Management

### Filter State

The `AnalyticsDashboard` component manages a centralized filter state that controls all data fetching:

```typescript
interface AnalyticsFilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: DatePresetType;
  };
  destinations: Destination[];
  categories: string[];
  userIds: string[];
}
```

### Data State

All chart data is managed in a single state object:

```typescript
interface DashboardData {
  summary: AnalyticsSummary | null;
  trends: TrendDataPoint[];
  destination: DestinationData | null;
  categories: CategoryDataPoint[];
  rejectAnalysis: RejectDataPoint[];
  userActivity: HeatmapDataPoint[];
  monthlyComparison: MonthlyDataPoint[];
}
```

## Data Flow

### 1. Initial Load

1. Page loads with URL parameters parsed into filter state
2. `fetchAllData()` is called with initial filters
3. Multiple API endpoints are called in parallel:
   - `/api/analytics/summary` - KPI data, destination, and category data
   - `/api/analytics/trends` - Time series data
   - `/api/analytics/reject-analysis` - Reject rate over time
   - `/api/analytics/user-activity` - Heatmap data (ADMIN/SUPERVISOR only)
4. Data is transformed and stored in component state
5. All charts re-render with new data

### 2. Filter Changes

1. User interacts with GlobalFilters component
2. `handleFilterChange()` is called with filter updates
3. Filter state is updated
4. URL is updated with new query parameters (for shareability)
5. After 300ms debounce, `fetchAllData()` is called
6. All charts update with filtered data
7. Screen reader announcement is made

### 3. Interactive Filtering

Users can click on various elements to apply filters:

- **KPI Cards**: Click to filter by that metric
  - Total Quantity card → Filter by destination
  - Categories card → Filter by most active category
  - Reject Rate card → Show high reject items
- **Destination Chart**: Click pie segment to filter by that destination
- **Category Chart**: Click bar to filter by that category

### 4. Auto-Refresh

When enabled:

1. Timer triggers every 60 seconds
2. `fetchAllData()` is called with current filters
3. All data is refreshed
4. `lastUpdated` timestamp is updated

## API Integration

### Endpoints Used

1. **GET /api/analytics/summary**
   - Returns: KPI metrics, destination breakdown, category breakdown
   - Used by: KPICardsSection, DestinationChart, CategoryChart

2. **GET /api/analytics/trends**
   - Returns: Time series data for inventory trends
   - Used by: InventoryTrendChart, MonthlyComparisonChart

3. **GET /api/analytics/reject-analysis**
   - Returns: Reject rate time series
   - Used by: RejectAnalysisChart

4. **GET /api/analytics/user-activity**
   - Returns: Heatmap data (day × hour)
   - Used by: UserActivityHeatmap
   - Restricted to: ADMIN and SUPERVISOR roles

5. **GET /api/analytics/ai-insights**
   - Returns: AI-generated insights
   - Used by: AIInsightsPanel

6. **POST /api/analytics/ai-question**
   - Returns: AI answer to user question
   - Used by: AIQuestionInput

### Query Parameters

All endpoints accept the same filter parameters:

- `startDate`: ISO date string
- `endDate`: ISO date string
- `preset`: Date preset name
- `destination`: Destination filter (can be multiple)
- `category`: Category filter (can be multiple)
- `userId`: User filter (can be multiple, ADMIN only)

## Responsive Behavior

### Desktop (>1024px)

- 3-column KPI grid
- 2-column chart grid
- Side-by-side layout for filters and content

### Tablet (768px - 1024px)

- 2-column KPI grid
- 2-column chart grid
- Collapsible filter panel

### Mobile (<768px)

- Single column layout
- Stacked KPI cards
- Full-width charts
- Simplified chart legends
- Touch-optimized interactions

## Accessibility Features

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Escape key closes modals and dropdowns
- Arrow keys navigate chart data points

### Screen Reader Support

- ARIA labels on all charts
- Live regions announce data updates
- Alternative data table view available
- Descriptive button labels

### Visual Accessibility

- Color contrast ratio ≥ 4.5:1
- Not relying solely on color for information
- Focus indicators visible
- Text resizable to 200%

## Performance Optimizations

### Frontend

1. **Debouncing**: Filter changes debounced by 300ms
2. **Memoization**: Expensive calculations cached with `useMemo`
3. **Lazy Loading**: Charts load only when in viewport
4. **Code Splitting**: Chart components dynamically imported

### Backend

1. **Response Caching**: 5-minute TTL for analytics endpoints
2. **Parallel Requests**: Multiple endpoints fetched concurrently
3. **Query Optimization**: Database aggregations instead of full scans

## Error Handling

### Chart-Level Errors

Each chart is wrapped in `ChartErrorBoundary`:

- Prevents cascade failures
- Shows error message for that chart only
- Other charts continue to function

### API Errors

- Network errors show retry button
- Timeout errors show appropriate message
- Rate limit errors show wait time

### Fallback Strategies

1. **AI Insights**: Use rule-based fallbacks when Gemini unavailable
2. **Charts**: Show cached data with staleness indicator
3. **Filters**: Gracefully degrade to default view

## Testing

### Manual Testing Checklist

#### Load and Display

- [ ] Dashboard loads without errors
- [ ] All KPI cards display correct data
- [ ] All charts render properly
- [ ] Loading states show during data fetch
- [ ] Error states display when API fails

#### Filtering

- [ ] Date range filter updates all charts
- [ ] Destination filter works correctly
- [ ] Category filter works correctly
- [ ] User filter works (ADMIN only)
- [ ] Reset button clears all filters
- [ ] URL updates with filter changes
- [ ] Filters persist on page refresh

#### Interactive Filtering

- [ ] Clicking KPI cards applies filters
- [ ] Clicking destination chart segments applies filters
- [ ] Clicking category bars applies filters
- [ ] Screen reader announces filter changes

#### Auto-Refresh

- [ ] Toggle enables/disables auto-refresh
- [ ] Data refreshes every 60 seconds when enabled
- [ ] Last updated timestamp updates correctly
- [ ] Manual refresh button works

#### Export

- [ ] Dashboard export generates PDF
- [ ] Individual chart exports work
- [ ] Export includes all visible data
- [ ] Export respects current filters

#### AI Features

- [ ] AI insights load automatically
- [ ] Insights refresh when filters change
- [ ] Q&A interface accepts questions
- [ ] Answers display correctly
- [ ] Error handling works for AI failures

#### Responsive Design

- [ ] Desktop layout displays correctly
- [ ] Tablet layout adapts properly
- [ ] Mobile layout is usable
- [ ] Touch interactions work on mobile
- [ ] Charts are readable on all screen sizes

#### Accessibility

- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces updates
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient
- [ ] Alternative data views available

## Troubleshooting

### Charts Not Loading

1. Check browser console for errors
2. Verify API endpoints are responding
3. Check network tab for failed requests
4. Verify user has correct role permissions

### Filters Not Working

1. Check URL parameters are updating
2. Verify filter state in React DevTools
3. Check API requests include filter parameters
4. Verify debounce is not causing confusion

### Performance Issues

1. Check number of data points being rendered
2. Verify caching is working
3. Check for memory leaks in React DevTools
4. Monitor network requests for duplicates

### AI Features Not Working

1. Verify Gemini API key is configured
2. Check API quota and rate limits
3. Verify request/response format
4. Check for CORS or network issues

## Future Enhancements

1. **Custom Dashboards**: Allow users to create personalized layouts
2. **Scheduled Reports**: Email reports on a schedule
3. **Anomaly Detection**: Automatic alerts for unusual patterns
4. **Predictive Analytics**: Forecast future inventory needs
5. **Drill-down**: Click charts to see detailed data
6. **Comparison Mode**: Compare two time periods side-by-side
7. **Real-time Updates**: WebSocket for live data
8. **Mobile App**: Native mobile experience

## Related Documentation

- [Design Document](./design.md)
- [Requirements Document](./requirements.md)
- [API Documentation](../../app/api/analytics/README.md)
- [Chart Components](./charts/README.md)
- [Accessibility Guide](./ACCESSIBILITY_PERFORMANCE.md)
