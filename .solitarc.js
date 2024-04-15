const path = require("path");
const programDir = path.join(__dirname, "anchor", "programs", "vesting");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "lib", "src", "lib", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "vesting",
  programId: "Ct63b5aLvhYT2bSvK3UG3oTJF8PgAC3MzDwpqXRKezF6",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};

// module.exports = {
//   idlGenerator: "anchor",
//   programName: "token_creation",
//   programId: "Ct63b5aLvhYT2bSvK3UG3oTJF8PgAC3MzDwpqXRKezF6",
//   idlDir,
//   sdkDir,
//   binaryInstallDir,
//   programDir,
//   removeExistingIdl: false,
//   anchorRemainingAccounts: false,
// };
