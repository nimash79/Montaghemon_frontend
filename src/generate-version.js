import fs from "fs";
import path from "path";

const version = Date.now().toString();
const outPath = path.resolve("dist/version.json");

fs.writeFileSync(outPath, JSON.stringify({ version }, null, 2));
console.log("✅ version.json created:", version);