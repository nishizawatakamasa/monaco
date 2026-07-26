import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
// monaco-editor 0.56 exports map `monaco-editor/editor/...` -> `esm/vs/editor/...`
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

loader.config({ monaco });
