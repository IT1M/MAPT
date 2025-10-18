import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/services/prisma'
import { DataEntryFormWithStats } from '@/components/forms/DataEntryFormWithStats'
import { Destination } from '@prisma/client'

export default async function DataEntryPage() {
  // Get user session
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const userId = session.user.id

  // Fetch recent items for autocomplete (last 20 distinct itemNames)
  const recentItems = await prisma.inventoryItem.findMany({
    where: {
      enteredById: userId,
      deletedAt: null,
    },
    select: {
      itemName: true,
      category: true,
    },
    distinct: ['itemName'],
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  // Fetch recent categories for autocomplete
  const recentCategories = await prisma.inventoryItem.findMany({
    where: {
      enteredById: userId,
      category: { not: null },
      deletedAt: null,
    },
    select: {
      category: true,
    },
    distinct: ['category'],
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  // Fetch today's entry count for current user
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayCount = await prisma.inventoryItem.count({
    where: {
      enteredById: userId,
      createdAt: { gte: todayStart },
      deletedAt: null,
    },
  })

  // Fetch last 5 entries for QuickStatsWidget
  const recentEntries = await prisma.inventoryItem.findMany({
    where: {
      enteredById: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      itemName: true,
      batch: true,
      quantity: true,
      destination: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Get user's last used destination from most recent entry
  const lastEntry = await prisma.inventoryItem.findFirst({
    where: {
      enteredById: userId,
      deletedAt: null,
    },
    select: {
      destination: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const userLastDestination = lastEntry?.destination || ('MAIS' as Destination)

  return (
    <DataEntryFormWithStats
      recentItems={recentItems}
      todayCount={todayCount}
      recentEntries={recentEntries}
      userLastDestination={userLastDestination}
      userId={userId}
    />
  )
}
