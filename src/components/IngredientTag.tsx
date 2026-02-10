import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { triggerImpact } from '../services/haptics';

interface IngredientTagProps {
  name: string;
  amount?: number;
  cost?: number;
  isSelected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  showDot?: boolean; // 新增：显示频率高的小圆点
}

export const IngredientTag: React.FC<IngredientTagProps> = ({ 
  name, 
  amount,
  cost,
  isSelected, 
  onPress, 
  onRemove, 
  variant = 'primary',
  className = '',
  showDot = false
}) => {
  const handlePress = () => {
    if (onPress) {
      triggerImpact();
      onPress();
    }
  };

  const getVariantStyles = () => {
    if (isSelected) return 'bg-[#FF6B6B] border-[#FF6B6B]';
    
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border-gray-100';
      case 'outline':
        return 'bg-transparent border-gray-200';
      case 'ghost':
        return 'bg-transparent border-transparent';
      default:
        return 'bg-white border-gray-100';
    }
  };

  const getTextColor = () => {
    if (isSelected) return 'text-white';
    if (variant === 'ghost') return 'text-gray-500';
    return 'text-gray-700';
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress}
      activeOpacity={0.7}
      className={`
        mr-2 mb-2 px-3.5 py-2 rounded-2xl flex-row items-center border shadow-sm
        ${getVariantStyles()}
        ${className}
      `}
      style={{
        shadowColor: isSelected ? '#FF6B6B' : '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isSelected ? 0.2 : 0.05,
        shadowRadius: 3,
        elevation: 1
      }}
    >
      {showDot && !isSelected && (
        <View className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5" />
      )}
      <Text className={`text-xs font-semibold ${getTextColor()}`}>
        {name}
        {amount !== undefined && amount !== null && (
          <Text className={`text-[10px] font-normal opacity-80 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
            {' '}{amount}克
          </Text>
        )}
        {cost !== undefined && cost > 0 && (
          <Text className={`text-[10px] font-normal opacity-80 ${isSelected ? 'text-white' : 'text-[#FF6B6B]'}`}>
            {' '}￥{cost.toFixed(2)}
          </Text>
        )}
      </Text>
      
      {onRemove && (
        <TouchableOpacity 
          onPress={onRemove} 
          className="ml-2 bg-black/5 rounded-full p-0.5"
        >
          <X size={10} color={isSelected ? 'white' : '#9CA3AF'} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};
