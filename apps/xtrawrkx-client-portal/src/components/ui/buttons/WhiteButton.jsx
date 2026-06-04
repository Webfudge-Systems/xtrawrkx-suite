import React from 'react';
import BaseButton from './BaseButton';

const WhiteButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'secondary',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'secondaryHover';
    return 'secondary';
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

export default WhiteButton;
