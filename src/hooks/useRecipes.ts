import { useState, useMemo, useEffect, useCallback } from 'react';
import { Recipe, Ingredient, CATEGORY_PRIORITY } from '../types/recipe';
import { RecipeStorage } from '../services/storage';
import { MOCK_INGREDIENTS } from '../services/mockData';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    try {
      const data = await RecipeStorage.getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const ingredientFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    recipes.forEach(r => {
      r.ingredients.forEach(ing => {
        counts[ing.name] = (counts[ing.name] || 0) + 1;
      });
    });
    return counts;
  }, [recipes]);

  const allAvailableIngredients = useMemo(() => {
    const seenNames = new Set<string>();
    const baseList = [...MOCK_INGREDIENTS, ...recipes.flatMap(r => r.ingredients || [])];
    
    const uniqueList = baseList.filter(ing => {
      if (seenNames.has(ing.name)) return false;
      seenNames.add(ing.name);
      return true;
    });

    // 优先按分类(肉禽 > 海鲜 > 蔬菜 > ...)排序，同分类内按频率排序
    return uniqueList.sort((a, b) => {
      const pA = CATEGORY_PRIORITY[a.category || '其他'] || 99;
      const pB = CATEGORY_PRIORITY[b.category || '其他'] || 99;
      
      if (pA !== pB) return pA - pB;
      
      const freqA = ingredientFrequencies[a.name] || 0;
      const freqB = ingredientFrequencies[b.name] || 0;
      return freqB - freqA;
    });
  }, [recipes, ingredientFrequencies]);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return recipes.filter(recipe => {
      const matchesSearch = !query || recipe.name.toLowerCase().includes(query);
      const matchesIngredient = !selectedIngredient || 
        recipe.ingredients.some(ing => ing.name === selectedIngredient);
      const matchesMember = !selectedMemberId || 
        (recipe.likedBy && recipe.likedBy.includes(selectedMemberId));
      return matchesSearch && matchesIngredient && matchesMember;
    });
  }, [recipes, searchQuery, selectedIngredient, selectedMemberId]);

  const groupedRecipes = useMemo(() => {
    const groups: { title: string; data: Recipe[]; isSpecial?: boolean }[] = [];
    
    // 1. 提取并添加收藏组
    const favorites = filteredRecipes
      .filter(r => r.isFavorite)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    if (favorites.length > 0) {
      groups.push({ title: '我的收藏', data: favorites, isSpecial: true });
    }

    // 2. 按日期分组
    const dateMap = new Map<string, Recipe[]>();
    const sorted = [...filteredRecipes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    sorted.forEach(recipe => {
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

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(recipe);
    });

    dateMap.forEach((data, title) => {
      groups.push({ title, data });
    });

    return groups;
  }, [filteredRecipes]);

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    let updated;
    if (recipes.some(r => r.id === recipe.id)) {
      updated = await RecipeStorage.updateRecipe(recipe);
    } else {
      updated = await RecipeStorage.addRecipe(recipe);
    }
    setRecipes(updated);
  }, [recipes]);

  const deleteRecipe = useCallback(async (id: string) => {
    const updated = await RecipeStorage.deleteRecipe(id);
    setRecipes(updated);
  }, []);

  const resetData = useCallback(async (mockData: Recipe[]) => {
    await RecipeStorage.saveRecipes(mockData);
    setRecipes(mockData);
  }, []);

  const toggleFavorite = useCallback(async (recipe: Recipe) => {
    const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
    const updated = await RecipeStorage.updateRecipe(updatedRecipe);
    setRecipes(updated);
    return updatedRecipe;
  }, []);

  return { 
    recipes: filteredRecipes, 
    allAvailableIngredients,
    ingredientFrequencies,
    groupedRecipes,
    isLoading, 
    searchQuery,
    setSearchQuery,
    selectedIngredient,
    setSelectedIngredient,
    selectedMemberId,
    setSelectedMemberId,
    refresh: loadRecipes,
    saveRecipe,
    deleteRecipe,
    resetData,
    toggleFavorite
  };
};
