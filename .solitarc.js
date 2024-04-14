const path = require("path");
const programDir = path.join(__dirname, "anchor", "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "lib", "src", "lib", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "BBczhggWEH5Y5zZNJjgLDWhZhfaSjxm1TcLpYhB79RgY",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
