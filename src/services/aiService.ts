import { Recipe, Ingredient } from '../types/recipe';

/**
 * 模拟 AI 服务的返回结构
 */
interface AIResponse {
  name: string;
  ingredients: Array<{
    name: string;
    amount: number;
    category: string;
  }>;
  steps: string[];
}

/**
 * 菜谱智能识读服务
 */
export const AIService = {
  /**
   * 分析菜谱图片 (小红书风格)
   */
  analyzeRecipeImage: async (base64Images: string[]): Promise<Partial<Recipe>> => {
    /**
     * 环境变量说明：
     * process.env.EXPO_PUBLIC_AI_API_URL: Vercel 中转接口或 AI 供应商接口地址
     * process.env.EXPO_PUBLIC_USE_MOCK: 是否强制开启本地模拟
     */
    // 优先使用环境变量，如果没有则尝试使用相对路径（适配 Vercel Web 部署）
    const API_URL = process.env.EXPO_PUBLIC_AI_API_URL || '/api/analyze';
    const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

    console.log('AI Analysis starting...', { API_URL, USE_MOCK });

    try {
      if (USE_MOCK) {
        console.log('Using Mock Data (USE_MOCK is true)');
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        const mockResult: Partial<Recipe> = {
          name: "香煎三文鱼配时蔬",
          ingredients: [
            { id: `ai-ing-${Date.now()}-1`, name: '三文鱼', amount: 200, category: '海鲜类' },
            { id: `ai-ing-${Date.now()}-2`, name: '西兰花', amount: 100, category: '蔬菜类' },
            { id: `ai-ing-${Date.now()}-3`, name: '大蒜', amount: 10, category: '调料类' }
          ],
          steps: [
            "三文鱼洗净擦干表面水分，撒少许盐和黑胡椒腌制10分钟",
            "西兰花切小朵烧水烫熟备用",
            "热锅下油，三文鱼皮朝下中火煎至焦脆再翻面",
            "放入蒜片煎香，三文鱼四面煎熟即可出盘"
          ]
        };
        return mockResult;
      } else {
        // 实际请求 Vercel 中转接口
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ images: base64Images })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error || `识别失败 (${response.status})`;
          throw new Error(msg);
        }
        
        const data = await response.json();
        // 此时 data 应该是 { name, ingredients, steps } 格式
        return {
          ...data,
          // 为食材补充 ID 并保留 AI 建议的分类
          ingredients: (data.ingredients || []).map((ing: any, idx: number) => ({
            ...ing,
            id: `ai-ing-${Date.now()}-${idx}`,
            category: ing.category || '其他'
          }))
        };
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      // 将捕获到的错误重新抛出，如果是自定义 Error 则保留 message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('连接 AI 服务失败，请检查网络或稍后再试');
    }
  }
};
