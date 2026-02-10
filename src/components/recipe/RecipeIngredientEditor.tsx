import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Plus, Check, X, BadgePlus, Search } from 'lucide-react-native';
import { Ingredient, IngredientCategory } from '../../types/recipe';
import { IngredientBrowser } from '../IngredientBrowser';
import { IngredientTag } from '../IngredientTag';
import { triggerImpact, triggerSuccess } from '../../services/haptics';

const CATEGORIES: IngredientCategory[] = ['肉禽类', '蔬菜类', '调料类', '海鲜类', '主食类', '其他'];

interface RecipeIngredientEditorProps {
  selectedIngredients: Ingredient[];
  onToggleIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (id: string, updates: Partial<Ingredient>, rawCost?: string) => void;
  onAddCustomIngredient: (name: string, category: IngredientCategory) => void;
  availableIngredients: Ingredient[];
  ingredientFrequencies?: Record<string, number>;
}

export const RecipeIngredientEditor: React.FC<RecipeIngredientEditorProps> = ({
  selectedIngredients,
  onToggleIngredient,
  onUpdateIngredient,
  onAddCustomIngredient,
  availableIngredients,
  ingredientFrequencies
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 新建标签相关状态
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<IngredientCategory>('肉禽类');

  // 配置重量成本相关状态
  const [configuringIng, setConfiguringIng] = useState<Ingredient | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  const [tempCost, setTempCost] = useState('');

  // 处理标签点击
  const handleIngredientPress = (ing: Ingredient) => {
    const isSelected = selectedIngredients.some(s => s.id === ing.id);
    if (isSelected) {
      // 如果已选择，点击则取消选择
      onToggleIngredient(ing);
      triggerImpact();
    } else {
      // 如果未选择，弹出配置窗口
      setTempAmount('');
      setTempCost('');
      setConfiguringIng(ing);
      triggerImpact();
    }
  };

  const handleConfirmConfig = () => {
    if (configuringIng) {
      const amount = parseFloat(tempAmount) || 0;
      const cost = parseFloat(tempCost) || 0;
      
      // 添加到已选（这里需要确保 onToggleIngredient 能接受带参数的，或者我们手动构造）
      // 实际上 onToggleIngredient 通常只是切换状态，但这里我们需要带上初始值
      // 检查原有的 onToggleIngredient 实现
      onToggleIngredient({
        ...configuringIng,
        amount,
        cost
      });
      
      setConfiguringIng(null);
      triggerSuccess();
    }
  };

  const handleFinishCreate = () => {
    if (!newName.trim()) return;
    onAddCustomIngredient(newName.trim(), newCategory);
    setIsCreatingNew(false);
    setNewName('');
    setSearchQuery('');
    triggerSuccess();
  };

  return (
    <View className="mb-8">
      {/* 1. 已选标签置顶 */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">已选配料</Text>
        <View className="flex-row flex-wrap min-h-[40px]">
          {selectedIngredients.length > 0 ? (
            selectedIngredients.map((ing) => (
              <IngredientTag
                key={ing.id}
                name={ing.name}
                amount={ing.amount}
                cost={ing.cost}
                isSelected={true}
                onPress={() => onToggleIngredient(ing)}
                className="mr-2 mb-2"
              />
            ))
          ) : (
            <Text className="text-gray-300 text-sm italic ml-1">点击下方标签库添加...</Text>
          )}
        </View>
      </View>

      {/* 2. 搜索框与现有的标签库放在一起 */}
      <View className="bg-gray-50/50 rounded-[32px] p-5 border border-gray-100">
        <View className="flex-row items-center bg-white px-4 py-3 rounded-2xl border border-gray-100 mb-6 shadow-sm shadow-gray-200/50">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="搜索已有标签"
            className="flex-1 ml-2 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          className="bg-white/60 rounded-2xl border border-gray-100"
          style={{ height: 280 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <IngredientBrowser
            allIngredients={availableIngredients}
            selectedIngredients={selectedIngredients}
            frequencies={ingredientFrequencies}
            onToggle={handleIngredientPress}
            searchQuery={searchQuery}
            hideSearch={true}
          />
        </ScrollView>

        {/* 3. 没有找到，点击新建按钮 */}
        <TouchableOpacity 
          onPress={() => {
            setNewName(searchQuery);
            setIsCreatingNew(true);
            triggerImpact();
          }}
          className="mt-3 flex-row items-center justify-center py-4 bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <BadgePlus size={18} color="#FF6B6B" />
          <Text className="ml-2 text-[#FF6B6B] font-bold">没有找到？点击新建标签</Text>
        </TouchableOpacity>
      </View>

      {/* 弹窗：输入重量和成本 */}
      <Modal visible={!!configuringIng} animationType="fade" transparent onRequestClose={() => setConfiguringIng(null)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1 bg-black/50 justify-center px-6"
        >
          <View className="bg-white rounded-[32px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-gray-400 text-xs font-bold mb-1">正在添加</Text>
                <Text className="text-2xl font-black text-gray-900">{configuringIng?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setConfiguringIng(null)} className="p-2 bg-gray-50 rounded-full">
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-4 mb-8">
              <View className="flex-1">
                <Text className="text-[10px] text-gray-400 font-bold mb-2 ml-1">重量 (克)</Text>
                <TextInput 
                  placeholder="0" 
                  keyboardType="numeric" 
                  autoFocus
                  className="bg-gray-50 px-5 py-4 rounded-2xl text-xl font-bold border border-gray-100" 
                  value={tempAmount} 
                  onChangeText={setTempAmount}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-gray-400 font-bold mb-2 ml-1">估算成本 (￥)</Text>
                <TextInput 
                  placeholder="0.00" 
                  keyboardType="numeric" 
                  className="bg-gray-50 px-5 py-4 rounded-2xl text-xl font-bold border border-gray-100" 
                  value={tempCost} 
                  onChangeText={setTempCost}
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleConfirmConfig}
              className="bg-[#FF6B6B] py-5 rounded-3xl items-center shadow-lg shadow-[#FF6B6B]/30"
            >
              <Text className="text-white font-bold text-lg">确认并选择</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 弹窗：新建标签大类和名称 */}
      <Modal 
        visible={isCreatingNew} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={() => setIsCreatingNew(false)}
      >
        <View className="flex-1 bg-white px-6 pt-8">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-black text-gray-900">新建自定义标签</Text>
            <TouchableOpacity onPress={() => setIsCreatingNew(false)} className="p-2 bg-gray-100 rounded-full">
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-400 mb-3 ml-1">标签名称</Text>
            <TextInput 
              placeholder="例如：海鲜酱、野生松茸..." 
              className="bg-gray-50 px-6 py-5 rounded-3xl text-lg font-bold border border-gray-100" 
              value={newName} 
              onChangeText={setNewName}
              autoFocus
            />
          </View>

          <Text className="text-sm font-bold text-gray-400 mb-4 ml-1">选择分类</Text>
          <View className="flex-row flex-wrap mb-12">
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setNewCategory(cat)}
                className={`mr-3 mb-3 px-6 py-3 rounded-2xl border ${newCategory === cat ? 'bg-black border-black' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-bold ${newCategory === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            onPress={handleFinishCreate}
            disabled={!newName.trim()}
            className={`py-5 rounded-3xl items-center shadow-xl ${!newName.trim() ? 'bg-gray-200' : 'bg-[#FF6B6B]'}`}
          >
            <Text className="text-white font-bold text-lg">创建并加入标签库</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

