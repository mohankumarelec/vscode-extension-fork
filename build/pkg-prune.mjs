import { Command, InvalidArgumentError } from "commander";
import * as fs from "fs";
import * as path from "path";
import extensionConfig from "../webpack.config.mjs";
const program = new Command();

const targetMapping = {
  "win32-x64": "node-napi.win32-x64-msvc.node",
  "win32-arm64": "node-napi.win32-arm64-msvc.node",
  "linux-x64": "node-napi.linux-x64-gnu.node",
  "linux-arm64": "node-napi.linux-arm64-gnu.node",
  "linux-armhf": "node-napi.linux-arm-gnueabihf.node",
  "alpine-x64": "node-napi.linux-x64-musl.node",
  "darwin-x64": "node-napi.darwin-x64.node",
  "darwin-arm64": "node-napi.darwin-arm64.node",
  "alpine-arm64": "node-napi.linux-arm64-musl.node",
};

program
  .requiredOption("--target <type>", "Specify the target platform", (value) => {
    const targetPlatforms = Object.keys(targetMapping);
    if (!targetPlatforms.includes(value)) {
      throw new InvalidArgumentError(
        `Invalid platform: ${value}. Must be one of ${targetPlatforms.join(", ")}`,
      );
    }
    return value;
  })
  .parse();

const args = program.opts();

const outDir = extensionConfig[0].output.path;
for (const file of fs.readdirSync(outDir)) {
  if (file === targetMapping[args.target]) {
    continue;
  } else if (file.startsWith("node-napi")) {
    console.log(`Deleting file: ${file}`);
    fs.unlinkSync(path.join(outDir, file));
  }
}
