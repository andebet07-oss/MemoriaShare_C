
import React from 'react';

const PremiumButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 focus:ring-blue-400',
    secondary: 'bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm hover:bg-white/20 hover:text-white focus:ring-white/30',
    silver: 'bg-gradient-to-b from-gray-50 to-gray-200 text-gray-800 border border-gray-400/50 shadow-md hover:from-white hover:to-gray-100 focus:ring-gray-300'
  };

  const sizeClasses = {
    lg: 'px-8 py-4 text-lg',
    md: 'px-6 py-3 text-base',
  };

  const combinedClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className
  ].join(' ');

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default PremiumButton;
