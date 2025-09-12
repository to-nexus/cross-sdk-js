# Cross Connect

Cross protocol for connecting Wallets to Dapps

## 📦 NPM Registry Information

### Development/Testing Versions (alpha, beta)
- **Registry**: https://package.cross-nexus.com/repository/dev-cross-sdk-js/
- **Usage**: For `-alpha` and `-beta` prerelease versions

### Production/Stable Versions
- **Registry**: https://package.cross-nexus.com/repository/cross-sdk-js/
- **Usage**: For stable release versions

## Setup

1. Ensure [nodejs and npm](https://nodejs.org/en/)
2. Clone the repository
3. Install all package dependencies, by running `npm install` from the root folder

## Running checks for all packages

To ensure all packages lint, build and test correctly, we can run the following command from the root folder:

## Command Overview

- `clean` - Removes build folders from all packages
- `lint` - Runs [eslint](https://eslint.org/) checks
- `prettier` - Runs [prettier](https://prettier.io/) checks
- `build` - Builds all packages
- `test` - Tests all packages
- `check` - Shorthand to run lint, build and test commands
- `reset` - Shorthand to run clean and check commands

## Troubleshooting

1. If you are experiencing issues with installation ensure you install `npm i -g node-gyp`
2. You will need to have xcode command line tools installed
3. If there are issues with xcode command line tools try running

```zsh
sudo xcode-select --switch /Library/Developer/CommandLineTools
sudo xcode-select --reset
```

## License

Apache 2.0
