// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as settingUtils from "../utils/settingUtils";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";
import { getNodeIdFromFile } from "../utils/problemUtils";
import { IProblem } from "../shared";
import { explorerNodeManager } from "../explorer/explorerNodeManager";

export async function submitSolution(uri?: vscode.Uri): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }

    const filePath: string | undefined = await getActiveFilePath(uri);
    if (!filePath) {
        return;
    }

    try {
        const id: string = await getNodeIdFromFile(filePath);
        if (!id) {
            vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${filePath}.`);
            return;
        }
        const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
        if (!cachedNode) {
            vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
            return;
        }

        const result: string = await leetCodeExecutor.submitSolution(filePath);

        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const descString: string = await leetCodeExecutor.getDescription(cachedNode.id, needTranslation);
        leetCodeSubmissionProvider.show(result, descString, cachedNode);
    } catch (error) {
        await promptForOpenOutputChannel("Failed to submit the solution. Please open the output channel for details.", DialogType.error);
        return;
    }

    leetCodeTreeDataProvider.refresh();
}
