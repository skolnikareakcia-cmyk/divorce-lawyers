"""Сборка методички: docx -> pdf, номера страниц в содержании.

Требуется: node + пакет docx, LibreOffice (soffice) с Writer, poppler-utils (pdftotext).
Запуск из любой папки: python3 src/build.py
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
DOCX = ROOT / "Metodichka_USB-M.docx"
PDF = ROOT / "Metodichka_USB-M.pdf"
TOC_PAGES = SRC / "toc-pages.json"
TOC_ENTRIES = SRC / "toc-entries.json"
FIRST_BODY_PAGE = 3  # 1 — титул, 2 — содержание


def run(cmd, **kw):
    print("+", " ".join(map(str, cmd)))
    subprocess.run(cmd, check=True, **kw)


def generate():
    run(["node", str(SRC / "generate.js")])


def to_pdf():
    with tempfile.TemporaryDirectory(prefix="lo_profile_") as prof:
        run(["soffice", f"-env:UserInstallation={Path(prof).as_uri()}", "--headless",
             "--convert-to", "pdf", "--outdir", str(ROOT), str(DOCX)],
            stdout=subprocess.DEVNULL)


def page_texts():
    n = int(re.search(r"Pages:\s+(\d+)", subprocess.run(
        ["pdfinfo", str(PDF)], capture_output=True, text=True, check=True).stdout).group(1))
    texts = []
    for p in range(1, n + 1):
        t = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), str(PDF), "-"],
                           capture_output=True, text=True, check=True).stdout
        texts.append(" ".join(t.split()))
    return texts


def find_pages():
    entries = json.loads(TOC_ENTRIES.read_text(encoding="utf8"))
    texts = page_texts()
    pages = {}
    for e in entries:
        if e["id"].startswith("prilozhenie_"):
            needle = e["text"].split(".")[0] + " к методическим рекомендациям"
        elif e["id"] == "list_oznakomleniya":
            needle = "ЛИСТ ОЗНАКОМЛЕНИЯ"
        else:
            needle = e["text"]
        needle = " ".join(needle.split())
        for i in range(FIRST_BODY_PAGE - 1, len(texts)):
            if needle in texts[i]:
                pages[e["id"]] = i + 1
                break
        else:
            sys.exit(f"не найден заголовок: {needle}")
    return pages


def main():
    TOC_PAGES.unlink(missing_ok=True)
    generate()
    to_pdf()
    pages = find_pages()
    TOC_PAGES.write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf8")
    generate()
    to_pdf()
    check = find_pages()
    if check != pages:
        sys.exit(f"номера страниц сместились после второго прохода: {pages} -> {check}")
    print("OK:", len(texts := page_texts()), "стр.;", pages)


if __name__ == "__main__":
    main()
