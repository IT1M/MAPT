import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Navigation } from '@/components/layout/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Navigation */}
          <Navigation />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
