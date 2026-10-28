import React from 'react';

function LoadingSkeleton({ rows = 3, type = 'card' }) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/70 rounded-2xl p-4">
            <div className="h-4 bg-slate-300 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-slate-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-200/70 rounded-lg w-full"></div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
