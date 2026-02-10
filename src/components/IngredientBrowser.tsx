import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SectionList, Platform } from 'react-native';
import { Search, Hash, TrendingUp } from 'lucide-react-native';
import { Ingredient, IngredientCategory, INGREDIENT_CATEGORIES } from '../types/recipe';
import { IngredientTag } from './IngredientTag';
import { easeLayout } from '../utils/animations';
import { triggerImpact } from '../services/haptics';

interface IngredientBrowserProps {
  allIngredients: Ingredient[];
  selectedIngredients: Ingredient[];
  onToggle: (ing: Ingredient) => void;
  singleSelect?: boolean;
  frequencies?: Record<string, number>;
  searchQuery?: string;
  hideSearch?: boolean;
}

export const IngredientBrowser: React.FC<IngredientBrowserProps> = ({ 
  allIngredients, 
  selectedIngredients, 
  onToggle,
  singleSelect = false,
  frequencies = {},
  searchQuery = '',
  hideSearch = false
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const search = hideSearch ? searchQuery : internalSearch;
  
  // 模糊匹配 & 排序逻辑
  const filtered = useMemo(() => {
    let list = [...allIngredients];
    
    // 如果没有搜索，则按频率全局简单预排（可选，这里主要在分类内排）
    if (!search.trim()) {
      return list;
    }

    const query = search.trim().toLowerCase();
    return list.filter(ing => 
      ing.name.toLowerCase().includes(query)
    ).sort((a, b) => {
      // 搜索匹配度优先
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // 其次按频率排序
      const freqA = frequencies[a.name] || 0;
      const freqB = frequencies[b.name] || 0;
      return freqB - freqA;
    });
  }, [allIngredients, search, frequencies]);

  const sections = useMemo(() => {
    const map: Record<string, Ingredient[]> = {};
    filtered.forEach(ing => {
      const cat = ing.category || '其他';
      if (!map[cat]) map[cat] = [];
      map[cat].push(ing);
    });
    
    return INGREDIENT_CATEGORIES.filter(cat => map[cat]).map(cat => ({
      title: cat,
      // 在分类内部按频率排序
      data: [map[cat].sort((a, b) => {
        const freqA = frequencies[a.name] || 0;
        const freqB = frequencies[b.name] || 0;
        return freqB - freqA;
      })]
    }));
  }, [filtered, frequencies]);

  const handleSearchChange = (text: string) => {
    setInternalSearch(text);
  };

  const renderSectionHeader = ({ section: { title, data } }: any) => (
    <View className="bg-[#fcfcfc] py-3 flex-row items-center border-b border-gray-50 mb-3">
      <View className="w-1 h-3 bg-[#FF6B6B] rounded-full mr-2" />
      <Text className="text-sm font-bold text-gray-900">{title}</Text>
      <Text className="text-gray-400 text-[10px] ml-2 font-medium">{data[0].length}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Ingredient[] }) => (
    <View className="flex-row flex-wrap pb-4">
      {item.map(ing => {
        const freq = frequencies[ing.name] || 0;
        return (
          <IngredientTag
            key={ing.id}
            name={ing.name}
            isSelected={selectedIngredients.some(s => s.name === ing.name)}
            onPress={() => {
              triggerImpact();
              onToggle(ing);
            }}
            // 如果频率很高，可以加个小装饰（可选）
            showDot={freq > 5}
          />
        );
      })}
    </View>
  );

  return (
    <View className="flex-1">
      {/* 搜索栏保持固定 */}
      {!hideSearch && (
        <View className="px-3 pt-3 pb-2 bg-white rounded-t-[32px]">
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-2.5 mb-2 shadow-sm shadow-black/[0.01] border border-gray-100">
            <View className="shrink-0">
              <Search size={18} color="#9CA3AF" />
            </View>
            <TextInput 
              placeholder="快速查找原料..."
              className="flex-1 min-w-0 ml-2 text-base text-gray-800"
              value={internalSearch}
              onChangeText={handleSearchChange}
              placeholderTextColor="#9CA3AF"
              clearButtonMode="while-editing"
              // @ts-ignore - web only
              style={Platform.OS === 'web' ? { outline: 'none' } : {}}
            />
          </View>
        </View>
      )}
      
      <View className="px-3 pb-4">
        {sections.map((section, index) => (
          <View key={section.title}>
            {renderSectionHeader({ section })}
            {renderItem({ item: section.data[0] })}
          </View>
        ))}

        {sections.length === 0 && (
          <View className="items-center py-10">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-3">
               <Hash size={24} color="#D1D5DB" />
            </View>
            <Text className="text-gray-400 text-sm font-medium">未找到相关标签</Text>
            <Text className="text-gray-300 text-xs mt-1">您可以尝试手动添加一个</Text>
          </View>
        )}
      </View>
    </View>
  );
};
