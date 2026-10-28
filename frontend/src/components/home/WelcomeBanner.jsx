import React from 'react';
import { ArrowRight, Factory } from 'lucide-react';
import { welcomeBannerData } from '../../data/homeMockData';

function WelcomeBanner({ data = welcomeBannerData }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/80 border border-blue-100/90 p-6 lg:p-8 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {data.greeting}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {data.title}
            </h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
            {data.subtitle}
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium shadow-xs hover:bg-blue-700 transition-colors cursor-pointer">
              <Factory className="w-3.5 h-3.5" />
              <span>{data.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Right Image Banner */}
        <div className="lg:col-span-5 relative">
          <div className="relative h-44 sm:h-52 w-full rounded-xl overflow-hidden shadow-md border border-white/60">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
              alt="Warehouse Banner"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent flex items-end p-4">
              <p className="text-white text-xs font-medium italic drop-shadow-xs">
                {data.quote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;
