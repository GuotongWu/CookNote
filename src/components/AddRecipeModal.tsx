import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
  LayoutAnimation
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Recipe, Ingredient, AISkillProvider, FamilyMember } from '../types/recipe';
import { MOCK_INGREDIENTS } from '../services/mockData';
import { RecipeImagePicker } from './recipe/RecipeImagePicker';
import { RecipeIngredientEditor } from './recipe/RecipeIngredientEditor';
import { RecipeStepEditor } from './recipe/RecipeStepEditor';
import { RecipeMemberSelector } from './recipe/RecipeMemberSelector';
import { easeLayout, springLayout } from '../utils/animations';
import { triggerSuccess, triggerImpact } from '../services/haptics';
import { calculateIngredientsCost } from '../utils/recipe';

interface AddRecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe | null; // 新增：用于编辑模式
  availableIngredients?: Ingredient[]; // 允许外部传入动态标签列表
  aiProvider?: AISkillProvider; // 预留 AI 能力接口
  members?: FamilyMember[]; // 新增：从外部传入成员列表以保持同步
  ingredientFrequencies?: Record<string, number>; // 新增：标签频率
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ 
  isVisible, 
  onClose, 
  onSave, 
  initialRecipe,
  availableIngredients = MOCK_INGREDIENTS, 
  aiProvider,
  members = [],
  ingredientFrequencies = {}
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  // 新增：动态管理所有可选原料列表，使新添加的标签能出现在浏览器中
  const [dynamicAvailableIngredients, setDynamicAvailableIngredients] = useState<Ingredient[]>(availableIngredients);

  // 同步外部传入的原料列表
  React.useEffect(() => {
    setDynamicAvailableIngredients(availableIngredients);
  }, [availableIngredients]);

  const [steps, setSteps] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [likedBy, setLikedBy] = useState<string[]>([]);
  const [manualCost, setManualCost] = useState<string>(''); // 手动输入的总成本
  const [ingredientCostInputs, setIngredientCostInputs] = useState<Record<string, string>>({}); // 记录各原料成本的原始输入字符串

  // 计算标签成本总和
  const autoCost = React.useMemo(() => {
    return calculateIngredientsCost(selectedIngredients);
  }, [selectedIngredients]);

  // 最终显示的成本（优先使用手动，否则自动）
  const displayTotalCost = manualCost !== '' ? manualCost : autoCost.toFixed(2);

  // 监听 initialRecipe 的变化，填充表单（编辑模式）
  React.useEffect(() => {
    if (isVisible) {
      if (initialRecipe) {
        setName(initialRecipe.name);
        setImageUris(initialRecipe.imageUris || []);
        // 加载时清洗数据，确保重量仅为数字
        const sanitizedIngredients = (initialRecipe.ingredients || []).map(ing => ({
          ...ing,
          amount: typeof ing.amount === 'string' 
            ? parseInt((ing.amount as string).replace(/[^0-9]/g, ''), 10) || undefined
            : ing.amount,
          cost: ing.cost || 0
        }));
        setSelectedIngredients(sanitizedIngredients);
        
        // 初始化成本输入字符串映射
        const costMap: Record<string, string> = {};
        sanitizedIngredients.forEach(ing => {
          if (ing.cost !== undefined && ing.cost > 0) {
            costMap[ing.id] = ing.cost.toString();
          }
        });
        setIngredientCostInputs(costMap);

        setSteps(initialRecipe.steps || []);
        setIsFavorite(!!initialRecipe.isFavorite);
        setLikedBy(initialRecipe.likedBy || []);
        
        if (initialRecipe.cost !== undefined) {
          const totalTags = calculateIngredientsCost(sanitizedIngredients);
          // 只有当手动成本与自动计算不一致时，才设置手动成本
          if (Math.abs(initialRecipe.cost - totalTags) > 0.01 || initialRecipe.cost === 0) {
            setManualCost(initialRecipe.cost.toString());
          }
        }
      } else {
        resetForm();
      }
    }
  }, [isVisible, initialRecipe]);

  // 预请求权限，减少点击时的等待
  React.useEffect(() => {
    if (isVisible && Platform.OS !== 'web') {
      (async () => {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      })();
    }
  }, [isVisible]);

  const pickImage = React.useCallback(async (useCamera: boolean) => {
    setIsPickingImage(true);
    
    // 使用 InteractionManager 确保当前所有 UI 动画已结束
    InteractionManager.runAfterInteractions(async () => {
      try {
        const options: ImagePicker.ImagePickerOptions = {
          allowsEditing: false, // 必须关闭编辑才能支持多选
          allowsMultipleSelection: !useCamera,
          quality: 0.6,
          mediaTypes: ['images'],
          selectionLimit: 0, // 0 表示无限制（iOS 14+）
        };

        const result = useCamera 
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
          const newUris = result.assets.map(asset => asset.uri);
          setImageUris(prev => [...prev, ...newUris]);
        }
      } catch (error) {
        console.error('Pick image error:', error);
      } finally {
        setIsPickingImage(false);
      }
    });
  }, []);

  const removeImage = React.useCallback((index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setImageUris(prev => prev.filter((_, i) => i !== index));
  }, []);

  const setAsCover = React.useCallback((index: number) => {
    if (index === 0) return;
    triggerImpact();
    setImageUris(prev => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      return [selected, ...next];
    });
  }, []);

  const toggleIngredient = React.useCallback((ing: Ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(i => i.id === ing.id);
      if (exists) {
        // 移除时同时清理输入状态
        setIngredientCostInputs(inputs => {
          const next = { ...inputs };
          delete next[ing.id];
          return next;
        });
        return prev.filter(i => i.id !== ing.id);
      }
      return [...prev, ing];
    });
  }, []);

  const updateIngredient = React.useCallback((id: string, updates: Partial<Ingredient>, rawCost?: string) => {
    if (rawCost !== undefined) {
      setIngredientCostInputs(prev => ({ ...prev, [id]: rawCost }));
    }
    setSelectedIngredients(prev => prev.map(ing => 
      ing.id === id ? { ...ing, ...updates } : ing
    ));
  }, []);

  const removeStep = React.useCallback((index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleLikedBy = React.useCallback((memberId: string) => {
    setLikedBy(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
    triggerImpact();
  }, []);

  const handleAISteps = React.useCallback(async () => {
    if (imageUris.length === 0) {
      alert('请先上传图片，以便 AI 识别生成步骤');
      return;
    }
    // 预留 Agent Skill 接口调用
    console.log("Triggering Agent Skill: Image to Steps");
    alert("AI 智能识别功能已预留 Agent Skill 接口，配置完成后即可自动生成步骤！");
  }, [imageUris]);

  const handleSave = React.useCallback(() => {
    if (!name.trim() || imageUris.length === 0) {
      alert('请输入名字并至少上传一张图片');
      return;
    }
    const newRecipe: Recipe = {
      id: initialRecipe ? initialRecipe.id : Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      imageUris,
      ingredients: selectedIngredients,
      steps: steps.length > 0 ? steps : undefined,
      createdAt: initialRecipe ? initialRecipe.createdAt : Date.now(),
      isFavorite,
      likedBy,
      cost: parseFloat(displayTotalCost) || 0
    };
    onSave(newRecipe);
    onClose();
    // 延迟重置，避免弹窗关闭动画中内容消失
    setTimeout(resetForm, 400);
  }, [name, imageUris, selectedIngredients, steps, onSave, onClose, initialRecipe, displayTotalCost, isFavorite]);

  const resetForm = React.useCallback(() => {
    setName('');
    setImageUris([]);
    setSelectedIngredients([]);
    setDynamicAvailableIngredients(availableIngredients);
    setSteps([]);
    setIsFavorite(false);
    setLikedBy([]);
    setManualCost('');
    setIngredientCostInputs({});
  }, [availableIngredients]);

  return (
    <Modal 
      visible={isVisible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">{initialRecipe ? '编辑菜谱' : '记录新菜谱'}</Text>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            className="flex-1 px-6 pt-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. 图片选择区域 */}
            <RecipeImagePicker
              imageUris={imageUris}
              isPickingImage={isPickingImage}
              onPickImage={pickImage}
              onRemoveImage={removeImage}
              onSetAsCover={setAsCover}
            />

            {/* 2. 菜谱名称输入 */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-gray-900 mb-4 tracking-tight">给它取个名字</Text>
              <TextInput
                placeholder="例如：米其林三星三文鱼..."
                className="bg-gray-50 px-5 py-4 rounded-2xl text-lg font-bold text-gray-800 border border-gray-100"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* 3. 家庭成员与收藏 */}
            <RecipeMemberSelector
              members={members}
              likedBy={likedBy}
              isFavorite={isFavorite}
              onToggleLikedBy={toggleLikedBy}
              onToggleFavorite={() => {
                setIsFavorite(!isFavorite);
                triggerImpact();
              }}
            />

            {/* 4. 原料编辑区域 */}
            <RecipeIngredientEditor
              selectedIngredients={selectedIngredients}
              availableIngredients={dynamicAvailableIngredients}
              ingredientFrequencies={ingredientFrequencies}
              onToggleIngredient={toggleIngredient}
              onUpdateIngredient={updateIngredient}
              onAddCustomIngredient={(name, category) => {
                const existsInMock = dynamicAvailableIngredients.find(i => i.name === name);
                
                // 如果是全新的原料，加入到动态列表中
                if (!existsInMock) {
                  const newIng: Ingredient = {
                    id: `custom-${Date.now()}`,
                    name,
                    category,
                    amount: 0,
                    cost: 0
                  };
                  setDynamicAvailableIngredients(prev => [newIng, ...prev]);
                }
              }}
            />

            {/* 5. 成本预算区域 */}
            <View className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100/50">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View className="w-1 h-3 bg-primary rounded-full mr-2" />
                  <Text className="text-gray-500 text-sm font-bold">成本预算</Text>
                </View>
                <View className="bg-white/80 px-2 py-0.5 rounded-lg border border-gray-100">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase">自动计算</Text>
                </View>
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-gray-400 text-xl font-medium mr-1.5">¥</Text>
                <TextInput
                  placeholder={displayTotalCost}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="text-gray-900 text-4xl font-bold flex-1 p-0"
                  style={{ includeFontPadding: false }}
                  value={manualCost}
                  onChangeText={setManualCost}
                />
              </View>
              <Text className="text-gray-400 text-[10px] mt-3 font-medium">
                * 由原料估值累加，您也可以手动修改总成本
              </Text>
            </View>

            {/* 6. 烹饪步骤区域 */}
            <RecipeStepEditor
              steps={steps}
              onAddStep={(step) => setSteps(prev => [...prev, step])}
              onRemoveStep={removeStep}
              onAISteps={handleAISteps}
            />

            {/* 7. 保存按钮 */}
            <TouchableOpacity 
              onPress={handleSave}
              className="bg-[#FF6B6B] py-5 rounded-3xl items-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">{initialRecipe ? '完成修改' : '保存记录'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
