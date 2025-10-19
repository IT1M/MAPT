/**
 * Advanced Filtering System - Usage Example
 * 
 * This file demonstrates how to integrate the advanced filtering system
 * into your pages and components.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { AdvancedFilterPanel } from '@/components/filters/AdvancedFilterPanel'
import { FilterChips } from '@/components/filters/FilterChips'
import { FilterBuilder } from '@/components/filters/FilterBuilder'
import { FilterGroup, FilterFieldConfig } from '@/types/filters'
import { buildPrismaWhere } from '@/utils/filter-builder'
import { Button } from '@/components/ui/button'

/**
 * Example: Inventory Page with Advanced Filtering
 */
export function InventoryPageExample() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    filters: [],
    logic: 'AND',
  })
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Define available fields for filtering
  const fieldConfigs: FilterFieldConfig[] = [
    {
      name: 'itemName',
      label: 'Item Name',
      type: 'string',
      operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null'],
    },
    {
      name: 'batch',
      label: 'Batch Number',
      type: 'string',
      operators: ['equals', 'contains', 'starts_with'],
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'between'],
    },
    {
      name: 'rejectQuantity',
      label: 'Reject Quantity',
      type: 'number',
      operators: ['equals', 'greater_than', 'less_than', 'between', 'is_null'],
    },
    {
      name: 'destination',
      label: 'Destination',
      type: 'enum',
      operators: ['equals', 'not_equals', 'in', 'not_in'],
      enumValues: [
        { value: 'MAIS', label: 'Mais' },
        { value: 'FOZAN', label: 'Fozan' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'string',
      operators: ['equals', 'contains', 'in', 'not_in'],
    },
    {
      name: 'createdAt',
      label: 'Created Date',
      type: 'date',
      operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'boolean',
      operators: ['equals'],
    },
  ]

  // Fetch data with filters
  const fetchData = async (filters: FilterGroup) => {
    setIsLoading(true)
    try {
      // Convert filter group to Prisma where clause
      const where = buildPrismaWhere(filters)

      // Make API call with filters
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ where }),
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  const handleApplyFilters = (filters: FilterGroup) => {
    setFilterGroup(filters)
    fetchData(filters)
  }

  // Remove individual filter
  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = {
      ...filterGroup,
      filters: filterGroup.filters.filter(f => f.id !== filterId),
    }
    setFilterGroup(updatedFilters)
    fetchData(updatedFilters)
  }

  // Clear all filters
  const handleClearAll = () => {
    const emptyFilters = { filters: [], logic: 'AND' as const }
    setFilterGroup(emptyFilters)
    fetchData(emptyFilters)
  }

  // Load initial data
  useEffect(() => {
    fetchData(filterGroup)
  }, [])

  return (
    <div className="flex h-screen">
      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        currentPage="inventory"
        fieldConfigs={fieldConfigs}
        initialFilterGroup={filterGroup}
        onApply={handleApplyFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Inventory Items</h1>
            <Button
              variant="secondary"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Active Filter Chips */}
          {filterGroup.filters.length > 0 && (
            <div className="mb-6">
              <FilterChips
                filterGroup={filterGroup}
                fieldConfigs={fieldConfigs}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAll}
              />
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No items found. Try adjusting your filters.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Destination
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.batch}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Example: Using Filter Builder Standalone
 */
export function StandaloneFilterBuilderExample() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    filters: [],
    logic: 'AND',
  })

  const fieldConfigs: FilterFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      operators: ['contains', 'equals'],
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      operators: ['equals', 'greater_than', 'less_than', 'between'],
    },
  ]

  const handleApply = () => {
    const where = buildPrismaWhere(filterGroup)
    console.log('Prisma where clause:', where)
    // Use the where clause in your query
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Filter Builder</h2>
      <FilterBuilder
        filterGroup={filterGroup}
        onChange={setFilterGroup}
        fieldConfigs={fieldConfigs}
        onApply={handleApply}
        onReset={() => setFilterGroup({ filters: [], logic: 'AND' })}
      />
    </div>
  )
}

/**
 * Example: Server-Side API Route with Filters
 */
export const serverSideExample = `
// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/services/prisma'
import { buildPrismaWhere } from '@/utils/filter-builder'
import { FilterGroup } from '@/types/filters'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { where: filterGroup } = body as { where: FilterGroup }

    // Convert filter group to Prisma where clause
    const where = buildPrismaWhere(filterGroup)

    // Query with filters
    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        enteredBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
`

/**
 * Example: Complex Filter Scenarios
 */
export const complexFilterExamples = {
  // Find items with high quantity OR high reject rate
  highValueOrHighReject: {
    filters: [
      {
        id: 'f1',
        field: 'quantity',
        operator: 'greater_than' as const,
        value: 1000,
      },
      {
        id: 'f2',
        field: 'rejectQuantity',
        operator: 'greater_than' as const,
        value: 100,
      },
    ],
    logic: 'OR' as const,
  },

  // Find items in specific date range AND specific destination
  dateRangeAndDestination: {
    filters: [
      {
        id: 'f1',
        field: 'createdAt',
        operator: 'between' as const,
        value: ['2024-01-01', '2024-12-31'],
      },
      {
        id: 'f2',
        field: 'destination',
        operator: 'equals' as const,
        value: 'MAIS',
      },
    ],
    logic: 'AND' as const,
  },

  // Find items with name containing "medical" AND quantity between 50-200
  nameAndQuantityRange: {
    filters: [
      {
        id: 'f1',
        field: 'itemName',
        operator: 'contains' as const,
        value: 'medical',
      },
      {
        id: 'f2',
        field: 'quantity',
        operator: 'between' as const,
        value: [50, 200],
      },
    ],
    logic: 'AND' as const,
  },

  // Find items in multiple categories
  multipleCategories: {
    filters: [
      {
        id: 'f1',
        field: 'category',
        operator: 'in' as const,
        value: ['Syringes', 'Bandages', 'Gloves'],
      },
    ],
    logic: 'AND' as const,
  },

  // Find items with no reject quantity (null or zero)
  noRejects: {
    filters: [
      {
        id: 'f1',
        field: 'rejectQuantity',
        operator: 'is_null' as const,
        value: null,
      },
    ],
    logic: 'AND' as const,
  },
}
