const path = require("path");
const programDir = path.join(__dirname, "anchor", "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "lib", "src", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "CaynZZxoLCM8zJjnrC1KGv3R4X2BCzaSynkVRSJgbLdC",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
