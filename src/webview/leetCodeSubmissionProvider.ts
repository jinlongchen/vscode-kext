// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.
import { ViewColumn } from "vscode";
import { openKeybindingsEditor, promptHintMessage } from "../utils/uiUtils";
import { ILeetCodeWebviewOption, LeetCodeWebview } from "./LeetCodeWebview";
import { markdownEngine } from "./markdownEngine";
import { IProblem } from "../shared";

class LeetCodeSubmissionProvider extends LeetCodeWebview {

    protected readonly viewType: string = "lovecode.submission";
    private result: IResult;
    private description: IDescription;

    public show(resultString: string, descString: string, node: IProblem): void {
        this.description = this.parseDescription(descString, node);
        this.result = this.parseResult(resultString);
        this.showWebviewInternal();
        this.showKeybindingsHint();
    }

    protected getWebviewOption(): ILeetCodeWebviewOption {
        return {
            title: "Submission",
            viewColumn: ViewColumn.Two,
        };
    }

    protected getWebviewContent(): string {
        const styles: string = markdownEngine.getStyles();
        const title: string = `## ${this.result.messages[0]}`;
        const messages: string[] = this.result.messages.slice(1).map((m: string) => `* ${m}`);
        const sections: string[] = Object.keys(this.result)
            .filter((key: string) => key !== "messages")
            .map((key: string) => [
                `### ${key}`,
                "```",
                this.result[key].join("\n"),
                "```",
            ].join("\n"));
        const body: string = markdownEngine.render([
            title,
            ...messages,
            ...sections,
        ].join("\n"));

        const { url } = this.description;
        const links: string = markdownEngine.render(`[Submissions](${this.getSubmissionsLink(url)})`);
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; script-src vscode-resource:; style-src vscode-resource:;"/>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${styles}
            </head>
            <body class="vscode-body 'scrollBeyondLastLine' 'wordWrap' 'showEditorSelection'" style="tab-size:4">
                ${body}
                <hr />
                ${links}
            </body>
            </html>
        `;
    }

    protected onDidDisposeWebview(): void {
        super.onDidDisposeWebview();
    }

    private async showKeybindingsHint(): Promise<void> {
        await promptHintMessage(
            "hint.commandShortcut",
            'You can customize shortcut key bindings in File > Preferences > Keyboard Shortcuts with query "leetcode".',
            "Open Keybindings",
            (): Promise<any> => openKeybindingsEditor("leetcode solution"),
        );
    }

    private parseResult(raw: string): IResult {
        raw = raw.concat("  √ "); // Append a dummy sentinel to the end of raw string
        const regSplit: RegExp = /  [√×✔✘vx] ([^]+?)\n(?=  [√×✔✘vx] )/g;
        const regKeyVal: RegExp = /(.+?): ([^]*)/;
        const result: IResult = { messages: [] };
        let entry: RegExpExecArray | null;
        do {
            entry = regSplit.exec(raw);
            if (!entry) {
                continue;
            }
            const kvMatch: RegExpExecArray | null = regKeyVal.exec(entry[1]);
            if (kvMatch) {
                const [key, value] = kvMatch.slice(1);
                if (value) { // Do not show empty string
                    if (!result[key]) {
                        result[key] = [];
                    }
                    result[key].push(value);
                }
            } else {
                result.messages.push(entry[1]);
            }
        } while (entry);
        return result;
    }

    private parseDescription(descString: string, problem: IProblem): IDescription {
        const [
            /* title */, ,
            url, ,
            /* tags */, ,
            /* langs */, ,
            category,
            difficulty,
            likes,
            dislikes,
            /* accepted */,
            /* submissions */,
            /* testcase */, ,
            ...body
        ] = descString.split("\n");
        return {
            title: problem.name,
            url,
            tags: problem.tags,
            companies: problem.companies,
            category: category.slice(2),
            difficulty: difficulty.slice(2),
            likes: likes.split(": ")[1].trim(),
            dislikes: dislikes.split(": ")[1].trim(),
            body: body.join("\n").replace(/<pre>[\r\n]*([^]+?)[\r\n]*<\/pre>/g, "<pre><code>$1</code></pre>"),
        };
    }

    private getSubmissionsLink(url: string): string {
        return url.replace("/description/", "/submissions/");
    }
}

interface IDescription {
    title: string;
    url: string;
    tags: string[];
    companies: string[];
    category: string;
    difficulty: string;
    likes: string;
    dislikes: string;
    body: string;
}

interface IResult {
    [key: string]: string[];
    messages: string[];
}

export const leetCodeSubmissionProvider: LeetCodeSubmissionProvider = new LeetCodeSubmissionProvider();
