import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Platform,
  Dimensions 
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ChevronLeft, Trash2, Edit3, Heart } from 'lucide-react-native';
import { Recipe } from '../types/recipe';
import { IngredientTag } from './IngredientTag';
import { triggerImpact, triggerSuccess } from '../services/haptics';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (recipe: Recipe) => void; 
  onToggleFavorite?: (recipe: Recipe) => void; // 新增：切换收藏回调
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = React.memo(({ 
  recipe, 
  isVisible, 
  onClose, 
  onDelete,
  onEdit,
  onToggleFavorite
}) => {
  const insets = useSafeAreaInsets();
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  if (!isVisible || !recipe) return null;

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  return (
    <Modal 
      visible={isVisible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
            <TouchableOpacity onPress={onClose} className="mr-4">
              <ChevronLeft size={28} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold flex-1" numberOfLines={1}>{recipe.name}</Text>
            
            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => {
                  onToggleFavorite?.(recipe);
                  if (!recipe.isFavorite) triggerSuccess();
                  else triggerImpact();
                }}
                className={`p-2 mr-2 rounded-full ${recipe.isFavorite ? 'bg-red-50' : 'bg-gray-50'}`}
              >
                <Heart 
                  size={22} 
                  color={recipe.isFavorite ? '#FF6B6B' : '#4B5563'} 
                  fill={recipe.isFavorite ? '#FF6B6B' : 'transparent'} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  triggerImpact();
                  onEdit?.(recipe);
                }}
                className="p-2 mr-2 bg-gray-50 rounded-full"
              >
                <Edit3 size={22} color="#4B5563" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  triggerImpact();
                  const confirmed = Platform.OS === 'web' 
                    ? window.confirm('确定要从你的秘密食谱库中移除这个菜谱吗？')
                    : true; 
                  if (confirmed) onDelete?.(recipe.id);
                }}
                className="p-2 bg-red-50 rounded-full"
              >
                <Trash2 size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 顶图多图浏览 - 优雅的横向分页 */}
            <View className="h-96 w-full bg-gray-100">
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {(recipe.imageUris || []).map((uri, index) => (
                  <Image 
                    key={index}
                    source={{ uri }} 
                    style={{ width: SCREEN_WIDTH }}
                    className="h-full"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              
              {/* 图片指示器（如果是多图） */}
              {(recipe.imageUris?.length || 0) > 1 && (
                <View className="absolute bottom-4 right-6 bg-black/50 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">{activeImageIndex + 1} / {recipe.imageUris?.length}</Text>
                </View>
              )}
            </View>

            <View className="px-6 py-6" style={{ paddingBottom: insets.bottom + 40 }}>
              {/* 记录时间卡片 */}
              <View className="flex-row items-center mb-6 bg-gray-50 p-4 rounded-2xl">
                <Clock size={20} color="#6B7280" />
                <Text className="text-gray-500 ml-2">记录于 {new Date(recipe.createdAt).toLocaleDateString()}</Text>
              </View>

              {/* 原料列表 */}
              <Text className="text-xl font-bold text-gray-900 mb-4">主要原料</Text>
              <View className="flex-row flex-wrap mb-8">
                {recipe.ingredients.map(ing => (
                  <IngredientTag 
                    key={ing.id} 
                    name={ing.name} 
                    amount={ing.amount}
                    variant="primary"
                    className="bg-[#FF6B6B]/10 border-transparent"
                  />
                ))}
              </View>

              {/* 步骤列表 */}
              <Text className="text-xl font-bold text-gray-900 mb-4">烹饪步骤</Text>
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((step, index) => (
                  <View key={index} className="flex-row mb-4">
                    <View className="w-8 h-8 rounded-full bg-[#FF6B6B] items-center justify-center mr-3 mt-1">
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-gray-800 text-lg leading-7">{step}</Text>
                  </View>
                ))
              ) : (
                <View className="bg-gray-50 p-6 rounded-3xl items-center border border-dashed border-gray-200">
                  <Text className="text-gray-400 text-center mb-2">尚未记录详细步骤</Text>
                  <TouchableOpacity className="flex-row items-center bg-white px-5 py-3 rounded-2xl shadow-sm">
                    <Text className="text-[#FF6B6B] font-bold">✨ AI 识别语音生成步骤</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

