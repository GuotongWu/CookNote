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
  UIManager
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
import { Recipe, Ingredient, IngredientCategory } from './src/types/recipe';
import { AddRecipeModal } from './src/components/AddRecipeModal';
import { RecipeDetailModal } from './src/components/RecipeDetailModal';
import { RecipeStorage } from './src/services/storage';
import { IngredientBrowser } from './src/components/IngredientBrowser';
import { IngredientTag } from './src/components/IngredientTag';
import { springLayout, easeLayout } from './src/utils/animations';
import { triggerSuccess, triggerImpact } from './src/services/haptics';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

// 提取菜谱卡片为独立组件，防止不必要的重渲
const RecipeCard = React.memo(({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) => {
  const dateStr = useMemo(() => {
    if (!recipe.createdAt) return '';
    const date = new Date(recipe.createdAt);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, [recipe.createdAt]);

  const yearStr = useMemo(() => {
    if (!recipe.createdAt) return '';
    return new Date(recipe.createdAt).getFullYear().toString();
  }, [recipe.createdAt]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ width: COLUMN_WIDTH }}
      activeOpacity={0.7}
      className="mb-6 rounded-[28px] bg-white overflow-hidden shadow-sm border border-gray-50"
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
        {/* 收藏标识：如果已收藏，在右上角显示一个小爱心 */}
        {recipe.isFavorite && (
          <View className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-sm">
            <Heart size={14} color="#FF6B6B" fill="#FF6B6B" />
          </View>
        )}
        {/* 成本标识 */}
        {recipe.cost !== undefined && recipe.cost > 0 && (
          <View className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md rounded-xl px-2 py-1">
            <Text className="text-white text-[10px] font-bold">￥{recipe.cost.toFixed(2)}</Text>
          </View>
        )}
      </View>
      <View className="p-3.5">
        <Text className="text-gray-900 font-bold text-base mb-1.5" numberOfLines={1}>
          {recipe.name}
        </Text>
        <View className="flex-row items-center flex-wrap">
          {recipe.ingredients.slice(0, 2).map((ing) => (
            <IngredientTag 
              key={ing.id} 
              name={ing.name} 
              amount={ing.amount}
              variant="ghost" 
              className="px-2 py-0.5 mr-1 mb-1 shadow-none border-transparent bg-gray-50"
            />
          ))}
          {recipe.ingredients.length > 2 && (
            <Text className="text-gray-300 text-[9px] font-bold ml-0.5">...</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 提取静态组件或使用 memo
const MemoizedAddRecipeModal = React.memo(AddRecipeModal);
const MemoizedRecipeDetailModal = React.memo(RecipeDetailModal);

// 缓存初始原料地图，避免重复创建
const INITIAL_INGREDIENT_MAP = new Map<string, Ingredient>(
  MOCK_INGREDIENTS.map(ing => [ing.name, ing])
);

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
  onSelect 
}: { 
  ingredients: Ingredient[], 
  selected: string | null, 
  onSelect: (name: string | null) => void 
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
    triggerImpact();
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
            onToggle={handleBrowserToggleIng}
            singleSelect
          />
        </View>
      )}
    </View>
  );
});

/**
 * MainScreen 内部组件优化
 */
function MainScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRecipes();
  }, []);

  // 使用 Set 进一步优化提取逻辑
  const allAvailableIngredients = useMemo(() => {
    const ingredientMap = new Map<string, Ingredient>(INITIAL_INGREDIENT_MAP);
    for (const recipe of recipes) {
      if (recipe.ingredients) {
        for (const ing of recipe.ingredients) {
          if (!ingredientMap.has(ing.name)) {
            ingredientMap.set(ing.name, ing);
          }
        }
      }
    }
    return Array.from(ingredientMap.values());
  }, [recipes]);

  const loadRecipes = async () => {
    try {
      const data = await RecipeStorage.getRecipes();
      setRecipes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIngredient = useCallback((ingName: string | null) => {
    setSelectedIngredient(ingName);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleResetData = useCallback(async () => {
    try {
      setIsLoading(true);
      await RecipeStorage.saveRecipes(MOCK_RECIPES);
      setRecipes(MOCK_RECIPES);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingRecipe(null);
    setIsAddModalVisible(true);
  }, []);

  const handleOpenEditModal = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSelectedRecipe(null); // 关闭详情页
    setIsAddModalVisible(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalVisible(false);
    setEditingRecipe(null);
  }, []);

  const handleCloseDetailModal = useCallback(() => setSelectedRecipe(null), []);

  const handleToggleFavorite = useCallback(async (recipe: Recipe) => {
    const isNowFavorite = !recipe.isFavorite;
    const updatedRecipe = { ...recipe, isFavorite: isNowFavorite };
    const updatedRecipes = await RecipeStorage.updateRecipe(updatedRecipe);
    
    // 触发动画和触感
    springLayout();
    if (isNowFavorite) triggerSuccess();
    else triggerImpact();
    
    setRecipes(updatedRecipes);
    // 同时更新当前选中的食谱状态
    setSelectedRecipe(updatedRecipe);
  }, [recipes]);

  const groupedRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = recipes.filter(recipe => {
      const matchesSearch = !query || recipe.name.toLowerCase().includes(query);
      const matchesIngredient = !selectedIngredient || 
        recipe.ingredients.some(ing => ing.name === selectedIngredient);
      return matchesSearch && matchesIngredient;
    });

    // 1. 提取收藏并排序（用于顶部展示）
    const favoriteRecipes = filtered
      .filter(r => r.isFavorite)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 2. 将所有匹配的食谱（包含已收藏和未收藏）按时间倒序分组
    const groups: { title: string; data: Recipe[]; isSpecial?: boolean }[] = [];
    
    // 如果有收藏，先添加专门的收藏组（置顶）
    if (favoriteRecipes.length > 0) {
      groups.push({ title: '我的收藏', data: favoriteRecipes, isSpecial: true });
    }

    const map = new Map<string, Recipe[]>();
    
    // 这里不再过滤 !isFavorite，让所有食谱都出现在时间线中
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(recipe => {
      const date = new Date(recipe.createdAt || Date.now());
      const now = new Date();
      let dateKey = `${date.getMonth() + 1}月${date.getDate()}日`;
      
      if (date.toDateString() === now.toDateString()) {
        dateKey = '今天';
      } else {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
          dateKey = '昨天';
        }
      }

      if (!map.has(dateKey)) {
        const group = { title: dateKey, data: [] as Recipe[] };
        groups.push(group);
        map.set(dateKey, group.data);
      }
      map.get(dateKey)!.push(recipe);
    });
    
    return groups;
  }, [recipes, selectedIngredient, searchQuery]);

  const handleSaveRecipe = useCallback(async (recipe: Recipe) => {
    let updated;
    if (recipes.some(r => r.id === recipe.id)) {
      updated = await RecipeStorage.updateRecipe(recipe);
    } else {
      updated = await RecipeStorage.addRecipe(recipe);
    }
    setRecipes(updated);
  }, [recipes]);

  const handleDeleteRecipe = useCallback(async (id: string) => {
    const updated = await RecipeStorage.deleteRecipe(id);
    setRecipes(updated);
    setSelectedRecipe(null);
  }, []);

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
          />
        ))}
        {item.data.length % 2 !== 0 && <View style={{ width: COLUMN_WIDTH }} />}
      </View>
    </View>
  ), []);

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
                  onPress={handleResetData}
                  className="w-12 h-12 rounded-2xl bg-[#FF6B6B]/10 items-center justify-center"
                >
                  <Sparkles size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>

              <SearchBar value={searchQuery} onChange={handleSearchChange} />
            </View>

            <IngredientFilter 
              ingredients={allAvailableIngredients}
              selected={selectedIngredient}
              onSelect={handleSelectIngredient}
            />

            {(selectedIngredient || searchQuery) && (
              <View className="px-6 mb-6">
                <Text className="text-gray-400 text-sm mb-1">正在筛选</Text>
                <Text className="text-xl font-bold text-gray-800">
                  {selectedIngredient ? `#${selectedIngredient}` : ''} {searchQuery ? `"${searchQuery}"` : ''}
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
        onSave={handleSaveRecipe}
        initialRecipe={editingRecipe}
        availableIngredients={allAvailableIngredients}
      />
      <MemoizedRecipeDetailModal 
        recipe={selectedRecipe} 
        isVisible={!!selectedRecipe} 
        onClose={handleCloseDetailModal} 
        onDelete={handleDeleteRecipe} 
        onEdit={handleOpenEditModal}
        onToggleFavorite={handleToggleFavorite}
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
              className="w-18 h-18 bg-[#FF6B6B] rounded-full items-center justify-center border-4 border-white shadow-2xl"
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

