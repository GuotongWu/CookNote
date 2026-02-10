import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Camera, Image as ImageIcon, X, Star } from 'lucide-react-native';
import { easeLayout } from '../../utils/animations';

interface RecipeImagePickerProps {
  imageUris: string[];
  isPickingImage: boolean;
  onPickImage: (useCamera: boolean) => void;
  onRemoveImage: (index: number) => void;
  onSetAsCover: (index: number) => void;
}

export const RecipeImagePicker: React.FC<RecipeImagePickerProps> = ({
  imageUris,
  isPickingImage,
  onPickImage,
  onRemoveImage,
  onSetAsCover
}) => {
  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900 tracking-tight">添加美食照片</Text>
        <Text className="text-gray-400 text-xs font-medium">{imageUris.length} 张图片</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {/* 图片占位符 / 添加按钮 */}
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => onPickImage(true)}
            disabled={isPickingImage}
            className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mr-3"
          >
            <Camera size={24} color="#9CA3AF" />
            <Text className="text-[10px] text-gray-400 mt-2 font-medium">拍照</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onPickImage(false)}
            disabled={isPickingImage}
            className="w-28 h-28 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mr-3"
          >
            {isPickingImage ? (
              <ActivityIndicator color="#FF6B6B" />
            ) : (
              <>
                <ImageIcon size={24} color="#9CA3AF" />
                <Text className="text-[10px] text-gray-400 mt-2 font-medium">相册</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 已选图片列表 */}
        {imageUris.map((uri, index) => (
          <View key={`${uri}-${index}`} className="relative mr-3">
            <Image 
              source={{ uri }} 
              className="w-28 h-28 rounded-2xl" 
            />
            {index === 0 && (
              <View className="absolute top-2 left-2 bg-[#FF6B6B] px-2 py-0.5 rounded-full">
                <Text className="text-[8px] text-white font-bold italic">COVER</Text>
              </View>
            )}
            
            <TouchableOpacity 
              onPress={() => onRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-100"
            >
              <X size={12} color="#4B5563" />
            </TouchableOpacity>

            {index !== 0 && (
              <TouchableOpacity 
                onPress={() => onSetAsCover(index)}
                className="absolute bottom-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm"
              >
                <Star size={12} color="#FCC419" fill="#FCC419" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
