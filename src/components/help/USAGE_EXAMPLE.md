# Help Center Usage Examples

## For End Users

### Browsing Help Articles

```typescript
// Navigate to the help center
// URL: /help

// The page displays:
// - Search bar for finding articles
// - Category sidebar for browsing by topic
// - List of published articles with pagination
```

### Searching for Help

```typescript
// Use the search bar at the top of the help center
// The search is debounced (300ms) and searches across:
// - Article titles
// - Article content
// - Article tags

// Results are ranked by relevance and include:
// - Highlighted search terms
// - Snippet with context
// - Article metadata (category, views, helpful votes)
```

### Reading an Article

```typescript
// Click on any article to view it
// URL: /help/[slug]

// Features available:
// - Markdown-rendered content
// - Print button (opens print dialog)
// - Share button (native share API or clipboard)
// - Feedback buttons (thumbs up/down)
// - Related articles section
// - Breadcrumb navigation
```

### Submitting a Support Request

```typescript
// Navigate to the support form
// URL: /help/support

// Fill out the form:
// 1. Select category (technical, account, feature, bug, other)
// 2. Choose priority (low, normal, high, urgent)
// 3. Enter subject (5-200 characters)
// 4. Provide detailed description (20-2000 characters)
// 5. Submit

// You'll receive:
// - Confirmation message on screen
// - Email confirmation
// - Expected response time
```

## For Administrators

### Accessing the Admin Panel

```typescript
// Navigate to the admin panel (ADMIN role required)
// URL: /admin/help

// The panel displays:
// - Filter tabs (All, Published, Drafts)
// - Article statistics
// - Create article button
// - Article management table
```

### Creating a New Article

```typescript
// 1. Click "Create Article" button
// 2. Fill out the form:

const newArticle = {
  title: "How to Add Inventory Items",
  slug: "how-to-add-inventory-items", // Auto-generated from title
  category: "Getting Started",
  content: `
# How to Add Inventory Items

This guide will walk you through adding new items to the inventory.

## Step 1: Navigate to Data Entry

Click on the "Data Entry" link in the navigation menu.

## Step 2: Fill Out the Form

Enter the following information:
- Item name
- Batch number
- Quantity
- Destination
- Category

## Step 3: Submit

Click the "Add Item" button to save your entry.
  `,
  tags: ["inventory", "data-entry", "tutorial"],
  status: "PUBLISHED" // or "DRAFT"
}

// 3. Click "Save"
```

### Editing an Existing Article

```typescript
// 1. Find the article in the table
// 2. Click the edit icon (pencil)
// 3. Modify the fields as needed
// 4. Click "Save"

// Note: Changing the slug will update the URL
// Make sure to update any links to the article
```

### Managing Article Status

```typescript
// Articles can have two statuses:
// - DRAFT: Not visible to users
// - PUBLISHED: Visible to all users

// To publish a draft:
// 1. Edit the article
// 2. Change status to "PUBLISHED"
// 3. Save

// To unpublish an article:
// 1. Edit the article
// 2. Change status to "DRAFT"
// 3. Save
```

### Deleting an Article

```typescript
// 1. Find the article in the table
// 2. Click the delete icon (trash)
// 3. Confirm the deletion

// Warning: This action cannot be undone!
```

### Viewing Article Statistics

```typescript
// Each article displays:
// - Views: Number of times the article was viewed
// - Helpful votes: Number of users who found it helpful
// - Not helpful votes: Number of users who didn't find it helpful

// Use these metrics to:
// - Identify popular articles
// - Find articles that need improvement
// - Prioritize content updates
```

## API Usage Examples

### Fetching Articles

```typescript
// Get all published articles
const response = await fetch('/api/help/articles?limit=10&page=1')
const data = await response.json()

// data structure:
{
  articles: [
    {
      id: "...",
      title: "...",
      slug: "...",
      category: "...",
      tags: ["..."],
      views: 123,
      helpful: 45,
      notHelpful: 2,
      publishedAt: "2025-10-19T...",
      updatedAt: "2025-10-19T..."
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 50,
    totalPages: 5
  }
}
```

### Searching Articles

```typescript
// Search for articles
const response = await fetch('/api/help/search?q=inventory')
const data = await response.json()

// data structure:
{
  results: [
    {
      id: "...",
      title: "...",
      slug: "...",
      category: "...",
      snippet: "...highlighted text...",
      score: 15.5,
      highlights: {
        title: "How to Add <mark>Inventory</mark> Items",
        snippet: "...about <mark>inventory</mark> management..."
      }
    }
  ],
  query: "inventory",
  total: 5
}
```

### Getting a Single Article

```typescript
// Get article by slug
const response = await fetch('/api/help/articles/how-to-add-inventory-items')
const article = await response.json()

// article structure:
{
  id: "...",
  title: "How to Add Inventory Items",
  slug: "how-to-add-inventory-items",
  category: "Getting Started",
  content: "# How to Add Inventory Items\n\n...",
  tags: ["inventory", "data-entry", "tutorial"],
  status: "PUBLISHED",
  views: 123,
  helpful: 45,
  notHelpful: 2,
  publishedAt: "2025-10-19T...",
  updatedAt: "2025-10-19T...",
  relatedArticles: [
    {
      id: "...",
      title: "...",
      slug: "...",
      category: "..."
    }
  ]
}
```

### Submitting Feedback

```typescript
// Submit helpful feedback
const response = await fetch('/api/help/articles/how-to-add-inventory-items/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ helpful: true })
})

const result = await response.json()
// result: { success: true, helpful: 46, notHelpful: 2 }
```

### Creating an Article (Admin Only)

```typescript
// Create new article
const response = await fetch('/api/help/articles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "How to Add Inventory Items",
    slug: "how-to-add-inventory-items",
    category: "Getting Started",
    content: "# How to Add Inventory Items\n\n...",
    tags: ["inventory", "data-entry", "tutorial"],
    status: "PUBLISHED"
  })
})

const article = await response.json()
```

### Updating an Article (Admin Only)

```typescript
// Update existing article
const response = await fetch('/api/help/articles/how-to-add-inventory-items', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Updated Title",
    content: "Updated content...",
    status: "PUBLISHED"
  })
})

const article = await response.json()
```

### Submitting a Support Request

```typescript
// Submit support request
const response = await fetch('/api/help/support', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: "technical",
    subject: "Cannot login to my account",
    description: "I'm getting an error when trying to login...",
    priority: "high"
  })
})

const result = await response.json()
// result: { success: true, message: "...", expectedResponseTime: "4-8 hours" }
```

## Markdown Examples

### Basic Formatting

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
~~Strikethrough~~

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

[Link text](https://example.com)

![Image alt text](https://example.com/image.jpg)
```

### Code Blocks

```markdown
Inline code: `const x = 5`

Code block:
\`\`\`javascript
function hello() {
  console.log("Hello, world!")
}
\`\`\`
```

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

## Best Practices

### For Content Creators

1. **Use descriptive titles** - Make it clear what the article is about
2. **Start with a summary** - Give readers an overview
3. **Use headers** - Break content into sections
4. **Add screenshots** - Visual aids help understanding
5. **Include examples** - Show, don't just tell
6. **Use tags wisely** - Help users find related content
7. **Keep it updated** - Review and update articles regularly

### For Administrators

1. **Organize by category** - Use consistent category names
2. **Monitor feedback** - Pay attention to helpful/not helpful votes
3. **Track views** - Identify popular and unpopular content
4. **Update regularly** - Keep content fresh and accurate
5. **Use drafts** - Test articles before publishing
6. **Create related articles** - Build a comprehensive knowledge base

### For Users

1. **Use search** - Find answers quickly
2. **Browse categories** - Discover related content
3. **Give feedback** - Help improve articles
4. **Contact support** - When you can't find an answer
5. **Be specific** - Provide details in support requests
