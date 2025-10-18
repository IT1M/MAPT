# Medical Inventory System

Saudi Mais Co. Medical Products Inventory Management System built with Next.js 15.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS with custom theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 (beta)
- **AI Integration**: Google Gemini AI
- **Validation**: Zod
- **Internationalization**: next-intl (Arabic/English)
- **Theme**: next-themes (light/dark mode)
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your application URL
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NODE_ENV`: development/production

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Base UI components
│   ├── forms/       # Form components
│   └── layout/      # Layout components
├── services/        # External service integrations
├── db/              # Database schema
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

## Features

- ✅ Next.js 15 with App Router
- ✅ TypeScript with strict mode
- ✅ TailwindCSS with custom theme
- ✅ Prisma ORM setup
- ✅ NextAuth v5 authentication
- ✅ Google Gemini AI integration
- ✅ Multi-language support (Arabic/English)
- ✅ Dark mode support
- ✅ Role-based access control
- ✅ Responsive design

## License

Private - Saudi Mais Co.
