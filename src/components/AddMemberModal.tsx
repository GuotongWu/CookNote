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
import { X, Check, Trash2, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerSuccess, triggerImpact } from '../services/haptics';
import { easeLayout } from '../utils/animations';
import { FamilyMember } from '../types/recipe';

interface AddMemberModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
  members: FamilyMember[];
  onDelete: (id: string) => void;
}

const PRESET_COLORS = [
  '#FF6B6B', '#4DABF7', '#FCC419', '#51CF66', 
  '#BE4BDB', '#FF922B', '#22B8CF', '#845EF7'
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isVisible, 
  onClose, 
  onAdd, 
  members,
  onDelete 
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), selectedColor);
    triggerSuccess();
    setName('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    easeLayout();
    onDelete(id);
    triggerImpact();
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
              <Text className="text-xl font-bold text-gray-900">家庭成员管理</Text>
              <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                <X size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              className="max-h-[400px]" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* 现有成员列表 */}
              {!isAdding && (
                <View className="mb-2">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">当前成员</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        easeLayout();
                        setIsAdding(true);
                      }}
                      className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus size={14} color="#374151" />
                      <Text className="text-gray-700 text-xs font-bold ml-1">新增成员</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {members.map(member => (
                    <View 
                      key={member.id} 
                      className="flex-row items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-2xl mb-3"
                    >
                      <View className="flex-row items-center">
                        <View 
                          style={{ backgroundColor: member.color }}
                          className="w-10 h-10 rounded-full items-center justify-center mr-3 shadow-sm"
                        >
                          <Text className="text-white font-bold">{member.name.charAt(0)}</Text>
                        </View>
                        <Text className="text-gray-800 font-bold text-lg">{member.name}</Text>
                      </View>
                      
                      {/* 只有非默认成员可以删除（可选，这里允许全部删除但保留界面简洁） */}
                      <TouchableOpacity 
                        onPress={() => handleDelete(member.id)}
                        className="bg-red-50 p-2.5 rounded-xl"
                      >
                        <Trash2 size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {members.length === 0 && (
                    <View className="items-center py-8">
                      <Text className="text-gray-400 text-sm">暂无成员，点击上方添加</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 添加表单 */}
              {isAdding && (
                <View>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">新增成员</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        easeLayout();
                        setIsAdding(false);
                      }}
                      className="px-3 py-1.5"
                    >
                      <Text className="text-gray-500 text-xs font-bold">返回列表</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">昵称</Text>
                  <TextInput
                    placeholder="例如：奶奶、弟弟..."
                    className="bg-gray-100 px-5 py-4 rounded-2xl text-lg text-gray-800 mb-6"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    maxLength={10}
                  />

                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-3 ml-1">代表颜色</Text>
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
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
