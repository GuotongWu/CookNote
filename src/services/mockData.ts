import { Recipe, Ingredient } from '../types/recipe';

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: '鸡蛋', category: '肉禽类' },
  { id: '2', name: '西红柿', category: '蔬菜类' },
  { id: '3', name: '牛肉', category: '肉禽类' },
  { id: '4', name: '青椒', category: '蔬菜类' },
  { id: '5', name: '土豆', category: '蔬菜类' },
  { id: '6', name: '大蒜', category: '调料类' },
  { id: '7', name: '猪肉', category: '肉禽类' },
  { id: '8', name: '生姜', category: '调料类' },
  { id: '9', name: '大葱', category: '调料类' },
  { id: '10', name: '西兰花', category: '蔬菜类' },
  { id: '11', name: '虾仁', category: '海鲜类' },
  { id: '12', name: '面条', category: '主食类' },
  { id: '13', name: '米饭', category: '主食类' },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: '经典番茄炒蛋',
    imageUris: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80'
    ],
    ingredients: [MOCK_INGREDIENTS[0], MOCK_INGREDIENTS[1]],
    steps: ['准备番茄和鸡蛋', '热锅凉油', '炒熟鸡蛋备用', '炒番茄出汁', '混合'],
    createdAt: Date.now(), // 今天
    isFavorite: true,
  },
  {
    id: '2',
    name: '青椒炒牛肉',
    imageUris: ['https://plus.unsplash.com/premium_photo-1664472314546-f642646279f1?auto=format&fit=crop&w=800&q=80'],
    ingredients: [MOCK_INGREDIENTS[2], MOCK_INGREDIENTS[3]],
    steps: ['牛肉切片腌制', '青椒切块', '大火快炒牛肉', '加入青椒调味'],
    createdAt: Date.now() - 86400000, // 昨天
    isFavorite: false,
  },
  {
    id: '3',
    name: '香煎三文鱼',
    imageUris: [
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80'
    ],
    ingredients: [{ id: 'custom-1', name: '三文鱼', category: '海鲜类' }, { id: '6', name: '大蒜', category: '调料类' }],
    steps: ['三文鱼吸干水分', '抹上盐和黑胡椒', '皮朝下小火慢煎', '加入黄油大蒜淋热油'],
    createdAt: Date.now() - 86400000, // 昨天
    isFavorite: true,
  },
  {
    id: '4',
    name: '酸辣土豆丝',
    imageUris: ['https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80'],
    ingredients: [MOCK_INGREDIENTS[4], MOCK_INGREDIENTS[8]],
    steps: ['土豆切丝泡水', '干辣椒葱花爆香', '大火快炒土豆丝', '出锅前淋陈醋'],
    createdAt: Date.now() - 172800000, // 前天
    isFavorite: false,
  },
  {
    id: '5',
    name: '清爽西兰花',
    imageUris: ['https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80'],
    ingredients: [MOCK_INGREDIENTS[9], MOCK_INGREDIENTS[5]],
    steps: ['西兰花掰小朵', '水开焯烫 1 分钟', '凉水冲凉保持色泽', '蒜末蚝油调味'],
    createdAt: Date.now() - 259200000, // 3天前
    isFavorite: false,
  }
];
