import * as vscode from 'vscode';
import { HoverProvider } from "vscode";

const uriStore: Record<
  vscode.Uri["path"],
  {
    range: vscode.Range;
    contents: string[];
  }[]
> = {};

export const hoverProvider: HoverProvider = {
  provideHover(document, position) {
    const itemsInUriStore = uriStore[document.uri.fsPath];

    if (!itemsInUriStore) {
      return null;
    }

    const itemInRange = itemsInUriStore.filter((item) =>
      item.range.contains(position)
    );

    return {
      range: itemInRange?.[0]?.range,
      contents: itemInRange.flatMap((item) => item.contents),
    };
  },
};

const motivationalMessage = "今日の失敗が、明日の君を強くする。";

export function activate(context: vscode.ExtensionContext) {
	const registeredLanguages = new Set<string>();

	context.subscriptions.push(
		vscode.languages.onDidChangeDiagnostics(async (e) => {
			e.uris.forEach((uri) => {
				const diagnostics = vscode.languages.getDiagnostics(uri);

				uriStore[uri.fsPath] = diagnostics.map((diagnostic) => ({
					range: diagnostic.range,
					contents: [motivationalMessage],
				}));

				const editor = vscode.window.visibleTextEditors.find(
					(editor) => editor.document.uri.toString() === uri.toString()
				);

				if (editor && !registeredLanguages.has(editor.document.languageId)) {
					registeredLanguages.add(editor.document.languageId);
					context.subscriptions.push(
						vscode.languages.registerHoverProvider(
							{
								language: editor.document.languageId,
							},
							hoverProvider
						)
					);
				}
			});
		}
	));
}
