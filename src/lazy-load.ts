import { CommitMessageCommand } from "./commands/commit-message";
import { ConfigureModelCommand } from "./commands/configure-model";
import { GithubSignInCommand } from "./commands/github-sign-in";
import { StatusIconMenuCommand } from "./commands/status-icon-menu";
import { logger } from "./logger";
import { ProxyModelProvider } from "./models";
import { SessionManager } from "./session";
import { updateRuntimeArguments } from "./startup";
import { statusIcon } from "./status-icon";
import { setContext } from "./utilities";
import { VariablesManager } from "./variables";

/**
 * Activates the extension.
 */
export const activate = async () => {
  // set initial values to context variables
  setContext("isLoaded", false);
  setContext("isError", false);
  setContext("isLoggedIn", false);
  try {
    // Update the runtime arguments
    await updateRuntimeArguments();

    // Register the variables manager
    VariablesManager.register();

    // Register the proxy model
    ProxyModelProvider.register();

    // Register the commands
    StatusIconMenuCommand.register();
    CommitMessageCommand.register();
    GithubSignInCommand.register();
    ConfigureModelCommand.register();

    // Handle the session change
    SessionManager.register();

    // Update the status bar icon
    statusIcon.updateStatusBarIcon();

    // Set the loaded context
    setContext("isLoaded", true);
  } catch (error) {
    // Set the error context
    setContext("isError", true);

    // Log the error to the output channel
    logger.error(error as Error);
  }
};
