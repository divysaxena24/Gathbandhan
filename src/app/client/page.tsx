'use client';

// ============================================================
// Gathbandhan — Premium Landing Page
// ============================================================

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Heart,
  MapPin,
  Calendar,
  Users,
  Camera,
  FileText,
  ChevronRight,
  Star,
  BookOpen,
  Palette,
  UtensilsCrossed,
  Music,
  Car,
  IndianRupee,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* ===== Navigation ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="font-heading text-xl font-bold text-maroon-deep tracking-wide">
              Gathbandhan
            </span>
          </div>
          <Link
            href="/plan-your-wedding"
            className="btn-primary !py-2 !px-5 !text-sm"
          >
            Start Planning
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-maroon/3 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-rose/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Ornamental element */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold" />
            <Heart className="w-4 h-4 text-gold fill-gold/30" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-maroon-deep leading-tight mb-6">
            Plan Your
            <span className="block bg-gradient-to-r from-gold-dark via-gold to-gold-light bg-clip-text text-transparent">
              Dream Wedding
            </span>
          </h1>

          <p className="text-lg md:text-xl text-warm-gray max-w-2xl mx-auto mb-10 leading-relaxed">
            Every wedding has a story. Discover traditions, explore possibilities
            and create a wedding plan that reflects your unique vision.
            Let Gathbandhan guide you through every step.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/plan-your-wedding"
              className="btn-primary !py-4 !px-8 !text-base group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Planning My Wedding
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-warm-gray">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span>Premium Experience</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gold/30" />
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose" />
              <span>All Traditions</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gold/30" />
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gold-dark" />
              <span>Free Proposal</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-20 px-6 bg-gradient-to-b from-ivory to-cream/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="gold-divider" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-4">
              Your Wedding, Your Way
            </h2>
            <p className="text-warm-gray max-w-xl mx-auto">
              From discovering beautiful traditions to receiving a personalised wedding proposal — all through simple selections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <BookOpen className="w-6 h-6" />,
                title: 'Discover & Select',
                description:
                  'Choose your wedding type, explore ceremonies, and select everything from themes to catering through beautiful cards and chips.',
              },
              {
                step: '02',
                icon: <IndianRupee className="w-6 h-6" />,
                title: 'Plan & Estimate',
                description:
                  'Get a detailed budget estimate based on your selections. See category-wise costs that update as you customise your plan.',
              },
              {
                step: '03',
                icon: <FileText className="w-6 h-6" />,
                title: 'Receive Your Proposal',
                description:
                  'Download a beautifully designed, personalised wedding proposal PDF — ready to share with your family and vendors.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-panel p-8 text-center hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-5 rounded-full bg-gradient-to-br from-gold/10 to-gold-light/20 group-hover:from-gold/20 group-hover:to-gold-light/30 transition-colors">
                  <span className="text-gold-dark">{item.icon}</span>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-maroon text-white text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-warm-gray leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== What You'll Plan ===== */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="gold-divider" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-4">
              Everything You Need to Plan
            </h2>
            <p className="text-warm-gray max-w-xl mx-auto">
              A comprehensive wedding consultation covering every detail of your celebration.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Heart className="w-5 h-5" />, label: 'Wedding Traditions' },
              { icon: <Sparkles className="w-5 h-5" />, label: 'Ceremony Selection' },
              { icon: <MapPin className="w-5 h-5" />, label: 'Destination & Venue' },
              { icon: <Calendar className="w-5 h-5" />, label: 'Dates & Duration' },
              { icon: <Users className="w-5 h-5" />, label: 'Guest Planning' },
              { icon: <Palette className="w-5 h-5" />, label: 'Theme & Décor' },
              { icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Catering & Cuisine' },
              { icon: <Camera className="w-5 h-5" />, label: 'Photography' },
              { icon: <Music className="w-5 h-5" />, label: 'Entertainment' },
              { icon: <Car className="w-5 h-5" />, label: 'Transport & Stay' },
              { icon: <IndianRupee className="w-5 h-5" />, label: 'Budget Estimate' },
              { icon: <FileText className="w-5 h-5" />, label: 'Wedding Proposal' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-soft-white border border-gold/10 hover:border-gold/30 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cream flex items-center justify-center text-gold-dark group-hover:bg-gold/10 transition-colors">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-charcoal">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Wedding Types ===== */}
      <section className="py-20 px-6 bg-gradient-to-b from-cream/30 to-ivory">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="gold-divider" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-4">
              Every Tradition, Celebrated
            </h2>
            <p className="text-warm-gray max-w-xl mx-auto">
              Whether you follow one tradition or blend many — Gathbandhan understands your customs and guides your planning.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[
              { type: 'Hindu Wedding', emoji: '🪔' },
              { type: 'Sikh Wedding', emoji: '🙏' },
              { type: 'Muslim Wedding', emoji: '☪️' },
              { type: 'Christian Wedding', emoji: '⛪' },
              { type: 'Jain Wedding', emoji: '🙏' },
              { type: 'Interfaith Wedding', emoji: '💕' },
              { type: 'Custom Wedding', emoji: '✨' },
            ].map((item) => (
              <div
                key={item.type}
                className="selection-card !cursor-default group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {item.emoji}
                </span>
                <span className="font-heading font-semibold text-sm text-charcoal">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-panel p-12 md:p-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-gold/5 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-maroon/3 rounded-full blur-2xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
                <Sparkles className="w-5 h-5 text-gold" />
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
              </div>

              <h2 className="font-heading text-3xl md:text-4xl font-bold text-maroon-deep mb-4">
                Begin Your Journey
              </h2>
              <p className="text-warm-gray mb-8 max-w-md mx-auto leading-relaxed">
                Start your wedding consultation now. It takes just a few minutes to create a personalised wedding plan.
              </p>

              <Link
                href="/plan-your-wedding"
                className="btn-gold !py-4 !px-10 !text-base inline-flex"
              >
                <Heart className="w-5 h-5" />
                Start Planning My Wedding
              </Link>

              <p className="text-xs text-warm-gray-light mt-6">
                No sign-up required · Free to explore · Your data stays private
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-12 px-6 border-t border-gold/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="font-heading text-lg font-bold text-maroon-deep">
              Gathbandhan
            </span>
          </div>
          <p className="text-sm text-warm-gray mb-6">
            AI-Powered Wedding Consultation by The Royal Knot
          </p>
          <div className="gold-divider-wide" />
          <p className="text-xs text-warm-gray-light mt-4">
            © 2026 Gathbandhan. Made with ❤️ for beautiful weddings.
          </p>
        </div>
      </footer>
    </div>
  );
}
