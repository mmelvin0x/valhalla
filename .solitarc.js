const path = require("path");
const programDir = path.join(__dirname, "anchor", "programs", "valhalla");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "lib", "src", "lib", "program");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "valhalla",
  programId: "5AAFQF16iab69Zy2m2u9bSNBQRGWaByA7ZXAxaXeTTN4",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
  removeExistingIdl: false,
  anchorRemainingAccounts: false,
};
