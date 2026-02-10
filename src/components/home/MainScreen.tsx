import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Sparkles,
  Plus,
  Heart,
  UtensilsCrossed
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

import { Recipe } from '../../types/recipe';
import { AddRecipeModal } from '../AddRecipeModal';
import { AddMemberModal } from '../AddMemberModal';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { RecipeCard } from './RecipeCard';
import { SearchBar } from './SearchBar';
import { IngredientFilter } from './IngredientFilter';
import { FamilyFilter } from './FamilyFilter';
import { springLayout, easeLayout, COLUMN_WIDTH } from '../../utils/animations';
import { triggerSuccess, triggerImpact, triggerSelection } from '../../services/haptics';
import { useRecipes } from '../../hooks/useRecipes';
import { useFamily } from '../../hooks/useFamily';
import { AIService } from '../../services/aiService';

const { width } = Dimensions.get('window');

const MemoizedAddRecipeModal = React.memo(AddRecipeModal);
const MemoizedRecipeDetailModal = React.memo(RecipeDetailModal);

export const MainScreen = () => {
  const {
    groupedRecipes,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedIngredient,
    setSelectedIngredient,
    selectedMemberId,
    setSelectedMemberId,
    allAvailableIngredients,
    ingredientFrequencies,
    refresh,
    saveRecipe,
    deleteRecipe,
    resetData,
    toggleFavorite
  } = useRecipes();

  const { members, addMember, updateMember, deleteMember } = useFamily();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const insets = useSafeAreaInsets();

  const handleAIUpload = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 6, // 限制一次最多选择 6 张，确保模型识别稳定性
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    if (result.assets.length > 6) {
      Alert.alert("提示", "一次最多只能上传 6 张图片进行 AI 识别");
      return;
    }

    setIsAIProcessing(true);
    triggerImpact();

    try {
      const base64Images = result.assets
        .map(asset => asset.base64)
        .filter((b): b is string => !!b);
      
      const aiData = await AIService.analyzeRecipeImage(base64Images);
      
      const initialRecipe: Recipe = {
        id: `ai-${Date.now()}`,
        name: aiData.name || '',
        imageUris: result.assets.map(asset => asset.uri),
        ingredients: aiData.ingredients || [],
        steps: aiData.steps || [],
        createdAt: Date.now(),
        isFavorite: false,
        likedBy: []
      };

      setEditingRecipe(initialRecipe);
      setIsAddModalVisible(true);
      triggerSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "由于网络波动或服务器繁忙，识别未能完成。";
      Alert.alert(
        "AI 识读失败",
        errorMessage,
        [{ text: "我知道了", style: "cancel" }]
      );
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

  const handleSelectIngredient = useCallback((ingName: string | null) => {
    setSelectedIngredient(ingName);
  }, [setSelectedIngredient]);

  const handleSelectMember = useCallback((id: string | null) => {
    setSelectedMemberId(id);
  }, [setSelectedMemberId]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, [setSearchQuery]);

  const handleOpenAddModal = useCallback(() => {
    setEditingRecipe(null);
    setIsAddModalVisible(true);
  }, []);

  const handleOpenEditModal = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSelectedRecipe(null);
    setIsAddModalVisible(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalVisible(false);
    setEditingRecipe(null);
  }, []);

  const handleCloseDetailModal = useCallback(() => setSelectedRecipe(null), []);

  const handleToggleFavorite = useCallback(async (recipe: Recipe) => {
    const updated = await toggleFavorite(recipe);
    springLayout();
    if (updated.isFavorite) triggerSuccess();
    else triggerImpact();
    setSelectedRecipe(updated);
  }, [toggleFavorite]);

  const handleDeleteRecipe = useCallback(async (id: string) => {
    await deleteRecipe(id);
    setSelectedRecipe(null);
  }, [deleteRecipe]);

  const renderGroup = useCallback(({ item }: { item: { title: string; data: Recipe[]; isSpecial?: boolean } }) => (
    <View className="px-6 mb-8">
      <View className="flex-row items-center mb-4">
        <Text className={`text-2xl font-black mr-2 ${item.isSpecial ? 'text-[#FF6B6B]' : 'text-gray-900'}`}>{item.title}</Text>
        {item.isSpecial ? (
          <Heart size={20} color="#FF6B6B" fill="#FF6B6B" />
        ) : (
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pt-1">
            {item.data.length} 篇记录
          </Text>
        )}
      </View>
      <View className="flex-row flex-wrap justify-between">
        {item.data.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            onPress={() => setSelectedRecipe(recipe)} 
            onDelete={handleDeleteRecipe}
            allMembers={members}
          />
        ))}
        {item.data.length % 2 !== 0 && <View style={{ width: COLUMN_WIDTH }} />}
      </View>
    </View>
  ), [members, handleDeleteRecipe]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="text-gray-400 mt-4">正在打开您的私人食谱书...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      <StatusBar style="dark" />
      
      <FlatList
        data={groupedRecipes}
        renderItem={renderGroup}
        keyExtractor={item => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-10">
            <UtensilsCrossed size={48} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4 text-center">
              {searchQuery || selectedIngredient || selectedMemberId 
                ? "没有找到匹配的发现？尝试换个关键词或者清除筛选。"
                : "你的食谱书还是空的，点击下方按钮添加第一篇美味记录吧！"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refresh}
            tintColor="#FF6B6B"
            colors={["#FF6B6B"]}
          />
        }
        ListHeaderComponent={
          <>
            <View className="px-6 pt-10 pb-4">
              <View className="flex-row justify-between items-center mb-8">
                <View>
                  <Text className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">CookNote Studio</Text>
                  <Text className="text-4xl font-black text-gray-900 tracking-tighter">我的食谱记录</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    triggerImpact();
                    alert("✨ AI 智能推荐功能开发中，敬请期待！");
                  }}
                  className="w-14 h-14 rounded-[22px] bg-gray-50 items-center justify-center border border-gray-100 shadow-sm"
                >
                  <Sparkles size={28} color="#FF6B6B" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <SearchBar value={searchQuery} onChange={handleSearchChange} />
            </View>

            <FamilyFilter 
              members={members}
              selectedId={selectedMemberId}
              onSelect={handleSelectMember}
              onAddPress={() => setIsAddMemberModalVisible(true)}
            />

            <IngredientFilter 
              ingredients={allAvailableIngredients}
              selected={selectedIngredient}
              onSelect={handleSelectIngredient}
              frequencies={ingredientFrequencies}
            />

            {(selectedIngredient || searchQuery || selectedMemberId) && (
              <View className="px-6 mb-6">
                <Text className="text-gray-400 text-sm mb-1">正在筛选</Text>
                <Text className="text-xl font-bold text-gray-800">
                  {selectedMemberId ? `${members.find(m => m.id === selectedMemberId)?.name} 喜欢的` : ''} 
                  {selectedIngredient ? ` #${selectedIngredient}` : ''} 
                  {searchQuery ? ` "${searchQuery}"` : ''}
                </Text>
              </View>
            )}
          </>
        }
      />

      {/* Floating Action Buttons */}
      <View className="absolute bottom-12 left-0 right-0 items-center justify-center flex-row px-8">
        <TouchableOpacity 
          onPress={handleAIUpload}
          disabled={isAIProcessing}
          activeOpacity={0.8}
          className="mr-4 rounded-[24px] overflow-hidden shadow-xl"
        >
          <BlurView intensity={30} tint="dark" className="w-16 h-16 items-center justify-center bg-black/20">
            {isAIProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Sparkles size={28} color="white" strokeWidth={2.5} />
            )}
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleOpenAddModal}
          activeOpacity={0.9}
          className="flex-1 h-16 rounded-[32px] overflow-hidden shadow-2xl shadow-[#FF6B6B]/40"
        >
          <View className="flex-1 bg-[#FF6B6B] flex-row items-center justify-center">
            <Plus size={28} color="white" strokeWidth={3} />
            <Text className="text-white font-black text-xl ml-2.5 tracking-tight">记录菜谱</Text>
          </View>
        </TouchableOpacity>
      </View>

      <MemoizedAddRecipeModal 
        isVisible={isAddModalVisible}
        onClose={handleCloseAddModal}
        onSave={saveRecipe}
        initialRecipe={editingRecipe}
        availableIngredients={allAvailableIngredients}
        members={members}
        ingredientFrequencies={ingredientFrequencies}
      />

      <AddMemberModal
        isVisible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        onAdd={addMember}
        onUpdate={updateMember}
        onDelete={deleteMember}
        members={members}
      />

      <MemoizedRecipeDetailModal
        recipe={selectedRecipe}
        isVisible={!!selectedRecipe}
        onClose={handleCloseDetailModal}
        onDelete={handleDeleteRecipe}
        onEdit={handleOpenEditModal}
        onToggleFavorite={handleToggleFavorite}
        members={members}
      />
    </View>
  );
};
