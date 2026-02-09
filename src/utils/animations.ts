import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * 触发一个 iOS 风格的弹簧布局动画
 */
export const springLayout = () => {
  LayoutAnimation.configureNext({
    duration: 500,
    create: {
      type: 'spring',
      springDamping: 0.8,
      property: 'opacity',
    },
    update: {
      type: 'spring',
      springDamping: 0.8,
    },
    delete: {
      type: 'spring',
      springDamping: 0.8,
      property: 'opacity',
    },
  });
};

/**
 * 触发标准的淡入淡出动画
 */
export const easeLayout = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};
