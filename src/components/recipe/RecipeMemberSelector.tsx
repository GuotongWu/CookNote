import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { FamilyMember } from '../../types/recipe';
import { triggerSuccess, triggerImpact } from '../../services/haptics';

interface RecipeMemberSelectorProps {
  members: FamilyMember[];
  likedBy: string[];
  isFavorite: boolean;
  onToggleLikedBy: (memberId: string) => void;
  onToggleFavorite: () => void;
}

export const RecipeMemberSelector: React.FC<RecipeMemberSelectorProps> = ({
  members,
  likedBy,
  isFavorite,
  onToggleLikedBy,
  onToggleFavorite
}) => {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900 tracking-tight">谁爱吃这道菜？</Text>
        <TouchableOpacity 
          onPress={onToggleFavorite}
          className={`flex-row items-center px-4 py-2 rounded-full ${isFavorite ? 'bg-[#FF6B6B]/10' : 'bg-gray-50 border border-gray-100'}`}
        >
          <Heart 
            size={16} 
            color={isFavorite ? '#FF6B6B' : '#9CA3AF'} 
            fill={isFavorite ? '#FF6B6B' : 'transparent'} 
          />
          <Text className={`text-xs ml-2 font-bold ${isFavorite ? 'text-[#FF6B6B]' : 'text-gray-400'}`}>
            {isFavorite ? '已加入收藏' : '加入收藏'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap">
        {members.map((member) => {
          const isSelected = likedBy.includes(member.id);
          return (
            <TouchableOpacity 
              key={member.id}
              onPress={() => onToggleLikedBy(member.id)}
              style={{ 
                backgroundColor: isSelected ? member.color : 'white',
                borderColor: isSelected ? member.color : '#F3F4F6'
              }}
              className="mr-3 mb-3 px-5 py-2.5 rounded-full border"
            >
              <Text 
                style={{ color: isSelected ? 'white' : '#4B5563' }}
                className="text-sm font-bold"
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
