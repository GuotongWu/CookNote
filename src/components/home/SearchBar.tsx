import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
}

export const SearchBar = React.memo(({ value, onChange }: SearchBarProps) => (
  <View className="flex-row items-center bg-gray-100/80 rounded-2xl px-4 py-3.5 mb-6 border border-gray-200/50">
    <Search size={20} color="#9CA3AF" strokeWidth={2.5} />
    <TextInput 
      placeholder="搜索你的菜谱或原料..."
      className="flex-1 ml-3 text-[16px] text-gray-800 font-medium"
      value={value}
      onChangeText={onChange}
      returnKeyType="search"
      placeholderTextColor="#9CA3AF"
    />
    {value.length > 0 && (
      <TouchableOpacity 
        onPress={() => onChange('')}
        className="w-6 h-6 bg-gray-300 rounded-full items-center justify-center"
      >
        <Text className="text-white text-[10px] font-black">✕</Text>
      </TouchableOpacity>
    )}
  </View>
));
