const path = require('path');
const programDir = path.join(__dirname, 'anchor', 'programs', 'valhalla');
const idlDir = path.join(__dirname, 'target', 'idl');
const sdkDir = path.join(__dirname, 'lib', 'src', 'program');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'valhalla',
  programId: '8eqnKMrBM7kk73d7U4UDVzn9SFX9o8nE1woX6x6nAkgP',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
