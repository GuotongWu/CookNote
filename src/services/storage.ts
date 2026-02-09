import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types/recipe';
import { MOCK_RECIPES } from './mockData';

const RECIPES_STORAGE_KEY = '@cooknote_recipes';

export const RecipeStorage = {
  async getRecipes(): Promise<Recipe[]> {
    try {
      const data = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // 初次启动使用 Mock 数据
      await this.saveRecipes(MOCK_RECIPES);
      return MOCK_RECIPES;
    } catch (e) {
      console.error('Failed to load recipes', e);
      return MOCK_RECIPES;
    }
  },

  async saveRecipes(recipes: Recipe[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.error('Failed to save recipes', e);
    }
  },

  async addRecipe(recipe: Recipe): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    const newRecipes = [recipe, ...recipes];
    await this.saveRecipes(newRecipes);
    return newRecipes;
  },

  async updateRecipe(recipe: Recipe): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    const newRecipes = recipes.map(r => r.id === recipe.id ? recipe : r);
    await this.saveRecipes(newRecipes);
    return newRecipes;
  },

  async deleteRecipe(id: string): Promise<Recipe[]> {
    const recipes = await this.getRecipes();
    const newRecipes = recipes.filter(r => r.id !== id);
    await this.saveRecipes(newRecipes);
    return newRecipes;
  }
};
