/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/packages/**/__test__/**/*.spec.[jt]s?(x)'],
  rootDir: __dirname,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json']
}
