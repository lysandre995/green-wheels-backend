const { plugin } = require("typescript-eslint");

module.exports = {
    presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
    plugin: ["babel-plugin-transform-typescript-metadata"]
};
