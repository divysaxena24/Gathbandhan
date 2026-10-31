// ============================================================
// Gathbandhan — Service Catalogue API Route Handler
// GET /api/services
// Returns verified wedding service catalog items
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { SERVICE_CATEGORIES } from '@/data/service-catalogue/categories';
import { SERVICE_ITEMS } from '@/data/service-catalogue/services';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category');

  let items = SERVICE_ITEMS;
  if (categoryId) {
    items = items.filter((item) => item.categoryId === categoryId);
  }

  return NextResponse.json({
    categories: SERVICE_CATEGORIES,
    services: items,
    total: items.length,
  });
}
