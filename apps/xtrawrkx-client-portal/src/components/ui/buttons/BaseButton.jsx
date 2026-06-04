import React from 'react';

const BaseButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-xtrawrkx-600 text-white shadow-sm hover:bg-xtrawrkx-700 hover:shadow-md focus:ring-xtrawrkx-500',
    primaryHover: 'bg-xtrawrkx-700 text-white shadow-md hover:bg-xtrawrkx-800 focus:ring-xtrawrkx-500',
    primaryDisabled: 'bg-gray-100 text-gray-400 border border-gray-200 shadow-sm',
    secondary: 'bg-white text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md focus:ring-gray-500',
    secondaryHover: 'bg-gray-50 text-gray-900 border border-gray-300 shadow-md hover:bg-gray-100 focus:ring-gray-500',
    lightBlue: 'bg-xtrawrkx-100 text-xtrawrkx-700 shadow-sm hover:bg-xtrawrkx-200 hover:shadow-md focus:ring-xtrawrkx-500',
    lightBlueHover: 'bg-xtrawrkx-200 text-xtrawrkx-700 shadow-md hover:bg-xtrawrkx-300 focus:ring-xtrawrkx-500',
    red: 'bg-orange-600 text-white shadow-sm hover:bg-orange-700 hover:shadow-md focus:ring-orange-500',
    redHover: 'bg-orange-700 text-white shadow-md hover:bg-orange-800 focus:ring-orange-500',
    green: 'bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md focus:ring-green-500',
    greenHover: 'bg-green-700 text-white shadow-md hover:bg-green-800 focus:ring-green-500',
    purple: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700 hover:shadow-md focus:ring-purple-500',
    purpleHover: 'bg-purple-700 text-white shadow-md hover:bg-purple-800 focus:ring-purple-500',
    gray: 'bg-gray-600 text-white shadow-sm hover:bg-gray-700 hover:shadow-md focus:ring-gray-500',
    grayHover: 'bg-gray-700 text-white shadow-md hover:bg-gray-800 focus:ring-gray-500',
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default BaseButton;
