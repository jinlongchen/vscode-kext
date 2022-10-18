// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as fse from "fs-extra";
import * as vscode from "vscode";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, UserStatus } from "../shared";
// import { IQuickItemEx, UserStatus } from "../shared";
import { isWindows, usingCmd } from "../utils/osUtils";
import { DialogType, promptForOpenOutputChannel, showFileSelectDialog } from "../utils/uiUtils";
// import { DialogType, promptForOpenOutputChannel } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";
import { getNodeIdFromFile } from "../utils/problemUtils";
import { explorerNodeManager } from "../explorer/explorerNodeManager";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import * as settingUtils from "../utils/settingUtils";

export async function testSolution(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }

        let result: string | undefined;
        result = await leetCodeExecutor.testSolution(filePath);
        // switch (choice.value) {
        //     case ":default":
        //         result = await leetCodeExecutor.testSolution(filePath);
        //         break;
        //     case ":direct":
        //         const testString: string | undefined = await vscode.window.showInputBox({
        //             prompt: "Enter the test cases.",
        //             validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "Test case must not be empty.",
        //             placeHolder: "Example: [1,2,3]\\n4",
        //             ignoreFocusOut: true,
        //         });
        //         if (testString) {
        //             result = await leetCodeExecutor.testSolution(filePath, parseTestString(testString));
        //         }
        //         break;
        //     case ":file":
        //         const testFile: vscode.Uri[] | undefined = await showFileSelectDialog(filePath);
        //         if (testFile && testFile.length) {
        //             const input: string = (await fse.readFile(testFile[0].fsPath, "utf-8")).trim();
        //             if (input) {
        //                 result = await leetCodeExecutor.testSolution(filePath, parseTestString(input.replace(/\r?\n/g, "\\n")));
        //             } else {
        //                 vscode.window.showErrorMessage("The selected test file must not be empty.");
        //             }
        //         }
        //         break;
        //     default:
        //         break;
        // }
        if (!result) {
            return;
        }

        // const id: string = await getNodeIdFromFile(filePath);
        // if (!id) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${filePath}.`);
        //     return;
        // }
        // const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
        // if (!cachedNode) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
        //     return;
        // }

        const cachedNode: IProblem | undefined = await getCachedNode(filePath);
        if (!cachedNode) {
            return;
        }
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const descString: string = await leetCodeExecutor.getDescription(cachedNode.id, needTranslation);
        leetCodeSubmissionProvider.show(result, descString, cachedNode);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

export async function testSolutionWithTestcase(uri?: vscode.Uri, testString?: string): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }
        let result: string | undefined;
        // testString = await vscode.window.showInputBox({
        //     prompt: "Enter the test cases.",
        //     validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "Test case must not be empty.",
        //     placeHolder: "Example: [1,2,3]\\n4",
        //     ignoreFocusOut: true,
        // });

        // vscode.window.showInformationMessage('[' + testString + ']');

        if (testString) {
            result = await leetCodeExecutor.testSolution(filePath, `${testString.replace(/"/g, '\\"')}`);
        }

        if (!result) {
            return;
        }

        // const id: string = await getNodeIdFromFile(filePath);
        // if (!id) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${filePath}.`);
        //     return;
        // }
        // const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
        // if (!cachedNode) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
        //     return;
        // }
        // leetCodeSubmissionProvider.show(result, cachedNode);
        const cachedNode: IProblem | undefined = await getCachedNode(filePath);
        if (!cachedNode) {
            return;
        }
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const descString: string = await leetCodeExecutor.getDescription(cachedNode.id, needTranslation);
        leetCodeSubmissionProvider.show(result, descString, cachedNode);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

export async function testSolutionWithFilecase(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }

        let result: string | undefined;
        const testFile: vscode.Uri[] | undefined = await showFileSelectDialog(filePath);
        if (testFile && testFile.length) {
            const input: string = (await fse.readFile(testFile[0].fsPath, "utf-8")).trim();
            if (input) {
                result = await leetCodeExecutor.testSolution(filePath, parseTestString(input.replace(/\r?\n/g, "\\n")));
            } else {
                vscode.window.showErrorMessage("The selected test file must not be empty.");
            }
        }
        if (!result) {
            return;
        }
        // const id: string = await getNodeIdFromFile(filePath);
        // if (!id) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${filePath}.`);
        //     return;
        // }
        // const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
        // if (!cachedNode) {
        //     vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
        //     return;
        // }
        // leetCodeSubmissionProvider.show(result, cachedNode);
        const cachedNode: IProblem | undefined = await getCachedNode(filePath);
        if (!cachedNode) {
            return;
        }
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const descString: string = await leetCodeExecutor.getDescription(cachedNode.id, needTranslation);
        leetCodeSubmissionProvider.show(result, descString, cachedNode);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

export async function debugSolutionWithTestcase(uri?: vscode.Uri, testString?: string): Promise<void> {
    if (uri == null || testString == null) {
        return;
    }
    const filePath: string | undefined = await getActiveFilePath(uri);
    if (!filePath) {
        return;
    }

    try {
        var args = testString.replace(/\r?\n/g, "\n");
        if (filePath.endsWith(".java")) {
            vscode.debug.startDebugging(
                undefined,
                {
                    "type": "java",
                    "name": "Launch with Arguments Prompt",
                    "request": "launch",
                    "mainClass": "${file}",
                    "args": args
                },
            );
        } else if (filePath.endsWith(".go")) {
            vscode.debug.startDebugging(
                undefined,
                {
                    "name": "Debug go file",
                    "type": "go",
                    "request": "launch",
                    "mode": "debug",
                    "program": "${file}",
                    "args": args
                },
            );
        }

    } catch (error) {
        await promptForOpenOutputChannel("Failed to debug the solution. Please open the output channel for details.", DialogType.error);
    }
}

export async function debugSolution(uri?: vscode.Uri): Promise<void> {
    try {
        if (leetCodeManager.getStatus() === UserStatus.SignedOut) {
            return;
        }

        const filePath: string | undefined = await getActiveFilePath(uri);
        if (!filePath) {
            return;
        }

        const cachedNode: IProblem | undefined = await getCachedNode(filePath);
        if (!cachedNode) {
            return;
        }
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const descString: string = await leetCodeExecutor.getDescription(cachedNode.id, needTranslation);
        const [
            /* title */, ,
            /* url */, ,
            /* tags */, ,
            /* langs */, ,
            /* category */,
            /* difficulty */,
            /* likes */,
            /* dislikes */,
            /* accepted */,
            /* submissions */,
            testcase
        ] = descString.split("\n");
        debugSolutionWithTestcase(uri, eval(testcase.replace("* Testcase Example:", "").trim()).replace(/"/g, '\\"'));
    } catch (error) {
        await promptForOpenOutputChannel("Failed to test the solution. Please open the output channel for details.", DialogType.error);
    }
}

function parseTestString(test: string): string {
    if (wsl.useWsl() || !isWindows()) {
        return `'${test}'`;
    }

    // In windows and not using WSL
    if (usingCmd()) {
        return `"${test.replace(/"/g, '\\"')}"`;
    } else {
        // Assume using PowerShell
        return `'${test.replace(/"/g, '\\"')}'`;
    }
}

async function getCachedNode(filePath: string): Promise<LeetCodeNode | undefined> {
    const id: string = await getNodeIdFromFile(filePath);
    if (!id) {
        vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${filePath}.`);
        return undefined;
    }
    const cachedNode: LeetCodeNode | undefined = explorerNodeManager.getNodeById(id);
    if (!cachedNode) {
        vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
        return;
    }

    return cachedNode;
}
