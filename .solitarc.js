const path = require("path");
const programDir = path.join(__dirname, "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "api", "src", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "D93S1f9iaTDXaLXXeyFVLcXX7wJiCBbk2Jqe1SmbWk2k",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
};
