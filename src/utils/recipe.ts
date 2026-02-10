import { Ingredient } from '../types/recipe';

/**
 * 计算原料列表的总成本
 */
export const calculateIngredientsCost = (ingredients: Ingredient[]): number => {
  return ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
};

/**
 * 格式化日期显示
 */
export const formatDate = (timestamp?: number): { dateStr: string; yearStr: string } => {
  if (!timestamp) return { dateStr: '', yearStr: '' };
  const date = new Date(timestamp);
  return {
    dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
    yearStr: date.getFullYear().toString()
  };
};
