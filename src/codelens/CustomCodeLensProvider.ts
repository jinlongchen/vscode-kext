// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { explorerNodeManager } from "../explorer/explorerNodeManager";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { getEditorShortcuts } from "../utils/settingUtils";

export class CustomCodeLensProvider implements vscode.CodeLensProvider {

    private onDidChangeCodeLensesEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    get onDidChangeCodeLenses(): vscode.Event<void> {
        return this.onDidChangeCodeLensesEmitter.event;
    }

    public refresh(): void {
        this.onDidChangeCodeLensesEmitter.fire();
    }

    public provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
        const shortcuts: string[] = getEditorShortcuts();
        if (!shortcuts) {
            return;
        }

        const content: string = document.getText();
        const matchResult: RegExpMatchArray | null = content.match(/@lc app=.* id=(.*) lang=.*/);
        if (!matchResult) {
            return undefined;
        }
        const nodeId: string | undefined = matchResult[1];
        let node: LeetCodeNode | undefined;
        if (nodeId) {
            node = explorerNodeManager.getNodeById(nodeId);
        }

        const codeLens: vscode.CodeLens[] = [];

        // let codeLensLine: number = document.lineCount - 1;
        //for (let i: number = document.lineCount - 1; i >= 0; i--) {

        let testcaseStartLine: number = 0;
        for (let i: number = 0; i < document.lineCount; i++) {
            const lineContent: string = document.lineAt(i).text;
            if (lineContent.indexOf("@lc code=end") >= 0) {
                const range: vscode.Range = new vscode.Range(i, 0, i, 0);

                if (shortcuts.indexOf("submit") >= 0) {
                    codeLens.push(new vscode.CodeLens(range, {
                        title: "Submit",
                        command: "lovecode.submitSolution",
                        arguments: [document.uri],
                    }));
                }

                if (shortcuts.indexOf("test") >= 0) {
                    codeLens.push(new vscode.CodeLens(range, {
                        title: "Test",
                        command: "lovecode.testSolution",
                        arguments: [document.uri],
                    }));
                }

                if (shortcuts.indexOf("star") >= 0 && node) {
                    codeLens.push(new vscode.CodeLens(range, {
                        title: node.isFavorite ? "Unstar" : "Star",
                        command: node.isFavorite ? "lovecode.removeFavorite" : "lovecode.addFavorite",
                        arguments: [node],
                    }));
                }

                if (shortcuts.indexOf("solution") >= 0) {
                    codeLens.push(new vscode.CodeLens(range, {
                        title: "Solution",
                        command: "lovecode.showSolution",
                        arguments: [document.uri],
                    }));
                }

                if (shortcuts.indexOf("description") >= 0) {
                    codeLens.push(new vscode.CodeLens(range, {
                        title: "Description",
                        command: "lovecode.previewProblem",
                        arguments: [document.uri],
                    }));
                }
            } else if (lineContent.indexOf("@lc testcase=end") >= 0) {
                const range: vscode.Range = new vscode.Range(i, 0, i, 0);
                var testcaseArray = new Array<string>();
                for (let j: number = testcaseStartLine; j < i; j++) {
                    testcaseArray.push(document.lineAt(j).text);
                }
                var testString = testcaseArray.join('\n').trim();
                codeLens.push(new vscode.CodeLens(range, {
                    title: "Test",
                    command: "lovecode.testSolutionWithTestCase",
                    arguments: [document.uri, testString],
                }));
            } else if (lineContent.indexOf("@lc testcase=start") >= 0) {
                testcaseStartLine = i + 1;
            }
        }

        return codeLens;
    }
}

export const customCodeLensProvider: CustomCodeLensProvider = new CustomCodeLensProvider();
