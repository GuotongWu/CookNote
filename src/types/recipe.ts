export type IngredientCategory = '肉禽类' | '蔬菜类' | '调料类' | '海鲜类' | '主食类' | '其他';

export interface Ingredient {
  id: string;
  name: string;
  category?: IngredientCategory;
  amount?: number; // 重量，统一单位为“克(g)”
  cost?: number; // 成本，单位为“元”
}

export interface Recipe {
  id: string;
  name: string;
  imageUris: string[]; // 支持多张图片
  ingredients: Ingredient[];
  steps?: string[];
  createdAt: number;
  isFavorite?: boolean; // 新增收藏状态
  cost?: number; // 总成本
}

/**
 * AI 能力提供者接口 (Agent Skill 兼容)
 * 预留配置化空间，未来可通过不同的 Provider 实现功能的动态热配
 */
export interface AISkillProvider {
  /** 
   * 今日智能推荐
   * @param history 用户历史记录
   */
  getDailyRecommendation: (history: Recipe[]) => Promise<Partial<Recipe>[]>;

  /** 
   * 语音识别转烹饪步骤
   * @param audioUri 语音文件路径
   */
  transcribeVoiceToSteps: (audioUri: string) => Promise<string[]>;

  /** 
   * 图像自动识别主要原料
   * @param imageUri 图片路径
   */
  detectIngredientsFromImage: (imageUri: string) => Promise<Ingredient[]>;
}

export interface AppConfig {
  aiProvider?: AISkillProvider;
  theme: 'light' | 'dark' | 'system';
}
