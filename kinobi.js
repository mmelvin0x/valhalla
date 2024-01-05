const {
  createFromIdls,
  RenderJavaScriptVisitor,
} = require("@metaplex-foundation/kinobi");
const path = require("path");

// Instantiate Kinobi.
const kinobi = createFromIdls([
  path.join(__dirname, "target", "idl", "valhalla.json"),
]);

// Update the Kinobi tree using visitors...

// Render JavaScript.
const jsDir = path.join(__dirname, "server", "src", "program");
kinobi.accept(new RenderJavaScriptVisitor(jsDir));
