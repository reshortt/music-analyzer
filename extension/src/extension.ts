// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "music-analyzer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('music-analyzer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Music Analyzer Mr White!!');
	});

	const disposable2 = vscode.commands.registerCommand('music-analyzer.openPianoRoll', () => {
		const panel = vscode.window.createWebviewPanel("piano-roll", "Piano Roll", vscode.ViewColumn.Active, {enableScripts:true, retainContextWhenHidden: true})
		// Set the HTML content
		panel.webview.html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Piano Roll</title>
		</head>
		<body>
			<h1>Hello World!</h1>
		</body>
		</html>`
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}
