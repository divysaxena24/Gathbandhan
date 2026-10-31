// ============================================================
// Gathbandhan — Vendor Recommendations API Route Handler
// GET /api/vendors
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { VendorProfile } from '@/types/wedding';

const SAMPLE_VENDORS: VendorProfile[] = [
  {
    id: 'ven_1',
    businessName: 'Udaivilas Palace & Banquet Suites',
    category: 'venue',
    location: 'udaipur',
    description: 'Premier heritage palace on Lake Pichola with historic courtyards and royal lawns.',
    portfolio: ['https://images.unsplash.com/photo-1544982503-9f984c14501a'],
    verified: true,
    rating: 4.9,
  },
  {
    id: 'ven_2',
    businessName: 'Shaadi Tales Couture Cinematography',
    category: 'photography',
    location: 'pan_india',
    description: 'Award-winning celebrity wedding filming duo specializing in 4K aerial and intimate moments.',
    portfolio: ['https://images.unsplash.com/photo-1519741497674-611481863552'],
    verified: true,
    rating: 4.95,
  },
  {
    id: 'ven_3',
    businessName: 'Zaika Royal Awadhi & International Banqueting',
    category: 'catering',
    location: 'pan_india',
    description: 'Master chefs curating authentic Awadhi Dum Pukht, live coastal grills and artisanal desserts.',
    portfolio: ['https://images.unsplash.com/photo-1555244162-803834f70033'],
    verified: true,
    rating: 4.88,
  },
  {
    id: 'ven_4',
    businessName: 'Mandap Veda Floral Architecture',
    category: 'decor',
    location: 'rajasthan',
    description: 'Grand floral mandaps, imported floral tunnels, and theatrical ambient lighting design.',
    portfolio: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc'],
    verified: true,
    rating: 4.92,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const location = searchParams.get('location');

  let filtered = SAMPLE_VENDORS;
  if (category) {
    filtered = filtered.filter((v) => v.category === category);
  }
  if (location && location !== 'other') {
    filtered = filtered.filter((v) => v.location === location || v.location === 'pan_india');
  }

  return NextResponse.json({
    vendors: filtered,
    total: filtered.length,
  });
}
