import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * 触发轻量级的碰撞反馈（适合按钮点击、标签切换）
 */
export const triggerImpact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

/**
 * 触发成功通知反馈（适合保存、收藏成功）
 */
export const triggerSuccess = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * 触发选择变更反馈（适合滚动选择器）
 */
export const triggerSelection = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};

/**
 * 触发错误通知反馈（适合删除、失败）
 */
export const triggerError = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
