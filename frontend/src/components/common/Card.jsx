import React from 'react';

function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs ${
        hover ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
