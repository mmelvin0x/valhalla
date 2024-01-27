const path = require("path");
const programDir = path.join(__dirname, "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "app", "src", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "AX3N5z4zvC1E3bYwjh16QniLDuyRVEM3ZFKxfWsrSJ7p",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
