import { Tokenizer } from "@flexpilot-ai/tokenizers";
import assert from "assert";
import axios from "axios";
import { createHash } from "crypto";
import * as path from "path";
import * as vscode from "vscode";
import { logger } from "./logger";
import { storage } from "./storage";
import { getCompletionModelMetadata } from "./utilities";

export class Tokenizers {
  /**
   * Get the tokenizer metadata for the given model.
   * @param {string} model - The name of the model.
   */
  private static async metadata(model: string) {
    // Get the file system scheme from storage
    const scheme = storage().get("fs.scheme");
    if (!scheme) {
      throw new Error("No scheme found in storage");
    }

    // Get the configuration for the model
    const metadata = getCompletionModelMetadata(model);

    // Check if the model configuration exists
    if (!metadata) {
      throw new Error("No tokenizer URL found for model");
    }

    // Prepare the tokenizer file path
    const basePath = storage().context.globalStorageUri.fsPath;
    const fileId = createHash("sha512")
      .update(metadata.tokenizerUrl)
      .digest("hex");
    const tokenizerUri = vscode.Uri.from({
      scheme: scheme,
      path: path.join(basePath, "tokenizers", fileId),
    });

    // Check if the tokenizer folder exists in storage
    const tokenizerFolder = vscode.Uri.from({
      scheme: scheme,
      path: path.join(basePath, "tokenizers"),
    });
    try {
      await vscode.workspace.fs.stat(tokenizerFolder);
    } catch (error) {
      logger.warn(`Folder not found at: ${tokenizerFolder}`);
      logger.error(error as Error);
      vscode.workspace.fs.createDirectory(tokenizerFolder);
    }

    // Return the metadata and the path to the tokenizer file
    return { metadata, tokenizerUri };
  }

  /**
   * Get the tokenizer for the given model.
   * @param {string} model - The name of the model.
   */
  public static async get(model: string): Promise<Tokenizer> {
    const { tokenizerUri } = await this.metadata(model);
    const data = await vscode.workspace.fs.readFile(tokenizerUri);
    return new Tokenizer(Array.from(data));
  }

  /**
   * Download the tokenizer for the given model.
   * @param {string} model - The name of the model.
   * @returns {Promise<Tokenizer>} The tokenizer object.
   */
  public static async download(model: string): Promise<Tokenizer> {
    const { metadata, tokenizerUri } = await this.metadata(model);
    const response = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Flexpilot",
        cancellable: false,
      },
      async (progress) => {
        progress.report({
          message: "Downloading tokenizer.json",
        });
        return await axios.get(metadata.tokenizerUrl, {
          responseType: "arraybuffer",
        });
      },
    );
    const byteArray = Array.from(new Uint8Array(response.data));
    const tokenizer = new Tokenizer(byteArray);
    assert(tokenizer.encode("test string", false).length > 0);
    await vscode.workspace.fs.writeFile(
      tokenizerUri,
      new Uint8Array(response.data),
    );
    return tokenizer;
  }
}
