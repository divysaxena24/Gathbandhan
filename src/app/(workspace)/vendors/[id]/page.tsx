"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Heart,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { formatINR } from "@/lib/money";

interface VendorDetail {
  id: string;
  name: string;
  category: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  serviceArea: string[] | null;
  description: string | null;
  averageRating: string | null;
  totalWeddings: number;
  isActive: boolean;
  assignments: Array<{
    id: string;
    weddingId: string;
    weddingTitle: string;
    weddingCity: string;
    contractAmountPaise: string | null;
    scope: string | null;
    status: string;
    assignedAt: string;
  }>;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/vendors/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setVendor(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center text-charcoal-500">
        <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
        <p className="text-sm">Loading vendor profile...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-ivory-200">
        <h3 className="text-lg font-serif font-bold text-charcoal">Vendor Not Found</h3>
        <Button onClick={() => router.push("/vendors")} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/vendors")}
          className="text-charcoal-600 hover:text-charcoal gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Directory
        </Button>
      </div>

      <PageHeader
        title={vendor.name}
        description={`${vendor.category.replace(/_/g, " ")} partner for luxury destination weddings`}
      >
        <Link href={`/quotations?vendorId=${vendor.id}`}>
          <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-1.5">
            <FileText className="w-4 h-4 text-gold" />
            View Active Quotes
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Vendor Profile Info */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border-ivory-300 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-ivory-200">
              <CardTitle className="text-base font-serif text-charcoal">
                Partner Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-charcoal-500">Rating</span>
                <span className="flex items-center gap-1 font-bold text-charcoal">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  {vendor.averageRating || "4.80"} / 5.0
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-charcoal-500">Weddings Completed</span>
                <span className="font-semibold text-charcoal">
                  {vendor.totalWeddings || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-charcoal-500">Primary Hub</span>
                <span className="font-semibold text-charcoal flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  {vendor.city || "Rajasthan"}
                </span>
              </div>

              {vendor.serviceArea && vendor.serviceArea.length > 0 && (
                <div className="pt-2 border-t border-ivory-200">
                  <span className="text-xs text-charcoal-500 block mb-1">
                    Service Areas
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {vendor.serviceArea.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-ivory-100 rounded text-xs font-medium text-charcoal"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-ivory-200 space-y-2">
                <span className="text-xs text-charcoal-500 block">
                  Contact Information
                </span>
                {vendor.contactName && (
                  <div className="font-medium text-charcoal">
                    {vendor.contactName}
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-xs text-charcoal-600">
                    <Phone className="w-3.5 h-3.5 text-gold" />
                    <a href={`tel:${vendor.phone}`} className="hover:underline">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-xs text-charcoal-600 truncate">
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    <a href={`mailto:${vendor.email}`} className="hover:underline truncate">
                      {vendor.email}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {vendor.description && (
            <Card className="border-ivory-300 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-ivory-200">
                <CardTitle className="text-base font-serif text-charcoal">
                  Capabilities & Repertoire
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-charcoal-600 leading-relaxed">
                {vendor.description}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Past Wedding Assignments */}
        <div className="space-y-6 md:col-span-2">
          <Card className="border-ivory-300 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-ivory-200 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-serif flex items-center gap-2 text-charcoal">
                <Heart className="w-4 h-4 text-burgundy-600" />
                Wedding Assignments & Contract History
              </CardTitle>
              <span className="text-xs text-charcoal-500">
                {vendor.assignments.length} Record(s)
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {vendor.assignments.length === 0 ? (
                <div className="p-8 text-center text-charcoal-500">
                  <p className="text-sm">No wedding contracts awarded to this vendor yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendor.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-lg border border-ivory-200 bg-ivory-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-charcoal">
                            {assignment.weddingTitle}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-ivory-200 text-charcoal-700">
                            {assignment.weddingCity}
                          </span>
                        </div>
                        {assignment.scope && (
                          <p className="text-xs text-charcoal-600">{assignment.scope}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-charcoal-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="font-mono font-bold text-charcoal text-sm">
                          {assignment.contractAmountPaise
                            ? formatINR(BigInt(assignment.contractAmountPaise))
                            : "Contract Pending"}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {assignment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
