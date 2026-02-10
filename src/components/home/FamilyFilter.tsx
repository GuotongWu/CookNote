import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import { FamilyMember } from '../../types/recipe';
import { easeLayout } from '../../utils/animations';
import { triggerImpact } from '../../services/haptics';

interface FamilyFilterProps {
  members: FamilyMember[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddPress: () => void;
}

export const FamilyFilter = React.memo(({ 
  members, 
  selectedId, 
  onSelect,
  onAddPress
}: FamilyFilterProps) => {
  return (
    <View className="mb-8">
      <View className="px-6 mb-4 flex-row justify-between items-end">
        <Text className="text-xl font-black text-gray-900 tracking-tight">谁的口味？</Text>
        <TouchableOpacity 
          onPress={onAddPress}
          className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100"
        >
          <Plus size={14} color="#6B7280" strokeWidth={3} />
          <Text className="text-gray-500 text-xs font-black ml-1.5">成员</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <TouchableOpacity
          onPress={() => {
            easeLayout();
            onSelect(null);
            triggerImpact();
          }}
          className={`mr-3 px-6 py-3 rounded-full border ${!selectedId ? 'bg-gray-900 border-gray-900 shadow-lg shadow-gray-400' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-sm font-black ${!selectedId ? 'text-white' : 'text-gray-500'}`}>全部</Text>
        </TouchableOpacity>
        
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            onPress={() => {
              easeLayout();
              onSelect(selectedId === member.id ? null : member.id);
              triggerImpact();
            }}
            style={{
              backgroundColor: selectedId === member.id ? member.color : 'white',
              borderColor: selectedId === member.id ? member.color : '#E5E7EB',
              shadowColor: member.color,
              elevation: selectedId === member.id ? 4 : 0,
              shadowOpacity: selectedId === member.id ? 0.3 : 0,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 }
            }}
            className="mr-3 px-6 py-3 rounded-full border"
          >
            <Text 
              style={{ color: selectedId === member.id ? 'white' : '#4B5563' }}
              className="text-sm font-black"
            >
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={onAddPress}
          className="mr-3 p-3 rounded-full border border-dashed border-gray-300 bg-gray-50 items-center justify-center"
          style={{ width: 48 }}
        >
          <Plus size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});
