import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  LayoutAnimation
} from 'react-native';
import { Plus, Trash2, Sparkles } from 'lucide-react-native';

interface RecipeStepEditorProps {
  steps: string[];
  onAddStep: (step: string) => void;
  onRemoveStep: (index: number) => void;
  onAISteps: () => void;
}

export const RecipeStepEditor: React.FC<RecipeStepEditorProps> = ({
  steps,
  onAddStep,
  onRemoveStep,
  onAISteps
}) => {
  const [currentStep, setCurrentStep] = useState('');

  const handleAdd = () => {
    if (currentStep.trim()) {
      onAddStep(currentStep.trim());
      setCurrentStep('');
    }
  };

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900 tracking-tight">烹饪步骤</Text>
      </View>

      <View className="flex-row items-end mb-6">
        <TextInput
          placeholder="在该菜谱中添加具体的烹饪步骤..."
          multiline
          className="flex-1 bg-gray-50 px-4 py-4 rounded-2xl text-base border border-gray-100 min-h-[100px]"
          style={{ textAlignVertical: 'top' }}
          value={currentStep}
          onChangeText={setCurrentStep}
        />
        <TouchableOpacity 
          onPress={handleAdd}
          className="ml-3 bg-gray-900 w-12 h-12 rounded-2xl items-center justify-center shadow-sm"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {steps.map((step, index) => (
        <View key={index} className="flex-row mb-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Text className="text-gray-500 text-xs font-black">{index + 1}</Text>
          </View>
          <Text className="flex-1 text-gray-700 text-sm leading-5">{step}</Text>
          <TouchableOpacity onPress={() => onRemoveStep(index)} className="ml-2">
            <Trash2 size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
