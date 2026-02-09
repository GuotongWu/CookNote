import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSuccess, triggerImpact } from '../services/haptics';
import { easeLayout } from '../utils/animations';

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  '#FF6B6B', '#4DABF7', '#FCC419', '#51CF66', 
  '#BE4BDB', '#FF922B', '#22B8CF', '#845EF7'
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isVisible, onClose, onAdd }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), selectedColor);
    triggerSuccess();
    setName('');
    onClose();
  };

  return (
    <Modal 
      visible={isVisible} 
      animationType="fade" 
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center px-6">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
            <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-900">添加家庭成员</Text>
              <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View className="p-6">
              <Text className="text-gray-400 text-xs font-bold uppercase mb-3 ml-1">成员昵称</Text>
              <TextInput
                placeholder="例如：奶奶、弟弟..."
                className="bg-gray-100 px-5 py-4 rounded-2xl text-lg text-gray-800 mb-6"
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={10}
              />

              <Text className="text-gray-400 text-xs font-bold uppercase mb-4 ml-1">代表颜色</Text>
              <View className="flex-row flex-wrap justify-between mb-8">
                {PRESET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      setSelectedColor(color);
                      triggerImpact();
                    }}
                    style={{ backgroundColor: color }}
                    className="w-10 h-10 rounded-full mb-4 items-center justify-center border-4 border-white shadow-sm"
                  >
                    {selectedColor === color && (
                      <Check size={16} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={!name.trim()}
                className={`py-4 rounded-2xl items-center shadow-md ${!name.trim() ? 'bg-gray-200' : 'bg-gray-900'}`}
              >
                <Text className="text-white font-bold text-lg">确认添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
