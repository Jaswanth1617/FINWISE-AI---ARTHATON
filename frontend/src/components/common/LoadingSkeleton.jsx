import React from 'react';

export default function LoadingSkeleton({ count = 3, height = 'h-24' }) {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div 
          key={idx} 
          className={`w-full bg-slate-200/80 rounded-xl ${height}`}
        />
      ))}
    </div>
  );
}
