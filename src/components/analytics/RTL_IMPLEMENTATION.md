# Analytics Dashboard RTL Implementation

This document describes the RTL (Right-to-Left) implementation for the Analytics Dashboard to support Arabic locale.

## Overview

The Analytics Dashboard has been enhanced with comprehensive RTL support for Arabic users. This includes:

1. **Translation Keys** - Complete Arabic translations for all analytics UI elements
2. **Layout Mirroring** - Automatic layout reversal for RTL languages
3. **Chart Adjustments** - Proper axis orientation and text alignment in charts
4. **Component Updates** - All analytics components support RTL rendering

## Translation Keys

### Location
- `messages/en.json` - English translations
- `messages/ar.json` - Arabic translations

### Key Sections

#### KPI Cards (`analytics.kpi`)
- `totalItems`, `totalQuantity`, `rejectRate`, `activeUsers`, `categories`, `avgDaily`
- `topContributor`, `mostActiveCategory`, `maisPercentage`, `fozanPercentage`
- `trend`, `vsLastPeriod`

#### Charts (`analytics.charts`)
- Chart titles: `inventoryTrend`, `destination`, `category`, `rejectAnalysis`, `userActivity`, `monthlyComparison`
- Chart elements: `total`, `mais`, `fozan`, `reject`, `accepted`, `rejected`
- Controls: `sortByQuantity`, `sortByName`, `viewMode`, `zoomIn`, `zoomOut`, `toggleLegend`

#### AI Insights (`analytics.ai`)
- Panel: `insights`, `generating`, `error`, `noInsights`, `refresh`, `collapse`, `expand`
- Sections: `keyFindings`, `alerts`, `recommendations`, `predictions`
- Q&A: `askQuestion`, `questionPlaceholder`, `submit`, `answer`, `questionHistory`

#### Filters (`analytics.filters`)
- Controls: `dateRange`, `destination`, `category`, `user`, `reset`, `savePreset`
- Options: `allDestinations`, `allCategories`, `allUsers`, `selectCategories`, `selectUsers`
- Presets: `savedPresets`, `loadPreset`, `deletePreset`, `presetName`

#### Export (`analytics.export`)
- Formats: `pdf`, `png`, `csv`, `svg`
- Actions: `dashboard`, `chart`, `exporting`, `exportSuccess`, `exportError`
- Options: `includeCharts`, `includeData`, `includeInsights`

## RTL Utilities

### File: `src/utils/analytics-rtl.ts`

This utility file provides helper functions for RTL support:

#### Chart Layout Functions
- `getChartLayout(locale)` - Returns chart margin and layout configuration
- `getAxisConfig(locale, axis)` - Returns axis orientation and text anchor
- `getLegendConfig(locale)` - Returns legend alignment and wrapper styles
- `getRechartsRTLConfig(locale)` - Complete Recharts configuration for RTL

#### Layout Functions
- `getChartDirectionClass(locale)` - Returns 'rtl' or 'ltr' class
- `getChartControlsClass(locale)` - Returns flex direction for controls
- `getChartTitleAlign(locale)` - Returns text alignment for titles
- `getKPICardLayoutClass(locale)` - Returns flex direction for KPI cards

#### Formatting Functions
- `formatChartNumber(value, locale, options)` - Locale-aware number formatting
- `formatChartDate(date, locale, format)` - Locale-aware date formatting

#### Position Functions
- `getHeatmapCellPosition(dayIndex, hourIndex, cellWidth, cellHeight, locale)` - RTL-aware heatmap positioning
- `getFilterPanelPosition(locale)` - Returns 'left' or 'right' for filter panel

## RTL CSS Styles

### File: `src/styles/analytics-rtl.css`

Custom CSS rules for RTL support:

#### Container Styles
```css
[dir="rtl"] .analytics-container {
  direction: rtl;
}
```

#### Chart Styles
- Recharts wrapper maintains LTR coordinate system
- Legend and tooltip use RTL direction
- Axis labels have proper text anchors

#### Component Styles
- KPI cards: Reversed flex direction
- Filter panel: RTL direction and reversed checkboxes
- AI insights: Right-side border for priority indicators
- Export buttons: Reversed button group

#### Responsive Styles
- Mobile header and controls reversed for RTL
- Proper spacing adjustments for small screens

## Component Updates

### KPICard Component
**File**: `src/components/analytics/KPICard.tsx`

Changes:
- Added `useLocale()` hook
- Applied `dir` attribute based on locale
- Used `getKPICardLayoutClass()` for flex direction
- Applied `getIconTransform()` for trend indicators

```tsx
<div className="p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  <div className={`flex items-start justify-between mb-4 ${layoutClass}`}>
    {/* Content */}
  </div>
</div>
```

### InventoryTrendChart Component
**File**: `src/components/analytics/charts/InventoryTrendChart.tsx`

Changes:
- Added RTL configuration imports
- Applied chart layout margins
- Reversed X-axis for RTL
- Adjusted Y-axis orientation
- Updated tooltip and legend styles
- Applied locale-aware number formatting

```tsx
<XAxis
  dataKey="date"
  reversed={rtlConfig.xAxis.reversed}
  tick={{ textAnchor: rtlConfig.xAxis.tick.textAnchor }}
/>
<YAxis 
  orientation={rtlConfig.yAxis.orientation}
/>
<Tooltip
  contentStyle={{
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    textAlign: locale === 'ar' ? 'right' : 'left',
  }}
  formatter={(value: number) => formatChartNumber(value, locale)}
/>
```

### GlobalFilters Component
**File**: `src/components/analytics/GlobalFilters.tsx`

Changes:
- Added `dir` attribute to container
- Proper RTL direction for filter lists
- Reversed checkbox alignment

```tsx
<div className="..." dir={pathname.includes('/ar/') ? 'rtl' : 'ltr'}>
  {/* Filter content */}
</div>
```

### AIInsightsPanel Component
**File**: `src/components/analytics/AIInsightsPanel.tsx`

Changes:
- Added `useLocale()` hook
- Applied `dir` attribute to panel
- RTL-aware insight card borders

```tsx
<div className="..." dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  {/* Insights content */}
</div>
```

## Chart-Specific RTL Handling

### Line Charts
- X-axis reversed for RTL
- Y-axis moves to right side
- Legend aligned to right
- Tooltip text aligned right

### Bar Charts
- Horizontal bars render right-to-left
- Category labels aligned right
- Y-axis on right side for RTL

### Pie Charts
- No special handling needed (circular)
- Labels positioned appropriately
- Legend aligned right

### Heatmap
- Day order reversed (Saturday to Sunday)
- Cell positions calculated with RTL offset
- Labels aligned right

### Area Charts
- Same as line charts
- Gradient fills work correctly
- Stacking order maintained

## Testing RTL Support

### Manual Testing Steps

1. **Switch to Arabic Locale**
   - Use locale switcher in navigation
   - URL should change to `/ar/analytics`

2. **Verify Layout**
   - Check that page layout flows right-to-left
   - Verify KPI cards are mirrored
   - Confirm filter panel is on right side

3. **Test Charts**
   - Verify X-axis reads right-to-left
   - Check Y-axis is on right side
   - Confirm tooltips are right-aligned
   - Test legend alignment

4. **Test Interactions**
   - Click KPI cards (should work normally)
   - Use chart zoom/pan (should feel natural)
   - Toggle chart legends
   - Export charts

5. **Test Filters**
   - Apply date range filters
   - Select destinations and categories
   - Save and load presets
   - Verify URL parameters

6. **Test AI Insights**
   - Check panel layout
   - Verify insight cards have right border
   - Test Q&A input
   - Confirm text alignment

### Automated Testing

Add tests for RTL utilities:

```typescript
import { getChartLayout, formatChartNumber } from '@/utils/analytics-rtl'

describe('Analytics RTL Utils', () => {
  it('should reverse X-axis for Arabic', () => {
    const config = getChartLayout('ar')
    expect(config.reverseXAxis).toBe(true)
  })
  
  it('should format numbers with Arabic numerals', () => {
    const formatted = formatChartNumber(1234.56, 'ar')
    expect(formatted).toMatch(/١٬٢٣٤٫٥٦/)
  })
})
```

## Browser Compatibility

RTL support tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **Recharts Limitations**
   - Some chart types don't support native RTL
   - Workaround: Reverse data order and adjust axes

2. **Third-party Components**
   - Date pickers may need additional RTL styling
   - Some UI libraries don't fully support RTL

3. **Print Styles**
   - Charts maintain LTR for printing
   - May need manual adjustment for RTL print layouts

## Future Enhancements

1. **Additional Chart Types**
   - Implement RTL for scatter plots
   - Add RTL support for radar charts
   - Handle composite charts

2. **Accessibility**
   - Add ARIA labels in Arabic
   - Test with Arabic screen readers
   - Improve keyboard navigation for RTL

3. **Performance**
   - Optimize RTL calculations
   - Cache locale-specific configurations
   - Reduce re-renders on locale change

## Resources

- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [W3C: Structural Markup and Right-to-Left Text](https://www.w3.org/International/questions/qa-html-dir)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

## Support

For issues or questions about RTL implementation:
1. Check this documentation
2. Review `src/utils/analytics-rtl.ts` for available utilities
3. Inspect `src/styles/analytics-rtl.css` for CSS rules
4. Test with Arabic locale (`/ar/analytics`)
