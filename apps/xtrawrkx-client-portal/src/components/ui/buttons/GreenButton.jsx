import React from 'react';
import BaseButton from './BaseButton';

const GreenButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'green',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'greenHover';
    return 'green';
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

export default GreenButton;
