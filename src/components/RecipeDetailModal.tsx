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
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ChevronLeft, Trash2, Edit3, Heart } from 'lucide-react-native';
import { Recipe, FamilyMember } from '../types/recipe';
import { IngredientTag } from './IngredientTag';
import { triggerImpact, triggerSuccess } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (recipe: Recipe) => void; 
  onToggleFavorite?: (recipe: Recipe) => void; 
  members?: FamilyMember[]; 
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = React.memo(({ 
  recipe, 
  isVisible, 
  onClose, 
  onDelete,
  onEdit,
  onToggleFavorite,
  members = []
}) => {
  const insets = useSafeAreaInsets();
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  if (!isVisible || !recipe) return null;

  const likedMembers = members.filter(m => recipe.likedBy?.includes(m.id)) ?? [];

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
        {/* iOS Style Floating Header */}
        <BlurView 
          intensity={80} 
          tint="light" 
          className="absolute top-0 left-0 right-0 z-10 border-b border-gray-100"
        >
          <View className="px-6 py-4 flex-row items-center">
            <TouchableOpacity 
              onPress={onClose} 
              className="mr-4 w-10 h-10 bg-white shadow-sm rounded-full items-center justify-center"
            >
              <ChevronLeft size={24} color="#111827" strokeWidth={3} />
            </TouchableOpacity>
            <Text className="text-xl font-black flex-1 text-gray-900" numberOfLines={1}>{recipe.name}</Text>
            
            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => {
                  onToggleFavorite?.(recipe);
                  if (!recipe.isFavorite) triggerSuccess();
                  else triggerImpact();
                }}
                className={`p-2 w-10 h-10 mr-2 rounded-full items-center justify-center ${recipe.isFavorite ? 'bg-red-50' : 'bg-gray-50'}`}
              >
                <Heart 
                  size={20} 
                  color={recipe.isFavorite ? '#FF6B6B' : '#4B5563'} 
                  fill={recipe.isFavorite ? '#FF6B6B' : 'transparent'} 
                />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  triggerImpact();
                  onEdit?.(recipe);
                }}
                className="p-2 w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
              >
                <Edit3 size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 0 }}
        >
          {/* 顶图多图浏览 */}
          <View className="h-[460px] w-full bg-gray-100">
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
            
            {(recipe.imageUris?.length || 0) > 1 && (
              <View className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Text className="text-white text-[10px] font-black">{activeImageIndex + 1} / {recipe.imageUris?.length}</Text>
              </View>
            )}
          </View>

          <View className="px-6 py-8" style={{ paddingBottom: insets.bottom + 100 }}>
            {/* 核心信息卡片 */}
            <View className="flex-row items-center mb-8 space-x-3">
              <View className="flex-1 flex-row items-center bg-gray-50/50 border border-gray-100 p-4 rounded-3xl">
                <Clock size={16} color="#6B7280" strokeWidth={2.5} />
                <Text className="text-gray-500 ml-2 text-xs font-bold">{new Date(recipe.createdAt).toLocaleDateString()}</Text>
              </View>
              {recipe.cost !== undefined && recipe.cost > 0 && (
                <View className="bg-[#FF6B6B]/10 px-6 py-4 rounded-3xl border border-[#FF6B6B]/10">
                  <Text className="text-[#FF6B6B] font-black text-xs">￥{recipe.cost.toFixed(1)}</Text>
                </View>
              )}
            </View>

              {/* 喜欢的成员标注 */}
              {likedMembers.length > 0 && (
                <View className="mb-8">
                  <Text className="text-xl font-bold text-gray-900 mb-4">谁最喜欢这道菜？</Text>
                  <View className="flex-row flex-wrap">
                    {likedMembers.map(member => (
                      <View
                        key={member.id}
                        style={{ backgroundColor: member.color }}
                        className="mr-3 mb-3 px-5 py-2.5 rounded-full"
                      >
                        <Text className="text-white text-sm font-bold">{member.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 原料列表 */}
              <Text className="text-xl font-bold text-gray-900 mb-4">主要原料</Text>
              <View className="flex-row flex-wrap mb-8">
                {recipe.ingredients.map(ing => (
                  <IngredientTag 
                    key={ing.id} 
                    name={ing.name} 
                    amount={ing.amount}
                    cost={ing.cost}
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
    </Modal>
  );
});

