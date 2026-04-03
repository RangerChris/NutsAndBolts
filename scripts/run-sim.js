// Lightweight runner that registers ts-node with transpileOnly to avoid project tsconfig issues
require('ts-node').register({
    transpileOnly: true,
    skipProject: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
require('./simulate.ts');
