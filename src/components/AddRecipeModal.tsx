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
import { Recipe, Ingredient, AISkillProvider, IngredientCategory } from '../types/recipe';
import { MOCK_INGREDIENTS } from '../services/mockData';
import { IngredientBrowser } from './IngredientBrowser';

const CATEGORIES: IngredientCategory[] = ['肉禽类', '蔬菜类', '调料类', '海鲜类', '主食类', '其他'];

interface AddRecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe | null; // 新增：用于编辑模式
  availableIngredients?: Ingredient[]; // 允许外部传入动态标签列表
  aiProvider?: AISkillProvider; // 预留 AI 能力接口
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ 
  isVisible, 
  onClose, 
  onSave, 
  initialRecipe,
  availableIngredients = MOCK_INGREDIENTS, 
  aiProvider 
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState<IngredientCategory>('肉禽类');
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // 监听 initialRecipe 的变化，填充表单（编辑模式）
  React.useEffect(() => {
    if (isVisible) {
      if (initialRecipe) {
        setName(initialRecipe.name);
        setImageUris(initialRecipe.imageUris || []);
        setSelectedIngredients(initialRecipe.ingredients);
        setSteps(initialRecipe.steps || []);
        setIsFavorite(!!initialRecipe.isFavorite);
      } else {
        // 如果没有 initialRecipe，确保是干净的表单（新增模式）
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
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        return prev.filter(i => i.id !== ing.id);
      }
      return [...prev, ing];
    });
  }, []);

  const handleAddNewIngredient = React.useCallback(() => {
    const trimmedName = newIngredientName.trim();
    if (!trimmedName) return;
    
    // 统一检查逻辑
    const existsInMock = MOCK_INGREDIENTS.find(i => i.name === trimmedName);
    
    setSelectedIngredients(prev => {
      if (prev.some(i => i.name === trimmedName)) return prev;
      
      const newIng: Ingredient = existsInMock || {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        category: newIngredientCategory
      };
      
      return [...prev, newIng];
    });

    setNewIngredientName('');
  }, [newIngredientName, newIngredientCategory]);

  const addStep = React.useCallback(() => {
    if (currentStep.trim()) {
      setSteps(prev => [...prev, currentStep.trim()]);
      setCurrentStep('');
    }
  }, [currentStep]);

  const removeStep = React.useCallback((index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
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
    };
    onSave(newRecipe);
    onClose();
    // 延迟重置，避免弹窗关闭动画中内容消失
    setTimeout(resetForm, 400);
  }, [name, imageUris, selectedIngredients, steps, onSave, onClose, initialRecipe]);

  const resetForm = React.useCallback(() => {
    setName('');
    setImageUris([]);
    setSelectedIngredients([]);
    setNewIngredientName('');
    setNewIngredientCategory('肉禽类');
    setSteps([]);
    setCurrentStep('');
    setIsFavorite(false);
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
                  <View key={index} className="w-40 h-52 mr-4 rounded-3xl overflow-hidden bg-gray-100 shadow-sm">
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
              <View className="flex-1 mr-4">
                <Text className="text-gray-900 font-bold text-lg mb-2">菜谱名称</Text>
                <TextInput 
                  placeholder="给你的美味起个名字..."
                  className="bg-gray-100 px-5 py-4 rounded-2xl text-base"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <TouchableOpacity 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                  setIsFavorite(!isFavorite);
                }}
                className={`w-14 h-14 rounded-2xl items-center justify-center ${isFavorite ? 'bg-red-50' : 'bg-gray-100'}`}
              >
                <Heart size={24} color={isFavorite ? '#FF6B6B' : '#9CA3AF'} fill={isFavorite ? '#FF6B6B' : 'transparent'} />
              </TouchableOpacity>
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
              />

              {/* 已选标签展示 - 优化为更加 iOS 磁贴感 */}
              {selectedIngredients.length > 0 && (
                <View className="flex-row flex-wrap mt-5">
                  {selectedIngredients.map((ing) => (
                    <TouchableOpacity 
                      key={ing.id}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        toggleIngredient(ing);
                      }}
                      activeOpacity={0.7}
                      className="mr-2.5 mb-2.5 px-3.5 py-2 rounded-2xl bg-gray-900 flex-row items-center"
                    >
                      <Text className="text-white text-xs font-bold tracking-wide">{ing.name}</Text>
                      <View className="ml-2 bg-white/20 rounded-full p-0.5">
                        <X size={10} color="white" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 自定义原料输入 - 更加轻量美观且支持类别选择 */}
              <View className="mt-4 bg-gray-50 rounded-[28px] p-2 border border-gray-100">
                <View className="flex-row items-center">
                  <TextInput 
                    placeholder="输入自定义标签（如：羊肉）"
                    className="flex-1 px-4 py-3 text-sm text-gray-800"
                    value={newIngredientName}
                    onChangeText={setNewIngredientName}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    onPress={handleAddNewIngredient}
                    activeOpacity={0.8}
                    className="w-10 h-10 bg-[#FF6B6B] rounded-[20px] items-center justify-center shadow-sm shadow-[#FF6B6B]/40"
                  >
                    <Plus size={18} color="white" />
                  </TouchableOpacity>
                </View>
                
                {newIngredientName.trim().length > 0 && (
                  <View className="flex-row flex-wrap mt-2 px-2 pb-1">
                    <Text className="text-[10px] text-gray-400 font-bold mb-2 w-full ml-1">选择所属分类：</Text>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setNewIngredientCategory(cat);
                        }}
                        className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${
                          newIngredientCategory === cat 
                          ? 'bg-gray-900 border-gray-900' 
                          : 'bg-white border-gray-100'
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${
                          newIngredientCategory === cat ? 'text-white' : 'text-gray-500'
                        }`}>{cat}</Text>
                      </TouchableOpacity>
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
                  className="flex-1 bg-gray-100 px-5 py-3 rounded-2xl text-base"
                  value={currentStep}
                  onChangeText={setCurrentStep}
                  onSubmitEditing={addStep}
                />
                <TouchableOpacity 
                  onPress={addStep}
                  className="ml-3 w-12 h-12 bg-[#FF6B6B]/10 rounded-2xl items-center justify-center"
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
