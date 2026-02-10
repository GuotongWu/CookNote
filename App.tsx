import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput, 
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  UIManager,
  ActionSheetIOS
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { 
  Camera, 
  Search, 
  Filter, 
  Mic, 
  Sparkles,
  UtensilsCrossed,
  Hash,
  Heart,
  Plus,
  Zap
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import "./global.css";
import { MOCK_INGREDIENTS, MOCK_RECIPES } from './src/services/mockData';
import { Recipe, Ingredient, IngredientCategory, FamilyMember } from './src/types/recipe';
import { AddRecipeModal } from './src/components/AddRecipeModal';
import { AddMemberModal } from './src/components/AddMemberModal';
import { RecipeDetailModal } from './src/components/RecipeDetailModal';
import { RecipeStorage } from './src/services/storage';
import { IngredientBrowser } from './src/components/IngredientBrowser';
import { IngredientTag } from './src/components/IngredientTag';
import { springLayout, easeLayout } from './src/utils/animations';
import { triggerSuccess, triggerImpact, triggerSelection } from './src/services/haptics';
import { useRecipes } from './src/hooks/useRecipes';
import { useFamily } from './src/hooks/useFamily';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

// 提取菜谱卡片为独立组件，防止不必要的重渲
const RecipeCard = React.memo(({ recipe, onPress, onDelete, allMembers = [] }: { recipe: Recipe; onPress: () => void; onDelete?: (id: string) => void; allMembers?: FamilyMember[] }) => {
  const dateStr = useMemo(() => {
    if (!recipe.createdAt) return '';
    const date = new Date(recipe.createdAt);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, [recipe.createdAt]);

  const yearStr = useMemo(() => {
    if (!recipe.createdAt) return '';
    return new Date(recipe.createdAt).getFullYear().toString();
  }, [recipe.createdAt]);

  // 获取喜欢该菜谱的成员信息
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
      activeOpacity={0.7}
      className="mb-6 rounded-[28px] bg-white overflow-hidden shadow-soft border border-gray-100"
    >
      <View className="h-44 relative bg-gray-100">
        <Image
          source={{ uri: recipe.imageUris?.[0] || 'https://via.placeholder.com/400' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* 时间浮层：采用日历风格的设计 */}
        <View 
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-2xl items-center justify-center shadow-sm px-2 py-1.5"
          style={{ minWidth: 42 }}
        >
          <Text className="text-[10px] text-red-500 font-bold tracking-tighter uppercase mb-0.5">
            {yearStr}
          </Text>
          <Text className="text-sm text-gray-900 font-black tracking-tighter">
            {dateStr}
          </Text>
        </View>

        {/* 喜欢的家庭成员指示器 */}
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
              className="w-6 h-6 rounded-full items-center justify-center shadow-sm"
            >
              <Text className="text-[8px] text-white font-bold">{member.name.charAt(0)}</Text>
            </View>
          ))}
          {recipe.isFavorite && likedMembers.length === 0 && (
            <View className="bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-sm">
              <Heart size={14} color="#FF6B6B" fill="#FF6B6B" />
            </View>
          )}
        </View>

        {/* 成本标识 */}
        {recipe.cost !== undefined && recipe.cost > 0 && (
          <View className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md rounded-xl px-2 py-1">
            <Text className="text-white text-[10px] font-bold">￥{recipe.cost.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <View className="p-3.5">
        <Text className="text-gray-900 font-bold text-sm mb-2" numberOfLines={1}>
          {recipe.name}
        </Text>
        <View className="flex-row items-center flex-wrap">
          {[...recipe.ingredients]
            .sort((a, b) => (b.cost || 0) - (a.cost || 0))
            .slice(0, 3)
            .map((ing, idx) => (
              <View 
                key={idx} 
                className="bg-gray-100/50 px-1.5 py-1 rounded-lg flex-row items-center mr-1 mb-1 border border-gray-200/30"
              >
                <Hash size={8} color="#9CA3AF" />
                <Text className="text-gray-500 text-[9px] font-bold ml-0.5" numberOfLines={1}>
                  {ing.name}
                </Text>
              </View>
            ))
          }
          {recipe.ingredients.length > 3 && (
            <View className="bg-gray-50 px-1.5 py-1 rounded-lg mb-1">
              <Text className="text-gray-300 text-[9px] font-black">+{recipe.ingredients.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 提取静态组件或使用 memo
const MemoizedAddRecipeModal = React.memo(AddRecipeModal);
const MemoizedRecipeDetailModal = React.memo(RecipeDetailModal);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// 提取搜索框为独立组件，通过 memo 减少不必要的重渲
const SearchBar = React.memo(({ value, onChange }: { value: string, onChange: (text: string) => void }) => (
  <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
    <Search size={20} color="#9CA3AF" />
    <TextInput 
      placeholder="搜索你的菜谱..."
      className="flex-1 ml-3 text-base text-gray-800"
      value={value}
      onChangeText={onChange}
    />
  </View>
));

// 启用 Android 上的 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 提取原料过滤器
const IngredientFilter = React.memo(({ 
  ingredients, 
  selected, 
  onSelect,
  frequencies = {}
}: { 
  ingredients: Ingredient[], 
  selected: string | null, 
  onSelect: (name: string | null) => void,
  frequencies?: Record<string, number>
}) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  // 当点击“全部”时，切换展开/收起状态
  const handleToggleBrowser = useCallback(() => {
    // 使用 LayoutAnimation 实现 iOS 风格的平滑展开
    easeLayout();
    onSelect(null);
    setIsBrowserOpen(prev => !prev);
    triggerImpact();
  }, [onSelect]);

  const handleBrowserToggleIng = useCallback((ing: Ingredient) => {
    easeLayout();
    onSelect(ing.name);
    // 选中特定标签后自动收起
    setIsBrowserOpen(false);
    triggerSelection();
  }, [onSelect]);

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center px-6 mb-4">
        <Text className="text-xl font-bold text-gray-900 tracking-tight">按原料筛选</Text>
        {selected && (
          <TouchableOpacity 
            onPress={() => {
              easeLayout();
              onSelect(null);
              triggerImpact();
            }}
            className="bg-gray-100 px-3 py-1.5 rounded-full"
          >
            <Text className="text-gray-500 text-xs font-semibold">清除筛选</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}
        className="mb-2"
      >
        <IngredientTag
          name={!selected && isBrowserOpen ? '收起全部' : '全部原料'}
          isSelected={!selected}
          className="mr-2 h-[48px] justify-center"
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

      {/* 浏览器区域 - 通过 LayoutAnimation 实现高度自动动画 */}
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

// 提取家庭成员过滤器
const FamilyFilter = React.memo(({ 
  members, 
  selectedId, 
  onSelect,
  onAddPress
}: { 
  members: FamilyMember[], 
  selectedId: string | null, 
  onSelect: (id: string | null) => void,
  onAddPress: () => void
}) => {
  return (
    <View className="mb-6">
      <View className="px-6 mb-4 flex-row justify-between items-end">
        <Text className="text-xl font-bold text-gray-900 tracking-tight">谁的口味？</Text>
        <TouchableOpacity 
          onPress={onAddPress}
          className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} color="#6B7280" />
          <Text className="text-gray-500 text-xs font-bold ml-1">管理成员</Text>
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
          className={`mr-3 px-5 py-2.5 rounded-full border ${!selectedId ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-sm font-bold ${!selectedId ? 'text-white' : 'text-gray-500'}`}>全部</Text>
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
            }}
            className="mr-3 px-5 py-2.5 rounded-full border"
          >
            <Text 
              style={{ color: selectedId === member.id ? 'white' : '#4B5563' }}
              className="text-sm font-bold"
            >
              {member.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={onAddPress}
          className="mr-3 p-2.5 rounded-full border border-dashed border-gray-300 bg-gray-50 items-center justify-center"
          style={{ width: 44 }}
        >
          <Plus size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});

/**
 * MainScreen 内部组件优化
 */
function MainScreen() {
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
    saveRecipe,
    deleteRecipe,
    resetData,
    toggleFavorite
  } = useRecipes();

  const { members, addMember, deleteMember } = useFamily();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const insets = useSafeAreaInsets();

  const handleSelectIngredient = useCallback((ingName: string | null) => {
    setSelectedIngredient(ingName);
  }, [setSelectedIngredient]);

  const handleSelectMember = useCallback((id: string | null) => {
    setSelectedMemberId(id);
  }, [setSelectedMemberId]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, [setSearchQuery]);

  const handleResetData = useCallback(() => {
    resetData(MOCK_RECIPES);
    triggerSuccess();
  }, [resetData]);

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
        ListHeaderComponent={
          <>
            <View className="px-6 pt-4 pb-2">
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-gray-400 text-sm font-medium">煮妇/煮夫的秘密库</Text>
                  <Text className="text-3xl font-bold text-gray-900">CookNote</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    triggerImpact();
                    alert("✨ AI 智能推荐功能开发中，敬请期待！");
                  }}
                  className="w-12 h-12 rounded-2xl bg-[#FF6B6B]/10 items-center justify-center"
                >
                  <Sparkles size={24} color="#FF6B6B" />
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
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <UtensilsCrossed size={48} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4 text-center">没有找到相关菜谱</Text>
          </View>
        }
      />
      
      <MemoizedAddRecipeModal 
        isVisible={isAddModalVisible}
        onClose={handleCloseAddModal}
        onSave={saveRecipe}
        initialRecipe={editingRecipe}
        availableIngredients={allAvailableIngredients}
        members={members}
        ingredientFrequencies={ingredientFrequencies}
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

      <AddMemberModal 
        isVisible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        onAdd={addMember}
        members={members}
        onDelete={deleteMember}
      />

      <View className="absolute bottom-10 left-0 right-0 items-center px-6">
        <SafeAreaView edges={['bottom']}>
          <View className="flex-row items-center">
            {/* AI 提示按钮：半透明、带有动态感的胶囊 */}
            <TouchableOpacity 
              onPress={() => {
                triggerImpact();
                alert("✨ AI 实验室：上传图片后，系统将自动为您提取食材并生成烹饪步骤！");
              }}
              activeOpacity={0.8}
              className="mr-4 shadow-xl border border-white/20 rounded-2xl overflow-hidden"
            >
              <BlurView intensity={80} tint="light" className="px-5 py-3 flex-row items-center">
                <Zap size={18} color="#FF6B6B" fill="#FF6B6B" />
                <Text className="ml-2 text-gray-800 font-bold text-xs">AI 自动生成标签/步骤</Text>
              </BlurView>
            </TouchableOpacity>

            {/* 主创建按钮：圆形、渐变效果感 */}
            <TouchableOpacity 
              className="w-18 h-18 bg-[#FF6B6B] rounded-full items-center justify-center border-4 border-white shadow-card shadow-primary/30"
              style={{ width: 72, height: 72 }}
              onPress={() => {
                triggerImpact();
                handleOpenAddModal();
              }}
            >
              <Plus size={36} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

