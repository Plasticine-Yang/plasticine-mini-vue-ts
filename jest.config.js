/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // 配置跨模块之间导入时的映射关系
  moduleNameMapper: {
    '^@plasticine-mini-vue-ts/(.*?)$': '<rootDir>/packages/$1/src'
  },
  rootDir: __dirname,
  testMatch: ['<rootDir>/packages/**/__test__/**/*.spec.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/']
}
