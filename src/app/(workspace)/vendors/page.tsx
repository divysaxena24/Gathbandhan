"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { CreateVendorDialog } from "@/components/vendors/create-vendor-dialog";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  Heart,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  description: string | null;
  averageRating: string | null;
  totalWeddings: number;
  isActive: boolean;
}

const CATEGORY_TABS = [
  { value: "ALL", label: "All Categories" },
  { value: "VENUE", label: "Venues & Palaces" },
  { value: "CATERING", label: "Royal Catering" },
  { value: "DECORATION", label: "Decor & Production" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "VIDEOGRAPHY", label: "Cinematography" },
  { value: "DJ_MUSIC", label: "DJ & Sound" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "TRANSPORT", label: "Transport" },
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedCity !== "ALL") params.set("city", selectedCity);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/vendors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setVendors(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load vendors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedCity, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Directory"
        description="Master directory of palaces, caterers, decorators, and luxury wedding service partners in Rajasthan & beyond"
      >
        <CreateVendorDialog onVendorCreated={fetchVendors} />
      </PageHeader>

      {/* Category Pills & Filters */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === tab.value
                  ? "bg-charcoal text-ivory"
                  : "bg-white border border-ivory-300 text-charcoal-700 hover:bg-ivory-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
            <Input
              placeholder="Search vendors by name, contact person, or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-ivory-300 text-sm"
            />
          </div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="ALL">All Hubs & Cities</option>
            <option value="Udaipur">Udaipur</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Jodhpur">Jodhpur</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
          </select>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Loading partner vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-ivory-200">
          <Building2 className="w-8 h-8 text-gold mx-auto mb-2" />
          <h3 className="text-base font-serif font-bold text-charcoal">No Vendors Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Try adjusting your category or city filters, or register a new vendor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="bg-white border border-ivory-300 rounded-xl p-5 hover:border-gold hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ivory-100 text-charcoal-700">
                    {vendor.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-charcoal">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span>{vendor.averageRating || "4.80"}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal group-hover:text-gold-700 transition-colors">
                    {vendor.name}
                  </h3>
                  {vendor.city && (
                    <div className="flex items-center gap-1 text-xs text-charcoal-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      <span>{vendor.city}</span>
                    </div>
                  )}
                </div>

                {vendor.description && (
                  <p className="text-xs text-charcoal-600 line-clamp-2">
                    {vendor.description}
                  </p>
                )}

                <div className="space-y-1 pt-2 border-t border-ivory-200 text-xs text-charcoal-600">
                  {vendor.contactName && (
                    <div className="font-medium text-charcoal">
                      Contact: {vendor.contactName}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-1.5 text-charcoal-500">
                      <Phone className="w-3 h-3" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-1.5 text-charcoal-500 truncate">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-ivory-200 flex items-center justify-between text-xs font-medium text-charcoal-700">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-burgundy-500" />
                  {vendor.totalWeddings || 0} Weddings Completed
                </span>
                <span className="text-gold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
