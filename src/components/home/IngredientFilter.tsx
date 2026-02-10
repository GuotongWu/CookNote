import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ingredient } from '../../types/recipe';
import { IngredientTag } from '../IngredientTag';
import { IngredientBrowser } from '../IngredientBrowser';
import { easeLayout } from '../../utils/animations';
import { triggerImpact, triggerSelection } from '../../services/haptics';

interface IngredientFilterProps {
  ingredients: Ingredient[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  frequencies?: Record<string, number>;
}

export const IngredientFilter = React.memo(({ 
  ingredients, 
  selected, 
  onSelect,
  frequencies = {}
}: IngredientFilterProps) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  const handleToggleBrowser = useCallback(() => {
    easeLayout();
    onSelect(null);
    setIsBrowserOpen(prev => !prev);
    triggerImpact();
  }, [onSelect]);

  const handleBrowserToggleIng = useCallback((ing: Ingredient) => {
    easeLayout();
    onSelect(ing.name);
    setIsBrowserOpen(false);
    triggerSelection();
  }, [onSelect]);

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center px-6 mb-4">
        <Text className="text-xl font-black text-gray-900 tracking-tight">按原料筛选</Text>
        {selected && (
          <TouchableOpacity 
            onPress={() => {
              easeLayout();
              onSelect(null);
              triggerImpact();
            }}
            className="bg-gray-100 px-4 py-2 rounded-full"
          >
            <Text className="text-gray-500 text-xs font-bold">清除</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
      >
        <IngredientTag
          name={!selected && isBrowserOpen ? '收起' : '全部'}
          isSelected={!selected}
          className="mr-2 h-[48px] justify-center px-6"
          onPress={handleToggleBrowser}
        />
        
        {ingredients.slice(0, 10).map((ing) => (
          <IngredientTag
            key={ing.id}
            name={ing.name}
            isSelected={selected === ing.name}
            className="mr-2 h-[48px] justify-center"
            onPress={() => handleBrowserToggleIng(ing)}
          />
        ))}
      </ScrollView>

      {(!selected && isBrowserOpen) && (
        <View className="px-6 mt-4">
          <IngredientBrowser 
            allIngredients={ingredients}
            selectedIngredients={[]}
            frequencies={frequencies}
            onToggle={handleBrowserToggleIng}
            singleSelect
          />
        </View>
      )}
    </View>
  );
});
