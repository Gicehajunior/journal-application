const { compilerOptions } = require("./jsconfig.json"); // If using jsconfig.json

module.exports = {
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/app/$1",
    "^@config/(.*)$": "<rootDir>/config/$1",
    "^@models/(.*)$": "<rootDir>/app/models/$1",
    "^@utils/(.*)$": "<rootDir>/app/utils/$1",
    "^@controllers/(.*)$": "<rootDir>/app/controllers/$1",
    "^@routes/(.*)$": "<rootDir>/routes/$1",
  },
  testEnvironment: "node",  // Ensures Jest runs in a Node.js environment
  rootDir: "./",  // Ensures Jest looks for files in the correct directory
};
