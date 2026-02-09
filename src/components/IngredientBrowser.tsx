import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Search, Hash } from 'lucide-react-native';
import { Ingredient, IngredientCategory } from '../types/recipe';
import { IngredientTag } from './IngredientTag';
import { easeLayout } from '../utils/animations';

interface IngredientBrowserProps {
  allIngredients: Ingredient[];
  selectedIngredients: string[];
  onToggle: (ing: Ingredient) => void;
  singleSelect?: boolean;
}

const CATEGORIES: IngredientCategory[] = ['肉禽类', '蔬菜类', '调料类', '海鲜类', '主食类', '其他'];

export const IngredientBrowser: React.FC<IngredientBrowserProps> = ({ 
  allIngredients, 
  selectedIngredients, 
  onToggle,
  singleSelect = false
}) => {
  const [search, setSearch] = useState('');
  
  // 模糊匹配逻辑
  const filtered = useMemo(() => {
    if (!search.trim()) return allIngredients;
    const query = search.trim().toLowerCase();
    return allIngredients.filter(ing => 
      ing.name.toLowerCase().includes(query)
    ).sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [allIngredients, search]);

  const categorized = useMemo(() => {
    const map: Record<string, Ingredient[]> = {};
    filtered.forEach(ing => {
      const cat = ing.category || '其他';
      if (!map[cat]) map[cat] = [];
      map[cat].push(ing);
    });
    
    return CATEGORIES.filter(cat => map[cat]).map(cat => ({
      name: cat,
      items: map[cat]
    }));
  }, [filtered]);

  const handleSearchChange = (text: string) => {
    // 简单的布局动画让搜索结果出现时不跳跃
    easeLayout();
    setSearch(text);
  };

  return (
    <View className="bg-gray-50/50 rounded-[32px] p-5 border border-gray-100">
      <View className="flex-row items-center bg-white rounded-2xl px-4 py-2.5 mb-5 shadow-sm shadow-black/[0.03] border border-gray-50">
        <Search size={18} color="#9CA3AF" />
        <TextInput 
          placeholder="快速查找原料..."
          className="flex-1 ml-2 text-base text-gray-800"
          value={search}
          onChangeText={handleSearchChange}
          placeholderTextColor="#9CA3AF"
          clearButtonMode="while-editing"
        />
      </View>
      
      {categorized.map(cat => (
        <View key={cat.name} className="mb-6">
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-1 h-3 bg-[#FF6B6B] rounded-full mr-2" />
            <Text className="text-sm font-bold text-gray-900">{cat.name}</Text>
            <Text className="text-gray-400 text-[10px] ml-2 font-medium">{cat.items.length}</Text>
          </View>
          <View className="flex-row flex-wrap">
            {cat.items.map(ing => (
              <IngredientTag
                key={ing.id}
                name={ing.name}
                isSelected={selectedIngredients.includes(ing.name)}
                onPress={() => onToggle(ing)}
              />
            ))}
          </View>
        </View>
      ))}

      {filtered.length === 0 && (
        <View className="items-center py-10">
          <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
             <Hash size={24} color="#D1D5DB" />
          </View>
          <Text className="text-gray-400 text-sm font-medium">未找到相关标签</Text>
          <Text className="text-gray-300 text-xs mt-1">您可以尝试手动添加一个</Text>
        </View>
      )}
    </View>
  );
};
