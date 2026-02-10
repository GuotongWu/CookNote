import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  InteractionManager,
  LayoutAnimation
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, Image as ImageIcon, Plus, Trash2, Sparkles, Check, Heart } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Recipe, Ingredient, AISkillProvider, IngredientCategory, FamilyMember } from '../types/recipe';
import { MOCK_INGREDIENTS } from '../services/mockData';
import { IngredientBrowser } from './IngredientBrowser';
import { IngredientTag } from './IngredientTag';
import { easeLayout, springLayout } from '../utils/animations';
import { triggerSuccess, triggerImpact } from '../services/haptics';

const CATEGORIES: IngredientCategory[] = ['肉禽类', '蔬菜类', '调料类', '海鲜类', '主食类', '其他'];

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
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState(''); // 新增：自定义原料重量
  const [newIngredientCost, setNewIngredientCost] = useState(''); // 新增：自定义原料成本
  const [newIngredientCategory, setNewIngredientCategory] = useState<IngredientCategory>('肉禽类');
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [likedBy, setLikedBy] = useState<string[]>([]);
  const [manualCost, setManualCost] = useState<string>(''); // 手动输入的总成本
  const [ingredientCostInputs, setIngredientCostInputs] = useState<Record<string, string>>({}); // 记录各原料成本的原始输入字符串

  // 计算标签成本总和
  const autoCost = React.useMemo(() => {
    return selectedIngredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
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
          const totalTags = sanitizedIngredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
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
          easeLayout();
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

  const handleAddNewIngredient = React.useCallback(() => {
    const trimmedName = newIngredientName.trim();
    if (!trimmedName) return;
    
    // 统一检查逻辑
    const existsInMock = MOCK_INGREDIENTS.find(i => i.name === trimmedName);
    const costValue = parseFloat(newIngredientCost) || 0;
    const amount = parseInt(newIngredientAmount, 10) || undefined;
    
    setSelectedIngredients(prev => {
      if (prev.some(i => i.name === trimmedName)) return prev;
      
      const newIng: Ingredient = existsInMock ? { ...existsInMock, amount, cost: costValue } : {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        category: newIngredientCategory,
        amount,
        cost: costValue
      };
      
      if (newIngredientCost) {
        setIngredientCostInputs(inputs => ({ ...inputs, [newIng.id]: newIngredientCost }));
      }
      
      return [...prev, newIng];
    });

    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientCost('');
  }, [newIngredientName, newIngredientCategory, newIngredientAmount, newIngredientCost]);

  const addStep = React.useCallback(() => {
    if (currentStep.trim()) {
      setSteps(prev => [...prev, currentStep.trim()]);
      setCurrentStep('');
    }
  }, [currentStep]);

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
    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientCost('');
    setNewIngredientCategory('肉禽类');
    setSteps([]);
    setCurrentStep('');
    setIsFavorite(false);
    setLikedBy([]);
    setManualCost('');
    setIngredientCostInputs({});
  }, []);

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
          >
            {/* 图片选择区域 - 多图滑动预览 */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900 tracking-tight">菜谱照片</Text>
                <Text className="text-gray-400 text-xs font-medium">{imageUris.length} 张已选</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {/* 添加按钮 */}
                <TouchableOpacity 
                  onPress={() => !isPickingImage && pickImage(false)}
                  disabled={isPickingImage}
                  className="w-40 h-52 bg-gray-50 rounded-3xl border border-dashed border-gray-200 justify-center items-center mr-4"
                >
                  {isPickingImage ? (
                    <ActivityIndicator color="#FF6B6B" />
                  ) : (
                    <>
                      <View className="bg-white p-3 rounded-full shadow-sm mb-2">
                        <Plus size={24} color="#FF6B6B" />
                      </View>
                      <Text className="text-gray-400 text-xs font-bold">从相册添加</Text>
                    </>
                  )}
                </TouchableOpacity>

                {imageUris.map((uri, index) => (
                  <View key={index} className="w-40 h-52 mr-4 rounded-3xl overflow-hidden bg-gray-100 shadow-soft">
                    <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity 
                      onPress={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/40 p-1.5 rounded-full"
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View className="absolute bottom-2 left-2 bg-[#FF6B6B] px-2 py-1 rounded-lg">
                        <Text className="text-[10px] text-white font-bold">封面</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* 拍照按钮 */}
                <TouchableOpacity 
                  onPress={() => !isPickingImage && pickImage(true)}
                  disabled={isPickingImage}
                  className="w-40 h-52 bg-gray-50 rounded-3xl border border-dashed border-gray-200 justify-center items-center mr-4"
                >
                   <Camera size={28} color="#9CA3AF" />
                   <Text className="text-gray-400 text-[10px] mt-2 font-bold">拍照添加</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 菜谱名称输入 */}
            <View className="mb-6 flex-row items-end">
              <View className="flex-1 min-w-0 mr-4">
                <Text className="text-gray-900 font-bold text-lg mb-2">菜谱名称</Text>
                <TextInput 
                  placeholder="给你的美味起个名字..."
                  className="bg-gray-100 px-5 py-4 rounded-2xl text-base"
                  value={name}
                  onChangeText={setName}
                  // @ts-ignore - web only
                  style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  springLayout();
                  setIsFavorite(!isFavorite);
                  triggerImpact();
                }}
                className={`w-14 h-14 rounded-2xl items-center justify-center shrink-0 ${isFavorite ? 'bg-red-50' : 'bg-gray-100'}`}
              >
                <Heart size={24} color={isFavorite ? '#FF6B6B' : '#9CA3AF'} fill={isFavorite ? '#FF6B6B' : 'transparent'} />
              </TouchableOpacity>
            </View>

            {/* 家庭成员喜欢标注 - iOS 风格药丸标签 */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900 tracking-tight">谁最喜欢这道菜？</Text>
                <Text className="text-gray-400 text-xs font-medium">{likedBy.length} 人喜欢</Text>
              </View>
              <View className="flex-row flex-wrap">
                {members.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => toggleLikedBy(member.id)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: likedBy.includes(member.id) ? member.color : '#F3F4F6',
                      borderColor: likedBy.includes(member.id) ? member.color : '#E5E7EB',
                    }}
                    className="mr-3 mb-3 px-5 py-2.5 rounded-full border"
                  >
                    <Text 
                      style={{ color: likedBy.includes(member.id) ? 'white' : '#4B5563' }}
                      className="text-sm font-bold"
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 主要原料选择 */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900 tracking-tight">选择主要原料</Text>
                <Text className="text-gray-400 text-xs font-medium">{selectedIngredients.length} 已选</Text>
              </View>
              
              <IngredientBrowser 
                allIngredients={availableIngredients}
                selectedIngredients={selectedIngredients.map(i => i.name)}
                onToggle={toggleIngredient}
                frequencies={ingredientFrequencies}
              />

              {/* 已选标签展示 - 优化为带用量的列表 */}
              {selectedIngredients.length > 0 && (
                <View className="mt-5 space-y-2">
                  {selectedIngredients.map((ing) => (
                    <View 
                      key={ing.id} 
                      className="flex-row items-center bg-gray-50 p-3 rounded-2xl border border-gray-100/50"
                    >
                      <View className="w-2 h-2 rounded-full bg-[#FF6B6B] mr-3 shrink-0" />
                      <Text className="flex-1 min-w-0 text-gray-800 font-bold text-sm" numberOfLines={1}>{ing.name}</Text>
                      
                      {/* 重量输入 */}
                      <View className="flex-row items-center bg-white px-2 py-1 rounded-xl border border-gray-100 mr-2 shrink-0">
                        <TextInput 
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="number-pad"
                          className="text-xs w-10 text-gray-600 font-bold text-right"
                          value={ing.amount?.toString() || ''}
                          onChangeText={(text) => {
                            const val = text.replace(/[^0-9]/g, '');
                            updateIngredient(ing.id, { amount: val ? parseInt(val, 10) : undefined });
                          }}
                          // @ts-ignore - web only
                          style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                        />
                        <Text className="text-[10px] text-gray-400 ml-1 font-bold">克</Text>
                      </View>

                      {/* 成本输入 */}
                      <View className="flex-row items-center bg-white px-2 py-1 rounded-xl border border-gray-100 mr-2 shrink-0">
                        <Text className="text-[10px] text-gray-400 mr-1 font-bold">￥</Text>
                        <TextInput 
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          className="text-xs w-10 text-gray-600 font-bold text-right"
                          value={ingredientCostInputs[ing.id] ?? (ing.cost && ing.cost > 0 ? ing.cost.toString() : '')}
                          onChangeText={(text) => {
                            const val = text.replace(/[^0-9.]/g, '');
                            updateIngredient(ing.id, { cost: parseFloat(val) || 0 }, val);
                          }}
                          // @ts-ignore - web only
                          style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                        />
                      </View>

                      <TouchableOpacity 
                        onPress={() => {
                          easeLayout();
                          toggleIngredient(ing);
                        }}
                        className="bg-gray-200/50 p-1.5 rounded-full"
                      >
                        <X size={14} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* 总成本汇总区域 - 响应用户需求的设计 */}
                  <View className="mt-4 bg-[#FF6B6B]/5 p-4 rounded-3xl border border-[#FF6B6B]/10">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-gray-900 font-bold text-sm">预估总成本</Text>
                        <Text className="text-gray-400 text-[10px] mt-0.5">
                          {manualCost !== '' ? '⚠️ 已手动修改' : '✨ 由下方标签自动汇总'}
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-white px-4 py-2 rounded-2xl border border-[#FF6B6B]/20 shrink-0">
                        <Text className="text-[#FF6B6B] font-bold text-lg mr-1">￥</Text>
                        <TextInput 
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          className="text-[#FF6B6B] font-bold text-xl min-w-[60px] text-right"
                          value={displayTotalCost}
                          onChangeText={(text) => {
                            setManualCost(text.replace(/[^0-9.]/g, ''));
                          }}
                          // @ts-ignore - web only
                          style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                        />
                        {manualCost !== '' && (
                          <TouchableOpacity 
                            onPress={() => {
                              easeLayout();
                              setManualCost('');
                            }}
                            className="ml-2 bg-[#FF6B6B]/10 p-1 rounded-full"
                          >
                            <Sparkles size={12} color="#FF6B6B" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 自定义原料输入 - 更加轻量美观且支持类别选择 */}
              <View className="mt-4 bg-gray-50 rounded-[28px] p-2 border border-gray-100">
                <View className="flex-row items-center">
                  <TextInput 
                    placeholder="输入标签(如:羊肉)"
                    className="flex-1 min-w-0 px-4 py-3 text-sm text-gray-800"
                    value={newIngredientName}
                    onChangeText={setNewIngredientName}
                    placeholderTextColor="#9CA3AF"
                    // @ts-ignore - web only
                    style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                  />
                  <View className="w-[1px] h-6 bg-gray-200 shrink-0" />
                  
                  {/* 重量 */}
                  <View className="flex-row items-center shrink-0">
                    <TextInput 
                      placeholder="0"
                      keyboardType="number-pad"
                      className="w-10 px-1 py-3 text-sm text-[#FF6B6B] font-bold text-right"
                      value={newIngredientAmount}
                      onChangeText={(text) => setNewIngredientAmount(text.replace(/[^0-9]/g, ''))}
                      placeholderTextColor="#9CA3AF"
                      // @ts-ignore - web only
                      style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                    />
                    <Text className="text-[10px] text-gray-400 mr-2 font-bold shrink-0">克</Text>
                  </View>
                  
                  <View className="w-[1px] h-6 bg-gray-200 shrink-0" />
                  
                  {/* 成本 */}
                  <View className="flex-row items-center shrink-0">
                    <Text className="text-[10px] text-gray-400 ml-2 font-bold shrink-0">￥</Text>
                    <TextInput 
                      placeholder="0"
                      keyboardType="decimal-pad"
                      className="w-10 px-1 py-3 text-sm text-[#FF6B6B] font-bold text-right"
                      value={newIngredientCost}
                      onChangeText={(text) => setNewIngredientCost(text.replace(/[^0-9.]/g, ''))}
                      placeholderTextColor="#9CA3AF"
                      // @ts-ignore - web only
                      style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                    />
                  </View>

                  <TouchableOpacity 
                    onPress={handleAddNewIngredient}
                    activeOpacity={0.8}
                    className="w-10 h-10 bg-[#FF6B6B] rounded-full items-center justify-center shadow-sm shadow-[#FF6B6B]/40 ml-2 shrink-0"
                  >
                    <Plus size={18} color="white" />
                  </TouchableOpacity>
                </View>
                
                {newIngredientName.trim().length > 0 && (
                  <View className="flex-row flex-wrap mt-2 px-2 pb-1">
                    <Text className="text-[10px] text-gray-400 font-bold mb-2 w-full ml-1">选择所属分类：</Text>
                    {CATEGORIES.map(cat => (
                      <IngredientTag
                        key={cat}
                        name={cat}
                        isSelected={newIngredientCategory === cat}
                        variant="outline"
                        onPress={() => {
                          easeLayout();
                          setNewIngredientCategory(cat);
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 烹饪步骤 (可选输入 & AI 预留) */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 font-bold text-lg">烹饪步骤</Text>
                <TouchableOpacity 
                  onPress={handleAISteps}
                  className="flex-row items-center bg-[#FF6B6B]/10 px-3 py-1.5 rounded-full"
                >
                  <Sparkles size={16} color="#FF6B6B" />
                  <Text className="text-[#FF6B6B] font-bold ml-1 text-xs">AI 生成</Text>
                </TouchableOpacity>
              </View>

              {steps.map((step, index) => (
                <View key={index} className="flex-row items-start mb-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <View className="w-6 h-6 rounded-full bg-[#FF6B6B]/20 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-[#FF6B6B] font-bold text-xs">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-gray-700">{step}</Text>
                  <TouchableOpacity onPress={() => removeStep(index)} className="ml-2">
                    <Trash2 size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}

              <View className="flex-row items-center mt-2">
                <TextInput 
                  placeholder="添加一步烹饪步骤..."
                  className="flex-1 min-w-0 bg-gray-100 px-5 py-3 rounded-2xl text-base"
                  value={currentStep}
                  onChangeText={setCurrentStep}
                  onSubmitEditing={addStep}
                  // @ts-ignore - web only
                  style={Platform.OS === 'web' ? { outline: 'none' } : {}}
                />
                <TouchableOpacity 
                  onPress={addStep}
                  className="ml-3 w-12 h-12 bg-[#FF6B6B]/10 rounded-2xl items-center justify-center shrink-0"
                >
                  <Plus size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 保存按钮 */}
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
