import { useState, useMemo, useEffect, useCallback } from 'react';
import { Recipe, Ingredient } from '../types/recipe';
import { RecipeStorage } from '../services/storage';

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

  const allAvailableIngredients = useMemo(() => {
    const seenNames = new Set<string>();
    return recipes
      .flatMap(r => r.ingredients || [])
      .filter(ing => {
        if (seenNames.has(ing.name)) return false;
        seenNames.add(ing.name);
        return true;
      });
  }, [recipes]);

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
