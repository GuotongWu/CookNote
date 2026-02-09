module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // 如果将来需要高性能动画，可以在此重新开启 reanimated 插件
      // "react-native-reanimated/plugin",
    ],
  };
};
