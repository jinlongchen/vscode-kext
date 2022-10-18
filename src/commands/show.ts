// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as _ from "lodash";
import * as path from "path";
import * as unescapeJS from "unescape-js";
import * as vscode from "vscode";
import { explorerNodeManager } from "../explorer/explorerNodeManager";
import { LeetCodeNode } from "../explorer/LeetCodeNode";
import { leetCodeChannel } from "../leetCodeChannel";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { IProblem, IQuickItemEx, languages, ProblemState } from "../shared";
import { genFileExt, genFileName, getNodeIdFromFile } from "../utils/problemUtils";
import * as settingUtils from "../utils/settingUtils";
import { IDescriptionConfiguration } from "../utils/settingUtils";
import { DialogOptions, DialogType, openSettingsEditor, promptForOpenOutputChannel, promptForSignIn, promptHintMessage } from "../utils/uiUtils";
import { getActiveFilePath, selectWorkspaceFolder } from "../utils/workspaceUtils";
import * as wsl from "../utils/wslUtils";
import { leetCodePreviewProvider } from "../webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "../webview/leetCodeSolutionProvider";
import { leetCodeStatusBarController } from "../statusbar/leetCodeStatusBarController";
import * as list from "./list";

const TIME_STORAGE_KEY = 'lovecode-time:storage-key';
let ticker: NodeJS.Timeout;

export async function previewProblem(context: vscode.ExtensionContext, input: IProblem | vscode.Uri, isSideMode: boolean = false): Promise<void> {
    let node: IProblem;
    if (input instanceof vscode.Uri) {
        const activeFilePath: string = input.fsPath;
        const id: string = await getNodeIdFromFile(activeFilePath);
        if (!id) {
            vscode.window.showErrorMessage(`Failed to resolve the problem id from file: ${activeFilePath}.`);
            return;
        }
        const cachedNode: IProblem | undefined = explorerNodeManager.getNodeById(id);
        if (!cachedNode) {
            vscode.window.showErrorMessage(`Failed to resolve the problem with id: ${id}.`);
            return;
        }
        node = cachedNode;
        // Move the preview page aside if it's triggered from Code Lens
        isSideMode = true;
    } else {
        node = input;
    }
    const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
    const descString: string = await leetCodeExecutor.getDescription(node.id, needTranslation);
    leetCodePreviewProvider.show(descString, node, isSideMode);

    if (!isSideMode) {
        clearInterval(ticker);
        setElapsedTime(0, context);

        const updateTimer = async () => {
            const seconds = getElapsedTime(context) + 1;
            await setElapsedTime(seconds, context);
            leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), `${leetCodeManager.getUser()} ${timeToDuration(seconds)}`);
        };

        ticker = setInterval(updateTimer, 1000);
    }
}

export async function pickOne(context: vscode.ExtensionContext): Promise<void> {
    const problems: IProblem[] = await list.listProblems();
    const randomProblem: IProblem = problems[Math.floor(Math.random() * problems.length)];
    await showProblemInternal(context, randomProblem);
}

export async function showProblem(context: vscode.ExtensionContext, node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(context, node);
}

export async function codeNow(context: vscode.ExtensionContext, node?: LeetCodeNode): Promise<void> {
    if (!node) {
        return;
    }
    await showProblemInternal(context, node, true);
}

export async function searchProblem(context: vscode.ExtensionContext): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }
    const choice: IQuickItemEx<IProblem> | undefined = await vscode.window.showQuickPick(
        parseProblemsToPicks(list.listProblems()),
        {
            matchOnDetail: true,
            placeHolder: "Select one problem",
        },
    );
    if (!choice) {
        return;
    }
    await previewProblem(context, choice.value);
    // await showProblemInternal(context, choice.value);
}

export async function showSolution(input: LeetCodeNode | vscode.Uri): Promise<void> {
    let problemInput: string | undefined;
    if (input instanceof LeetCodeNode) { // Triggerred from explorer
        problemInput = input.id;
    } else if (input instanceof vscode.Uri) { // Triggerred from Code Lens/context menu
        problemInput = `"${input.fsPath}"`;
    } else if (!input) { // Triggerred from command
        problemInput = await getActiveFilePath();
    }

    if (!problemInput) {
        vscode.window.showErrorMessage("Invalid input to fetch the solution data.");
        return;
    }

    const language: string | undefined = await fetchProblemLanguage();
    if (!language) {
        return;
    }
    try {
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();
        const solution: string = await leetCodeExecutor.showSolution(problemInput, language, needTranslation);
        leetCodeSolutionProvider.show(unescapeJS(solution));
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        await promptForOpenOutputChannel("Failed to fetch the top voted solution. Please open the output channel for details.", DialogType.error);
    }
}

async function fetchProblemLanguage(): Promise<string | undefined> {
    const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("lovecode");
    let defaultLanguage: string | undefined = leetCodeConfig.get<string>("defaultLanguage");
    if (defaultLanguage && languages.indexOf(defaultLanguage) < 0) {
        defaultLanguage = undefined;
    }
    const language: string | undefined = defaultLanguage || await vscode.window.showQuickPick(languages, { placeHolder: "Select the language you want to use", ignoreFocusOut: true });
    // fire-and-forget default language query
    (async (): Promise<void> => {
        if (language && !defaultLanguage && leetCodeConfig.get<boolean>("hint.setDefaultLanguage")) {
            const choice: vscode.MessageItem | undefined = await vscode.window.showInformationMessage(
                `Would you like to set '${language}' as your default language?`,
                DialogOptions.yes,
                DialogOptions.no,
                DialogOptions.never,
            );
            if (choice === DialogOptions.yes) {
                leetCodeConfig.update("defaultLanguage", language, true /* UserSetting */);
            } else if (choice === DialogOptions.never) {
                leetCodeConfig.update("hint.setDefaultLanguage", false, true /* UserSetting */);
            }
        }
    })();
    return language;
}

async function showProblemInternal(context: vscode.ExtensionContext, node: IProblem, notShowInWebview: boolean = false): Promise<void> {
    try {
        const language: string | undefined = await fetchProblemLanguage();
        if (!language) {
            return;
        }

        const leetCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("lovecode");
        const workspaceFolder: string = await selectWorkspaceFolder();
        if (!workspaceFolder) {
            return;
        }

        const fileFolder: string = leetCodeConfig
            .get<string>(`filePath.${language}.folder`, leetCodeConfig.get<string>(`filePath.default.folder`, ""))
            .trim();
        const fileName: string = leetCodeConfig
            .get<string>(
                `filePath.${language}.filename`,
                leetCodeConfig.get<string>(`filePath.default.filename`) || genFileName(node, language),
            )
            .trim();

        let finalPath: string = path.join(workspaceFolder, fileFolder, fileName);

        if (finalPath) {
            finalPath = await resolveRelativePath(finalPath, node, language);
            if (!finalPath) {
                leetCodeChannel.appendLine("Showing problem canceled by user.");
                return;
            }
        }

        finalPath = wsl.useWsl() ? await wsl.toWinPath(finalPath) : finalPath;

        const descriptionConfig: IDescriptionConfiguration = settingUtils.getDescriptionConfiguration();
        const needTranslation: boolean = settingUtils.shouldUseEndpointTranslation();

        await leetCodeExecutor.writeProblemCode(node, language, finalPath, descriptionConfig.showInComment, needTranslation);
        const promises: any[] = [
            vscode.window.showTextDocument(vscode.Uri.file(finalPath), { preview: false, viewColumn: vscode.ViewColumn.One }),
            promptHintMessage(
                "hint.commentDescription",
                'You can config how to show the problem description through "lovecode.showDescription".',
                "Open settings",
                (): Promise<any> => openSettingsEditor("lovecode.showDescription"),
            ),
        ];
        if (!notShowInWebview && descriptionConfig.showInWebview) {
            promises.push(context, showDescriptionView(context, node));
        }

        await Promise.all(promises);
    } catch (error) {
        await promptForOpenOutputChannel(`${error} Please open the output channel for details.`, DialogType.error);
    }
}

async function showDescriptionView(context: vscode.ExtensionContext, node: IProblem): Promise<void> {
    return previewProblem(context, node, vscode.workspace.getConfiguration("lovecode").get<boolean>("enableSideMode", true));
}
async function parseProblemsToPicks(p: Promise<IProblem[]>): Promise<Array<IQuickItemEx<IProblem>>> {
    return new Promise(async (resolve: (res: Array<IQuickItemEx<IProblem>>) => void): Promise<void> => {
        const picks: Array<IQuickItemEx<IProblem>> = (await p).map((problem: IProblem) => Object.assign({}, {
            label: `${parseProblemDecorator(problem.state, problem.locked)}${problem.id}.${problem.name}`,
            description: "",
            detail: `AC rate: ${problem.passRate}, Difficulty: ${problem.difficulty}`,
            value: problem,
        }));
        resolve(picks);
    });
}

function parseProblemDecorator(state: ProblemState, locked: boolean): string {
    switch (state) {
        case ProblemState.AC:
            return "$(check) ";
        case ProblemState.NotAC:
            return "$(x) ";
        default:
            return locked ? "$(lock) " : "";
    }
}

async function resolveRelativePath(relativePath: string, node: IProblem, selectedLanguage: string): Promise<string> {
    let tag: string = "";
    if (/\$\{tag\}/i.test(relativePath)) {
        tag = (await resolveTagForProblem(node)) || "";
    }

    let company: string = "";
    if (/\$\{company\}/i.test(relativePath)) {
        company = (await resolveCompanyForProblem(node)) || "";
    }

    return relativePath.replace(/\$\{(.*?)\}/g, (_substring: string, ...args: string[]) => {
        const placeholder: string = args[0].toLowerCase().trim();
        switch (placeholder) {
            case "id":
                return node.id;
            case "name":
                return node.name;
            case "camelcasename":
                return _.camelCase(node.name);
            case "pascalcasename":
                return _.upperFirst(_.camelCase(node.name));
            case "kebabcasename":
            case "kebab-case-name":
                return _.kebabCase(node.name);
            case "snakecasename":
            case "snake_case_name":
                return _.snakeCase(node.name);
            case "ext":
                return genFileExt(selectedLanguage);
            case "language":
                return selectedLanguage;
            case "difficulty":
                return node.difficulty.toLocaleLowerCase();
            case "tag":
                return tag;
            case "company":
                return company;
            default:
                const errorMsg: string = `The config '${placeholder}' is not supported.`;
                leetCodeChannel.appendLine(errorMsg);
                throw new Error(errorMsg);
        }
    });
}

async function resolveTagForProblem(problem: IProblem): Promise<string | undefined> {
    if (problem.tags.length === 1) {
        return problem.tags[0];
    }
    return await vscode.window.showQuickPick(
        problem.tags,
        {
            matchOnDetail: true,
            placeHolder: "Multiple tags available, please select one",
            ignoreFocusOut: true,
        },
    );
}

async function resolveCompanyForProblem(problem: IProblem): Promise<string | undefined> {
    if (problem.companies.length === 1) {
        return problem.companies[0];
    }
    return await vscode.window.showQuickPick(problem.companies, {
        matchOnDetail: true,
        placeHolder: "Multiple tags available, please select one",
        ignoreFocusOut: true,
    });
}

function timeToDuration(seconds: number): string {
    var hh = Math.floor(seconds / 3600),
        mm = Math.floor(seconds / 60) % 60,
        ss = Math.floor(seconds) % 60;
    return (hh ? (hh < 10 ? "0" : "") + hh + ":" : "") + ((mm < 10) && hh ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss
}

async function setElapsedTime(seconds: number, context: vscode.ExtensionContext): Promise<void> {
    await context.globalState.update(TIME_STORAGE_KEY, Math.max(0, seconds));
}
function getElapsedTime(context: vscode.ExtensionContext): number {
    return parseInt(context.globalState.get(TIME_STORAGE_KEY, '0'));
}
