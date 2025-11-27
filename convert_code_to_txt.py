import os
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

# ▼ スクリプトが置かれているディレクトリを取得
script_dir = Path(__file__).resolve().parent

# ▼ 変換後の .txt ファイルを保存するディレクトリを指定してください
OUTPUT_DIR = r"C:\Programming\Webapp\kanjosen-nomi\chatgpt" # 例：任意のフォルダパスに変更

# ▼ 対象とする拡張子（例：.tsx のみ変換）
#   すべてのファイルを変換したい場合は、TARGET_EXTS = None としてください
TARGET_EXTS = None  # 例：[".tsx", ".ts", ".js"] のように追加も可能


def should_convert(path: Path) -> bool:
    """変換対象とするかどうかを判定"""
    if TARGET_EXTS is None:
        return True
    return path.suffix.lower() in (ext.lower() for ext in TARGET_EXTS)


def iter_files_from_paths(paths):
    """選択されたファイル／フォルダからファイル一覧を列挙"""
    for p in paths:
        p = Path(p)
        if p.is_file():
            yield p
        elif p.is_dir():
            for root, _, files in os.walk(p):
                for name in files:
                    yield Path(root) / name


def select_targets(root):
    """
    ファイル・フォルダを複数選択する処理
    ・最初にファイルを複数選択
    ・続けて、フォルダを必要な数だけ選択（キャンセルで終了）
    """
    # ▼ ファイル選択（初期フォルダ = スクリプトの場所）
    file_paths = filedialog.askopenfilenames(
        title="変換するファイルを選択してください（複数選択可）",
        parent=root,
        initialdir=script_dir
    )

    selected = list(file_paths)

    # フォルダ選択（必要な分だけ繰り返し。キャンセルで終了）
    while True:
        dir_path = filedialog.askdirectory(
            title="変換対象のフォルダがあれば選択してください（終了する場合はキャンセル）",
            parent=root,
            initialdir=script_dir
        )
        if not dir_path:
            break
        selected.append(dir_path)

    return selected


def convert_to_txt():
    root = tk.Tk()
    root.withdraw()  # Tk ウィンドウを表示しない

    try:
        # 変換対象の選択
        selected_paths = select_targets(root)
        if not selected_paths:
            messagebox.showinfo("情報", "ファイル／フォルダが選択されませんでした。", parent=root)
            return

        output_dir = Path(OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)

        # 対象ファイル一覧を作成
        all_files = list(iter_files_from_paths(selected_paths))
        target_files = [f for f in all_files if should_convert(f)]

        if not target_files:
            messagebox.showinfo("情報", "指定条件に一致する変換対象ファイルがありませんでした。", parent=root)
            return

        # 変換処理
        converted_count = 0
        for src in target_files:
            # 保存ファイル名：拡張子だけ .txt に変更
            dst_name = src.stem + ".txt"
            dst_path = output_dir / dst_name  # 同名があれば上書き

            # 読み込み（UTF-8 を優先、ダメなら Shift_JIS 系を試す）
            try:
                text = src.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = src.read_text(encoding="cp932", errors="replace")

            # 書き込み（UTF-8 で上書き保存）
            dst_path.write_text(text, encoding="utf-8", newline="")

            converted_count += 1

        messagebox.showinfo(
            "完了",
            f"{converted_count} 件のファイルを '{output_dir}' に .txt として出力しました。",
            parent=root,
        )
    finally:
        root.destroy()


if __name__ == "__main__":
    convert_to_txt()
