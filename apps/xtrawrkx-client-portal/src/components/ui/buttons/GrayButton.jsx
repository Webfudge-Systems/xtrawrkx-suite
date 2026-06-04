import React from 'react';
import BaseButton from './BaseButton';

const GrayButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'gray',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'grayHover';
    return 'gray';
  };

  return (
    <BaseButton
      className={className}
      onClick={onClick}
      disabled={disabled}
      variant={getVariant()}
      size={size}
      {...props}
    >
      {children}
    </BaseButton>
  );
};

export default GrayButton;
