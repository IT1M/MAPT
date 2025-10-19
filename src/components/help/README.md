# Help Center System

A comprehensive help center and support system with article management, search functionality, and admin interface.

## Features

### User-Facing Features

1. **Help Center Layout**
   - Clean, professional design
   - Category navigation
   - Search functionality
   - Breadcrumb navigation
   - Responsive design

2. **Article Browsing**
   - Browse by category
   - Full-text search with relevance ranking
   - Pagination support
   - View counts and feedback metrics
   - Related articles suggestions

3. **Article Viewing**
   - Markdown rendering
   - Table of contents (for long articles)
   - Print functionality
   - Share functionality
   - Feedback system (helpful/not helpful)
   - Related articles

4. **Support Form**
   - Category selection
   - Priority levels
   - Rich text description
   - File attachments (planned)
   - Email confirmation
   - Expected response time

### Admin Features

1. **Article Management**
   - Create, edit, and delete articles
   - Draft and published status
   - Markdown editor
   - Slug management
   - Category management
   - Tag management
   - View statistics (views, helpful votes)

2. **Analytics** (planned)
   - Article views tracking
   - Search analytics
   - Feedback metrics
   - Popular articles
   - User engagement

## Components

### Public Components

- `HelpCenterLayout` - Main layout wrapper
- `HelpSearchBar` - Search input with debouncing
- `HelpCategories` - Category navigation sidebar
- `HelpArticleList` - Article listing with pagination
- `HelpArticleView` - Single article view with markdown rendering
- `HelpBreadcrumbs` - Navigation breadcrumbs
- `SupportForm` - Contact support form

### Admin Components

- `HelpAdminLayout` - Admin layout wrapper
- `HelpArticleManager` - Article management interface
- `HelpArticleEditor` - Article creation/editing modal

## API Routes

### Public Routes

- `GET /api/help/articles` - List articles with search and filtering
- `GET /api/help/articles/[slug]` - Get single article
- `POST /api/help/articles/[slug]/feedback` - Submit article feedback
- `GET /api/help/categories` - Get all categories with counts
- `GET /api/help/search` - Full-text search with relevance ranking
- `POST /api/help/support` - Submit support request

### Admin Routes (ADMIN role required)

- `POST /api/help/articles` - Create new article
- `PATCH /api/help/articles/[slug]` - Update article
- `DELETE /api/help/articles/[slug]` - Delete article

## Database Schema

```prisma
model HelpArticle {
  id          String            @id
  title       String
  slug        String            @unique
  category    String
  content     String
  tags        String[]
  status      HelpArticleStatus @default(DRAFT)
  views       Int               @default(0)
  helpful     Int               @default(0)
  notHelpful  Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime
  publishedAt DateTime?

  @@index([slug])
  @@index([category])
  @@index([status])
  @@map("help_articles")
}

enum HelpArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

## Usage

### Accessing the Help Center

Users can access the help center at `/help`. The page displays:
- Search bar
- Category navigation
- Article list

### Viewing an Article

Navigate to `/help/[slug]` to view a specific article. Features include:
- Markdown-rendered content
- Related articles
- Feedback buttons
- Print and share options

### Contacting Support

Users can submit support requests at `/help/support`. The form includes:
- Category selection
- Priority level
- Subject and description
- Email confirmation

### Admin Management

Admins can manage articles at `/admin/help`. Features include:
- Create new articles
- Edit existing articles
- Delete articles
- Filter by status (all, published, drafts)
- View statistics

## Search Functionality

The search system includes:

1. **Full-text search** across title, content, and tags
2. **Relevance ranking** based on:
   - Title matches (highest weight)
   - Tag matches
   - Content matches
   - Popularity (views and helpful votes)
3. **Highlighting** of search terms in results
4. **Snippet extraction** with context

## Markdown Support

Articles support full Markdown syntax including:
- Headers
- Lists (ordered and unordered)
- Links
- Images
- Code blocks
- Tables
- Blockquotes
- Bold and italic text

## Internationalization

The help center is fully internationalized with support for:
- English (en)
- Arabic (ar)

All UI text is translated, and RTL layout is supported for Arabic.

## Future Enhancements

1. **Advanced Analytics**
   - Search term tracking
   - Article performance metrics
   - User journey analysis

2. **File Attachments**
   - Support for image uploads in articles
   - File attachments in support requests

3. **Video Support**
   - Embed video tutorials
   - Screen recording integration

4. **AI-Powered Features**
   - Suggested articles based on user behavior
   - Auto-categorization of support requests
   - Chatbot integration

5. **Multi-language Articles**
   - Support for article translations
   - Language-specific content

## Best Practices

### Writing Help Articles

1. **Use clear, descriptive titles**
2. **Start with a brief summary**
3. **Use headers to organize content**
4. **Include screenshots and examples**
5. **Add relevant tags for searchability**
6. **Keep articles focused on one topic**
7. **Update articles regularly**

### Managing Categories

1. **Use consistent naming**
2. **Keep categories broad but meaningful**
3. **Limit to 5-10 main categories**
4. **Use subcategories for organization**

### Handling Support Requests

1. **Respond within expected timeframe**
2. **Provide clear, actionable solutions**
3. **Follow up to ensure resolution**
4. **Create help articles for common issues**
