import { eq, and, isNull, ilike, desc, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors, weddingVendors, weddings } from "@/lib/db/schema";
import { VendorCategory } from "../types";
import { NotFoundError } from "@/lib/errors";

export interface VendorFilters {
  category?: VendorCategory;
  city?: string;
  search?: string;
  isActive?: boolean;
}

export async function getVendors(filters: VendorFilters = {}) {
  const conditions = [isNull(vendors.deletedAt)];

  if (filters.category) {
    conditions.push(eq(vendors.category, filters.category));
  }
  if (filters.city) {
    conditions.push(eq(vendors.city, filters.city));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(vendors.isActive, filters.isActive));
  }
  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(vendors.name, searchPattern),
        ilike(vendors.contactName, searchPattern),
        ilike(vendors.email, searchPattern),
        ilike(vendors.phone, searchPattern),
        ilike(vendors.city, searchPattern)
      )!
    );
  }

  return db
    .select()
    .from(vendors)
    .where(and(...conditions))
    .orderBy(desc(vendors.averageRating), desc(vendors.createdAt));
}

export async function getVendorById(id: string) {
  const result = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, id), isNull(vendors.deletedAt)))
    .limit(1);

  if (!result[0]) {
    throw new NotFoundError(`Vendor with ID '${id}' not found`);
  }

  // Fetch past wedding assignments
  const assignments = await db
    .select({
      id: weddingVendors.id,
      weddingId: weddingVendors.weddingId,
      weddingTitle: weddings.title,
      weddingCity: weddings.city,
      contractAmountPaise: weddingVendors.contractAmountPaise,
      scope: weddingVendors.scope,
      status: weddingVendors.status,
      assignedAt: weddingVendors.createdAt,
    })
    .from(weddingVendors)
    .innerJoin(weddings, eq(weddingVendors.weddingId, weddings.id))
    .where(eq(weddingVendors.vendorId, id))
    .orderBy(desc(weddingVendors.createdAt));

  return {
    ...result[0],
    assignments,
  };
}

export async function createVendor(data: {
  name: string;
  category: VendorCategory;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  serviceArea?: string[];
  description?: string | null;
  isActive?: boolean;
  averageRating?: string | null;
}) {
  const [created] = await db
    .insert(vendors)
    .values({
      name: data.name,
      category: data.category,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      serviceArea: data.serviceArea || (data.city ? [data.city] : []),
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      averageRating: data.averageRating || "4.50",
    })
    .returning();

  return created;
}

export async function updateVendor(
  id: string,
  data: Partial<{
    name: string;
    category: VendorCategory;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    serviceArea?: string[];
    description?: string | null;
    isActive?: boolean;
    averageRating?: string | null;
  }>
) {
  await getVendorById(id);

  const [updated] = await db
    .update(vendors)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, id))
    .returning();

  return updated;
}

export async function deleteVendor(id: string) {
  await getVendorById(id);

  const [deleted] = await db
    .update(vendors)
    .set({
      deletedAt: new Date(),
      isActive: false,
    })
    .where(eq(vendors.id, id))
    .returning();

  return deleted;
}
