export default {
  app: {
    name: 'Forge IDE (Electrobun Experiment)',
    identifier: 'com.yantra.forge.electrobun',
    version: '0.1.0',
  },
  build: {
    views: {
      main: {
        entry: '../../apps/renderer/dist/index.html',
      },
    },
    main: {
      entry: 'src/main/index.ts',
    },
  },
};
