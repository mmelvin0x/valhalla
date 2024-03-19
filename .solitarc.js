const path = require("path");
const programDir = path.join(__dirname, "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "app", "src", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "44dSpmq2ATy23AiyouLCzsPgn12WeaTv8pi6ym5UHNGV",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
