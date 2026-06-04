import React from 'react';
import BaseButton from './BaseButton';

const PurpleButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'purple',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'purpleHover';
    return 'purple';
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

export default PurpleButton;
