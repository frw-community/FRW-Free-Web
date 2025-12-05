module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/packages/*/dist'],
  moduleNameMapper: {
    '^@frw/common$': '<rootDir>/packages/common/src/index.ts',
    '^@frw/common/(.*)$': '<rootDir>/packages/common/src/$1',
    '^@frw/crypto$': '<rootDir>/packages/crypto/src/index.ts',
    '^@frw/crypto/(.*)$': '<rootDir>/packages/crypto/src/$1',
    '^@frw/ipfs$': '<rootDir>/packages/ipfs/src/index.ts',
    '^@frw/ipfs/(.*)$': '<rootDir>/packages/ipfs/src/$1',
    '^@frw/protocol$': '<rootDir>/packages/protocol/src/index.ts',
    '^@frw/protocol/(.*)$': '<rootDir>/packages/protocol/src/$1',
    '^@frw/protocol-v2$': '<rootDir>/packages/protocol-v2/src/index.ts',
    '^@frw/protocol-v2/(.*)$': '<rootDir>/packages/protocol-v2/src/$1',
    '^@frw/pow-v2$': '<rootDir>/packages/pow-v2/src/index.ts',
    '^@frw/pow-v2/(.*)$': '<rootDir>/packages/pow-v2/src/$1',
    '^@frw/crypto-pq$': '<rootDir>/packages/crypto-pq/src/index.ts',
    '^@frw/crypto-pq/(.*)$': '<rootDir>/packages/crypto-pq/src/$1',
    '^@frw/sandbox$': '<rootDir>/packages/sandbox/src/index.ts',
    '^@frw/sandbox/(.*)$': '<rootDir>/packages/sandbox/src/$1',
    '^@frw/storage$': '<rootDir>/packages/storage/src/index.ts',
    '^@frw/storage/(.*)$': '<rootDir>/packages/storage/src/$1',
    '^@frw/name-registry$': '<rootDir>/packages/name-registry/src/index.ts',
    '^@frw/name-registry/(.*)$': '<rootDir>/packages/name-registry/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true
      }
    }]
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/index.ts',
    '!packages/*/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
