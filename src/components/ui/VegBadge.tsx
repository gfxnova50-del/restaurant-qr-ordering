import React from 'react';

interface VegBadgeProps {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VegBadge({ isVeg, size = 'md', showLabel = false }: VegBadgeProps) {
  // Standard Indian FSSAI square with center dot
  // Green = Veg (#15803D), Red = Non-Veg (#B91C1C)
  const sizeClasses = {
    sm: 'w-[15px] h-[15px] p-[2px]',
    md: 'w-[18px] h-[18px] p-[2.5px]',
    lg: 'w-[22px] h-[22px] p-[3px]',
  };

  const dotSize = {
    sm: 'w-[7px] h-[7px]',
    md: 'w-[8px] h-[8px]',
    lg: 'w-[10px] h-[10px]',
  };

  return (
    <div
      className="inline-flex items-center gap-1.5 select-none shrink-0"
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian item' : 'Non-Vegetarian item'}
    >
      <div
        className={`border-[1.5px] rounded-[4px] bg-white flex items-center justify-center shrink-0 ${sizeClasses[size]} ${
          isVeg ? 'border-[#15803D]' : 'border-[#B91C1C]'
        }`}
      >
        <div
          className={`rounded-full shrink-0 ${dotSize[size]} ${
            isVeg ? 'bg-[#15803D]' : 'bg-[#B91C1C]'
          }`}
        />
      </div>
      {showLabel && (
        <span
          className={`font-semibold text-xs tracking-wide uppercase ${
            isVeg ? 'text-[#15803D]' : 'text-[#B91C1C]'
          }`}
        >
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}
    </div>
  );
}
