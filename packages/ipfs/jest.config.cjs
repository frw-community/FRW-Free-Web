module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    '^@frw/common$': '<rootDir>/../common/src/index.ts',
    '^@frw/common/(.*)$': '<rootDir>/../common/src/$1.ts',
    '^@frw/crypto$': '<rootDir>/../crypto/src/index.ts',
    '^@frw/crypto/(.*)$': '<rootDir>/../crypto/src/$1.ts',
    '^@frw/name-registry$': '<rootDir>/../name-registry/src/index.ts',
    '^@frw/name-registry/(.*)$': '<rootDir>/../name-registry/src/$1.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ]
};
