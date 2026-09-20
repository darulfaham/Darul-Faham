import React from 'react';
import {
  BookMarked,
  FileCheck2,
  BarChart3,
  Contact,
  CalendarCheck,
  Armchair,
  BadgePercent,
  Gift,
  Bell,
  Wallet,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface FeaturesSectionProps {
  onNavigate?: (route: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onNavigate }) => {
  const features = [
    {
      id: 'feature-digital-books',
      title: 'DIGITAL BOOKS',
      emoji: '📚',
      description: 'Access permitted digital study material, standard compendiums, and reference guides.',
      icon: BookMarked,
      badge: 'Academic Library',
      route: '/books',
    },
    {
      id: 'feature-test-series',
      title: 'TEST SERIES',
      emoji: '📝',
      description: 'Practice tests, take full-length competitive exams, and view instant answer keys.',
      icon: FileCheck2,
      badge: 'Exam Portal',
      route: '/tests',
    },
    {
      id: 'feature-results',
      title: 'RESULTS',
      emoji: '📊',
      description: 'View your test performance, rank distributions, and institutional merit achievements.',
      icon: BarChart3,
      badge: 'Performance',
      route: '/results',
    },
    {
      id: 'feature-student-id',
      title: 'STUDENT ID',
      emoji: '🪪',
      description: 'Access your official digital DARULFAHAM ID card with cryptographic QR verification.',
      icon: Contact,
      badge: 'Official Pass',
      route: '/id-cards',
    },
    {
      id: 'feature-attendance',
      title: 'ATTENDANCE',
      emoji: '📅',
      description: 'Track your daily attendance with campus geofence and biometric verification foundation.',
      icon: CalendarCheck,
      badge: 'Daily Tracker',
      route: '/attendance',
    },
    {
      id: 'feature-seat-allocation',
      title: 'SEAT ALLOCATION',
      emoji: '💺',
      description: 'View your assigned study-space seat, reserved silent sanctum room, and branch details.',
      icon: Armchair,
      badge: 'Study Sanctum',
      route: '/seats',
    },
    {
      id: 'feature-membership',
      title: 'MEMBERSHIP',
      emoji: '💳',
      description: 'Manage membership tier, validity dates, reserved timings, and renewal benefits.',
      icon: BadgePercent,
      badge: 'Sanctum Tier',
      route: '/membership',
    },
    {
      id: 'feature-offers',
      title: 'OFFERS & COUPONS',
      emoji: '🎁',
      description: 'View available offers, institutional discount coupons, and scholarship fee waivers.',
      icon: Gift,
      badge: 'Special Offers',
      route: '/offers',
    },
    {
      id: 'feature-notices',
      title: 'NOTICES',
      emoji: '🔔',
      description: 'Receive official DARULFAHAM announcements, academic schedules, and facilities updates.',
      icon: Bell,
      badge: 'Announcements',
      route: '/notices',
    },
    {
      id: 'feature-fees-payments',
      title: 'FEES & PAYMENTS',
      emoji: '💰',
      description: 'View fees, payment receipts, instant Cashfree online checkout, and transaction history.',
      icon: Wallet,
      badge: 'Secure Billing',
      route: '/payments',
    },
  ];

  return (
    <section id="darulfaham-features-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 mb-3 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-800" />
          <span>DARULFAHAM Academic Ecosystem</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Study & Exam Features
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-slate-600">
          Everything designed for high-focus civil service, regulatory, and competitive exam aspirants.
        </p>
      </div>

      {/* Responsive Grid: Desktop (3-4 cols), Tablet (2 cols), Mobile (1-2 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              id={`card-${feature.id}`}
              onClick={() => onNavigate && onNavigate(feature.route)}
              className="group relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden"
            >
              {/* Subtle top accent border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-800 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-900 group-hover:bg-purple-900 group-hover:text-white transition-colors duration-200 text-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-purple-50 group-hover:text-purple-800 group-hover:border-purple-200 transition-colors">
                    {feature.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base" role="img" aria-label={feature.title}>
                    {feature.emoji}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-900 transition-colors tracking-tight">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-800 group-hover:text-purple-950">
                <span>Explore</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

