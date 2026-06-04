import React from 'react';
import BaseButton from './BaseButton';

const RedButton = ({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  variant = 'red',
  size = 'md',
  ...props 
}) => {
  const getVariant = () => {
    if (disabled) return 'primaryDisabled';
    if (variant === 'hover') return 'redHover';
    return 'red';
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

export default RedButton;
