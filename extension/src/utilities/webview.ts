import { Uri, Webview } from "vscode";
import { getUri } from "./uri";
import { getNonce } from "./nonce";

export function getHtmlForWebview(webview: Webview, extensionUri: Uri) {
  const stylesUri = getUri(webview, extensionUri, [
    "out",
    "webview",
    "assets",
    "index.css",
  ]);

  const scriptUri = getUri(webview, extensionUri, [
    "out",
    "webview",
    "assets",
    "index.js",
  ]);

  const nonce = getNonce();

  return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link href="${stylesUri}" rel="stylesheet" />
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
}
