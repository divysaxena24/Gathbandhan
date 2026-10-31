// ============================================================
// Gathbandhan — Zod Validation Schemas
// ============================================================

import { z } from 'zod';

// === Wedding Type ===
export const weddingTypeSchema = z.enum([
  'hindu', 'sikh', 'muslim', 'christian', 'jain', 'interfaith', 'custom'
]);

// === Regional Tradition ===
export const regionalTraditionSchema = z.enum([
  'north_indian', 'south_indian', 'rajasthani', 'gujarati',
  'punjabi_hindu', 'bengali', 'marathi', 'punjabi_sikh',
  'kerala_christian', 'goan', 'anglo_indian', 'other'
]);

// === Destination ===
export const destinationTypeSchema = z.enum(['destination', 'local', 'not_decided']);
export const destinationCitySchema = z.enum([
  'udaipur', 'jaipur', 'jodhpur', 'jaisalmer', 'goa', 'kerala', 'rishikesh', 'other'
]);
export const venueTypeSchema = z.enum([
  'palace', 'luxury_resort', 'five_star_hotel', 'heritage_property',
  'banquet_hall', 'outdoor_lawn', 'beachside', 'private_property', 'other'
]);

// === Date & Guests ===
export const weddingDurationSchema = z.enum([
  '1_day', '2_days', '3_days', '4_5_days', 'more_than_5', 'not_decided'
]);
export const guestRangeSchema = z.enum([
  'below_100', '100_300', '300_500', '500_800', '800_1000', 'above_1000'
]);

// === Theme ===
export const themeTypeSchema = z.enum([
  'royal_traditional', 'floral_romantic', 'minimalist_luxury',
  'modern_contemporary', 'bohemian', 'vintage', 'garden_wedding',
  'palace_wedding', 'beach_wedding', 'custom'
]);

// === Catering ===
export const cateringTypeSchema = z.enum(['vegetarian', 'non_vegetarian', 'both']);

// === Budget ===
export const budgetRangeSchema = z.enum([
  'below_25_lakh', '25_50_lakh', '50_lakh_1_crore',
  '1_2_crore', '2_5_crore', 'above_5_crore', 'not_decided'
]);
export const spendingPrioritySchema = z.enum([
  'best_experience', 'luxury_exclusivity', 'budget_conscious', 'balanced', 'custom'
]);

// === AI Chat Request ===
export const aiChatRequestSchema = z.object({
  consultationId: z.string().nullable().optional(),
  currentStep: z.string().optional().default('ceremony_discovery'),
  selections: z.record(z.string(), z.unknown()).optional().default({}),
  userMessage: z.string().max(2000).optional(),
  requestType: z.enum(['ceremony_explanation', 'follow_up', 'recommendation', 'summary']).optional().default('ceremony_explanation'),
});

// === Lead Capture ===
export const leadSchema = z.object({
  consultationId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).optional(),
  consentGiven: z.boolean(),
});

// === Consultation Save ===
export const consultationSaveSchema = z.object({
  sessionToken: z.string().optional(),
  currentStepIndex: z.number().int().min(0),
  selections: z.record(z.string(), z.unknown()),
});
