module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: [],
    env: {
      production: {
        plugins: ["transform-remove-console"],
      },
    },
  };
};
