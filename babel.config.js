module.exports = {
    presets: [],
    plugins: ["jsx-control-statements"],
    env: {
        development: {
            presets: ["module:metro-react-native-babel-preset"]
        },
        production: {
            presets: ["module:metro-react-native-babel-preset"]
        },
        test: {
            presets: ["react-native"]
        }
    }
};
