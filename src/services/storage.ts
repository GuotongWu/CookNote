import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, FamilyMember } from '../types/recipe';
import { MOCK_RECIPES } from './mockData';

const RECIPES_STORAGE_KEY = '@cooknote_recipes';
const FAMILY_STORAGE_KEY = '@cooknote_family';

const DEFAULT_FAMILY: FamilyMember[] = [
  { id: '1', name: '我', color: '#FF6B6B' },
  { id: '2', name: '爸爸', color: '#4DABF7' },
  { id: '3', name: '妈妈', color: '#FCC419' },
];

export const FamilyStorage = {
  async getMembers(): Promise<FamilyMember[]> {
    try {
      const data = await AsyncStorage.getItem(FAMILY_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // 首次进入时，不必阻塞 UI 等待保存完成
      this.saveMembers(DEFAULT_FAMILY);
      return DEFAULT_FAMILY;
    } catch (e) {
      console.error('Failed to load family members', e);
      return DEFAULT_FAMILY;
    }
  },

  async saveMembers(members: FamilyMember[]): Promise<void> {
    try {
      await AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save family members', e);
    }
  },

  async addMember(member: FamilyMember): Promise<FamilyMember[]> {
    const members = await this.getMembers();
    const newMembers = [...members, member];
    await this.saveMembers(newMembers);
    return newMembers;
  }
};

export const RecipeStorage = {
  async getRecipes(): Promise<Recipe[]> {
    try {
      const data = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // 初次启动使用 Mock 数据，异步保存减少启动耗时
      this.saveRecipes(MOCK_RECIPES);
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
