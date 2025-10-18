# AI Insights and Q&A Components

This directory contains the AI-powered insights and conversational Q&A components for the analytics dashboard.

## Components

### AIInsightsPanel

A collapsible panel that displays AI-generated insights about inventory data using Google's Gemini AI.

**Features:**
- Automatic insights generation on mount and data changes
- Structured sections: Findings, Alerts, Recommendations, Predictions
- Loading states with animated spinner
- Error handling with retry functionality
- Collapsible interface to save screen space
- 5-minute caching for performance
- Confidence scores for each insight
- Priority-based color coding (high/medium/low)

**Props:**
```typescript
interface AIInsightsPanelProps {
  dashboardData: DashboardContext
  filters?: {
    startDate?: Date | null
    endDate?: Date | null
    destinations?: string[]
    categories?: string[]
  }
  onRefresh?: () => void
}
```

**Usage:**
```tsx
import { AIInsightsPanel } from '@/components/analytics'

<AIInsightsPanel
  dashboardData={{
    summary: {
      totalItems: 1000,
      totalQuantity: 5000,
      rejectRate: 3.5,
      activeUsers: 10,
      categoriesCount: 15,
      avgDailyEntries: 50
    }
  }}
  onRefresh={() => console.log('Refreshing...')}
/>
```

### AIQuestionInput

An interactive Q&A interface that allows users to ask questions about their analytics data.

**Features:**
- Text input with submit button
- Example questions for quick access
- Q&A history display within session
- Confidence scores and sources
- Copy answer functionality
- Loading states
- Error handling
- 5-minute caching for identical questions

**Props:**
```typescript
interface AIQuestionInputProps {
  context: InventoryContext
  onAnswer?: (qa: QuestionAnswer) => void
}
```

**Usage:**
```tsx
import { AIQuestionInput } from '@/components/analytics'

<AIQuestionInput
  context={{
    totalItems: 1000,
    totalQuantity: 5000,
    recentActivity: [...],
    topCategories: [...]
  }}
  onAnswer={(qa) => console.log('Answer:', qa.answer)}
/>
```

### AIInsightsSectionWrapper

A client-side wrapper component that fetches dashboard data and renders both the insights panel and Q&A interface in a responsive grid layout.

**Features:**
- Automatic data fetching from analytics API
- Loading states
- Error handling
- Responsive grid layout (2:1 ratio on large screens)
- Data transformation for AI components

**Usage:**
```tsx
import { AIInsightsSectionWrapper } from '@/components/analytics'

// In your page component
<AIInsightsSectionWrapper />
```

## API Endpoints

### POST /api/analytics/ai-insights

Generates AI-powered insights using Gemini AI.

**Request:**
```json
{
  "dataType": "inventory",
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [...],
    "trends": [...],
    "predictions": [...],
    "generatedAt": "2024-01-31T12:00:00.000Z"
  }
}
```

### POST /api/analytics/ai-question

Handles conversational AI questions about analytics data.

**Request:**
```json
{
  "question": "Why is reject rate high?",
  "context": {
    "totalItems": 1000,
    "totalQuantity": 5000,
    "recentActivity": [...],
    "topCategories": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "Why is reject rate high?",
    "answer": "Based on the data...",
    "confidence": 0.85,
    "sources": ["Recent activity log", "Reject analysis"]
  }
}
```

## Caching Strategy

Both components implement 5-minute caching to:
- Reduce API calls to Gemini AI
- Improve performance
- Reduce costs
- Provide faster responses for repeated queries

Cache keys include:
- User role (for role-specific insights)
- Question/context hash
- Date range
- Filter parameters

## Error Handling

### Fallback Responses

When Gemini AI is unavailable, the components provide rule-based fallback responses:

**Insights:**
- Basic inventory analysis
- Low stock warnings
- Overstocking alerts
- Simple recommendations

**Q&A:**
- Pattern matching for common questions
- Context-based responses
- Helpful suggestions for rephrasing

### Error States

- Loading spinner during API calls
- Error messages with retry buttons
- Graceful degradation to fallback mode
- User-friendly error messages

## Internationalization

All text is internationalized using next-intl:

**English (en):**
- `analytics.ai.insights`
- `analytics.ai.askQuestion`
- `analytics.ai.generating`
- `analytics.ai.error`

**Arabic (ar):**
- Full RTL support
- Translated labels and messages
- Mirrored layout where appropriate

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management
- High contrast support
- Semantic HTML structure

## Performance Optimizations

1. **Lazy Loading**: Components only fetch data when mounted
2. **Caching**: 5-minute TTL for API responses
3. **Debouncing**: Prevents excessive API calls
4. **Memoization**: Expensive calculations cached
5. **Code Splitting**: Dynamic imports where possible

## Testing

To test the AI components:

1. Navigate to `/[locale]/analytics` (requires SUPERVISOR+ role)
2. Scroll to the AI Insights section
3. Wait for insights to load automatically
4. Try asking questions in the Q&A interface
5. Test example questions
6. Verify error handling by disconnecting network

## Future Enhancements

- [ ] Voice input for questions
- [ ] Export insights to PDF
- [ ] Scheduled insight reports
- [ ] Custom insight templates
- [ ] Multi-language AI responses
- [ ] Advanced analytics with ML predictions
- [ ] Real-time insights with WebSocket
- [ ] Collaborative annotations
