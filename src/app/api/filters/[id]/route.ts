import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { FilterGroup } from '@/types/filters'

/**
 * PATCH /api/filters/[id]
 * Update a saved filter
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, filters, isDefault } = body

    // Verify ownership
    const existingFilter = await prisma.savedFilter.findUnique({
      where: { id: params.id },
    })

    if (!existingFilter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      )
    }

    if (existingFilter.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // If setting as default, unset other defaults for this page
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          page: existingFilter.page,
          isDefault: true,
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (filters !== undefined) updateData.filters = filters
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const updatedFilter = await prisma.savedFilter.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      filter: {
        ...updatedFilter,
        filters: updatedFilter.filters as FilterGroup,
      },
    })
  } catch (error) {
    console.error('Error updating saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to update saved filter' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/filters/[id]
 * Delete a saved filter
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const existingFilter = await prisma.savedFilter.findUnique({
      where: { id: params.id },
    })

    if (!existingFilter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      )
    }

    if (existingFilter.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.savedFilter.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Filter deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting saved filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved filter' },
      { status: 500 }
    )
  }
}
