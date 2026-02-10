import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { Hash, Heart } from 'lucide-react-native';
import { Recipe, FamilyMember } from '../../types/recipe';
import { formatDate } from '../../utils/recipe';
import { COLUMN_WIDTH } from '../../utils/animations';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onDelete?: (id: string) => void;
  allMembers?: FamilyMember[];
}

export const RecipeCard = React.memo(({ recipe, onPress, onDelete, allMembers = [] }: RecipeCardProps) => {
  const { dateStr, yearStr } = useMemo(() => formatDate(recipe.createdAt), [recipe.createdAt]);

  const likedMembers = useMemo(() => {
    if (!recipe.likedBy || !allMembers.length) return [];
    return allMembers.filter(m => recipe.likedBy?.includes(m.id));
  }, [recipe.likedBy, allMembers]);

  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '删除食谱'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: recipe.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) onDelete?.(recipe.id);
        }
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      style={{ width: COLUMN_WIDTH }}
      activeOpacity={0.8}
      className="mb-6 rounded-[32px] bg-white overflow-hidden shadow-soft border border-gray-100"
    >
      <View className="h-48 relative bg-gray-100">
        <Image
          source={{ uri: recipe.imageUris?.[0] || 'https://via.placeholder.com/400' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* iOS Style Glass Date Badge */}
        <View 
          className="absolute top-3 left-3 bg-white/80 backdrop-blur-md rounded-2xl items-center justify-center shadow-sm px-2.5 py-1.5"
          style={{ minWidth: 44 }}
        >
          <Text className="text-[10px] text-red-500 font-black tracking-tighter uppercase mb-0.5">
            {yearStr}
          </Text>
          <Text className="text-sm text-gray-900 font-black tracking-tighter">
            {dateStr}
          </Text>
        </View>

        {/* Member Avatars */}
        <View className="absolute top-3 right-3 flex-row-reverse">
          {likedMembers.slice(0, 3).map((member, idx) => (
            <View 
              key={member.id}
              style={{ 
                backgroundColor: member.color,
                marginRight: idx > 0 ? -12 : 0,
                zIndex: 10 - idx,
                borderWidth: 2,
                borderColor: 'white'
              }}
              className="w-7 h-7 rounded-full items-center justify-center shadow-sm"
            >
              <Text className="text-[10px] text-white font-black">{member.name.charAt(0)}</Text>
            </View>
          ))}
          {recipe.isFavorite && likedMembers.length === 0 && (
            <View className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-sm">
              <Heart size={14} color="#FF6B6B" fill="#FF6B6B" />
            </View>
          )}
        </View>

        {/* Cost Tag */}
        {recipe.cost !== undefined && recipe.cost > 0 && (
          <View className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-1.5">
            <Text className="text-white text-[11px] font-bold">￥{recipe.cost.toFixed(1)}</Text>
          </View>
        )}
      </View>
      
      <View className="p-4">
        <Text className="text-gray-900 font-extrabold text-[15px] mb-2.5" numberOfLines={1}>
          {recipe.name}
        </Text>
        <View className="flex-row items-center flex-wrap">
          {[...recipe.ingredients]
            .sort((a, b) => (b.cost || 0) - (a.cost || 0))
            .slice(0, 2)
            .map((ing, idx) => (
              <View 
                key={idx} 
                className="bg-gray-50 px-2 py-1.5 rounded-xl flex-row items-center mr-1.5 mb-1.5 border border-gray-100"
              >
                <Hash size={10} color="#9CA3AF" />
                <Text className="text-gray-500 text-[10px] font-bold ml-1" numberOfLines={1}>
                  {ing.name}
                </Text>
              </View>
            ))
          }
          {recipe.ingredients.length > 2 && (
            <View className="bg-gray-50 px-2 py-1.5 rounded-xl mb-1.5 border border-gray-100">
              <Text className="text-gray-400 text-[10px] font-black">+{recipe.ingredients.length - 2}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});
