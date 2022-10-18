// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensController } from "./codelens/CodeLensController";
import * as cache from "./commands/cache";
import { switchDefaultLanguage } from "./commands/language";
import * as plugin from "./commands/plugin";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as star from "./commands/star";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { explorerNodeManager } from "./explorer/explorerNodeManager";
import { LeetCodeNode } from "./explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "./explorer/LeetCodeTreeDataProvider";
import { leetCodeTreeItemDecorationProvider } from "./explorer/LeetCodeTreeItemDecorationProvider";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarController } from "./statusbar/leetCodeStatusBarController";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodePreviewProvider } from "./webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "./webview/leetCodeSolutionProvider";
import { leetCodeSubmissionProvider } from "./webview/leetCodeSubmissionProvider";
import { markdownEngine } from "./webview/markdownEngine";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        if (!await leetCodeExecutor.meetRequirements(context)) {
            throw new Error("The environment doesn't meet requirements.");
        }

        leetCodeManager.on("statusChanged", () => {
            leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
            leetCodeTreeDataProvider.refresh();
        });

        leetCodeTreeDataProvider.initialize(context);

        context.subscriptions.push(
            leetCodeStatusBarController,
            leetCodeChannel,
            leetCodePreviewProvider,
            leetCodeSubmissionProvider,
            leetCodeSolutionProvider,
            leetCodeExecutor,
            markdownEngine,
            codeLensController,
            explorerNodeManager,
            vscode.window.registerFileDecorationProvider(leetCodeTreeItemDecorationProvider),
            vscode.window.createTreeView("loveCodeExplorer", { treeDataProvider: leetCodeTreeDataProvider, showCollapseAll: true }),
            vscode.commands.registerCommand("lovecode.deleteCache", () => cache.deleteCache()),
            vscode.commands.registerCommand("lovecode.toggleLeetCodeCn", () => plugin.switchEndpoint()),
            vscode.commands.registerCommand("lovecode.signin", () => leetCodeManager.signIn()),
            vscode.commands.registerCommand("lovecode.signout", () => leetCodeManager.signOut()),
            vscode.commands.registerCommand("lovecode.manageSessions", () => session.manageSessions()),
            vscode.commands.registerCommand("lovecode.previewProblem", (node: LeetCodeNode) => {
                show.previewProblem(context, node);

                // clearInterval(ticker);
                // setElapsedTime(0, context);

                // const updateTimer = async () => {
                //     const seconds = getElapsedTime(context) + 1;
                //     await setElapsedTime(seconds, context);
                //     leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), `${leetCodeManager.getUser()} ${timeToDuration(seconds)}`);
                // };

                // ticker = setInterval(updateTimer, 1000);
            }),
            vscode.commands.registerCommand("lovecode.showProblem", (node: LeetCodeNode) => {
                show.showProblem(context, node);
            }),
            vscode.commands.registerCommand("lovecode.codeNow", (node: LeetCodeNode) => show.showProblem(context, node)),
            vscode.commands.registerCommand("lovecode.pickOne", () => show.pickOne(context)),
            vscode.commands.registerCommand("lovecode.searchProblem", () => show.searchProblem(context)),
            vscode.commands.registerCommand("lovecode.showSolution", (input: LeetCodeNode | vscode.Uri) => show.showSolution(input)),
            vscode.commands.registerCommand("lovecode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
            vscode.commands.registerCommand("lovecode.testSolution", (uri?: vscode.Uri) => test.testSolution(uri)),
            vscode.commands.registerCommand("lovecode.testSolutionWithTestcase", (uri?: vscode.Uri, testString?: string) => test.testSolutionWithTestcase(uri, testString)),
            vscode.commands.registerCommand("lovecode.testSolutionWithFilecase", (uri?: vscode.Uri) => test.testSolutionWithFilecase(uri)),
            vscode.commands.registerCommand("lovecode.debugSolution", (uri?: vscode.Uri) => test.debugSolution(uri)),
            vscode.commands.registerCommand("lovecode.debugSolutionWithTestcase", (uri?: vscode.Uri, testString?: string) => test.debugSolutionWithTestcase(uri, testString)),
            vscode.commands.registerCommand("lovecode.submitSolution", (uri?: vscode.Uri) => submit.submitSolution(uri)),
            vscode.commands.registerCommand("lovecode.switchDefaultLanguage", () => switchDefaultLanguage()),
            vscode.commands.registerCommand("lovecode.addFavorite", (node: LeetCodeNode) => star.addFavorite(node)),
            vscode.commands.registerCommand("lovecode.removeFavorite", (node: LeetCodeNode) => star.removeFavorite(node)),
            vscode.commands.registerCommand("lovecode.problems.sort", () => plugin.switchSortingStrategy()),
        );

        await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
        await leetCodeManager.getLoginStatus();
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        promptForOpenOutputChannel("Extension initialization failed. Please open output channel for details.", DialogType.error);
    }
}

// function timeToDuration(seconds: number): string {
//     var hh = Math.floor(seconds / 3600),
//         mm = Math.floor(seconds / 60) % 60,
//         ss = Math.floor(seconds) % 60;
//     return (hh ? (hh < 10 ? "0" : "") + hh + ":" : "") + ((mm < 10) && hh ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss
// }

// async function setElapsedTime(seconds: number, context: vscode.ExtensionContext): Promise<void> {
//     await context.globalState.update(TIME_STORAGE_KEY, Math.max(0, seconds));
// }
// function getElapsedTime(context: vscode.ExtensionContext): number {
//     return parseInt(context.globalState.get(TIME_STORAGE_KEY, '0'));
// }

export function deactivate(): void {
    // Do nothing.
}
