const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    // 明确指定要忽略的文件，不使用 .gitignore
    ignore: [
      /^\/src($|\/)/,
      /^\/\.git($|\/)/,
      /^\/\.gitignore$/,
      /^\/tsconfig\.json$/,
      /^\/electron\.vite\.config\.ts$/,
      /^\/vite\.mobile\.config\.ts$/,
      /^\/capacitor\.config\.ts$/,
      /^\/\.planning($|\/)/,
      /^\/docs($|\/)/,
      /^\/scripts($|\/)/,
      /^\/\.claude($|\/)/,
      /^\/forge\.config\.js$/,
      /^\/index\.html$/,
      /^\/main\.js$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
