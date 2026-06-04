import React from 'react';
import BaseButton from './BaseButton';

const LightBlueButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'lightBlue',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'lightBlueHover';
    return 'lightBlue';
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

export default LightBlueButton;
