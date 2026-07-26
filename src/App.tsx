import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import appIcon from "./assets/icon.png";
import "./App.css";

const SAVE_DEBOUNCE_MS = 500;
const FONT_DEFAULT = 15;

function App() {
  const [value, setValue] = useState("");
  const valueRef = useRef(value);
  const dirtyRef = useRef(false);
  const editedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const persist = useCallback(async (content: string) => {
    try {
      await invoke("save_note", { content });
      dirtyRef.current = false;
    } catch (e) {
      console.error("save_note failed", e);
    }
  }, []);

  const scheduleSave = useCallback(
    (content: string) => {
      dirtyRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist(content);
      }, SAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  const flushSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (dirtyRef.current) {
      void persist(valueRef.current);
    }
  }, [persist]);

  useEffect(() => {
    void invoke<string>("load_note")
      .then((text) => {
        if (!editedRef.current) setValue(text);
      })
      .catch((e) => console.error("load_note failed", e));
  }, []);

  useEffect(() => {
    const onBlur = () => flushSave();
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      flushSave();
    };
  }, [flushSave]);

  const closeWindow = () => {
    flushSave();
    void getCurrentWindow().close();
  };

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-brand" data-tauri-drag-region>
          <img className="titlebar-icon" src={appIcon} alt="" draggable={false} />
          <span className="titlebar-title" data-tauri-drag-region>
            Monaco
          </span>
        </div>
        <div className="titlebar-drag" data-tauri-drag-region />
        <button
          type="button"
          className="titlebar-close"
          aria-label="Close"
          onClick={closeWindow}
        >
          ×
        </button>
      </div>
      <div className="editor">
        <Editor
          height="100%"
          language="plaintext"
          theme="vs-light"
          value={value}
          onChange={(next) => {
            const text = next ?? "";
            editedRef.current = true;
            setValue(text);
            scheduleSave(text);
          }}
          options={{
            lineNumbers: "off", // 行番号を非表示
            minimap: { enabled: false }, // 右側ミニマップを非表示
            wordWrap: "on", // 長い行を折り返す
            folding: false, // コード折りたたみを無効
            glyphMargin: false, // 行左のアイコン余白を消す
            lineDecorationsWidth: 0, // 行装飾用の横幅をゼロに
            lineNumbersMinChars: 0, // 行番号欄の最小幅をゼロに
            renderLineHighlight: "none", // 現在行のハイライトなし
            overviewRulerLanes: 0, // 右側オーバービュールーラーを消す
            hideCursorInOverviewRuler: true, // オーバービュー上のカーソル印を隠す
            scrollBeyondLastLine: false, // 最終行より下への余分なスクロールなし
            scrollbar: { verticalScrollbarSize: 8 }, // 縦スクロールバーを細く
            fontSize: FONT_DEFAULT, // フォントサイズ（定数）
            automaticLayout: true, // 親要素サイズ変更に合わせて再レイアウト
          }}
        />
      </div>
    </div>
  );
}

export default App;
