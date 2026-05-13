#!/usr/bin/env bash
#
# Build the PDF target and post-process it for PDF/UA-1 validator compatibility.
#
# Usage (from inside book/):
#   ./build-pdf.sh
#
# Why this exists:
#   custom-latex.xsl declares pdfstandard=ua-2 so LaTeX tags math and other
#   structures using the PDF 2.0 namespace. Panorama (Allyant) and other
#   PDF/UA-1 validators only recognize the PDF 1.7 structure namespace, so
#   they cannot see the alt text on figures tagged in the PDF 2.0 namespace.
#   scripts/postbuild_fix_figure_namespace.py repoints those /Figure elements
#   to the PDF 1.7 namespace after the build.
#
set -euo pipefail

cd "$(dirname "$0")"

# Use the project's local virtualenv (book/.venv) so this works without
# requiring the user to activate the venv first.
VENV_BIN="$(pwd)/.venv/bin"
if [[ ! -x "$VENV_BIN/pretext" ]]; then
  echo "error: $VENV_BIN/pretext not found." >&2
  echo "       Create the venv and install pretext into it, then re-run." >&2
  exit 1
fi
PRETEXT="$VENV_BIN/pretext"
PYTHON="$VENV_BIN/python"
PIP="$VENV_BIN/pip"

# The postbuild step uses pikepdf to walk the structure tree. Install it
# into the venv on first run if it's missing.
if ! "$PYTHON" -c "import pikepdf" 2>/dev/null; then
  echo "==> installing pikepdf into .venv (one-time)"
  "$PIP" install pikepdf
fi

echo "==> $PRETEXT build print"
"$PRETEXT" build print

echo "==> postbuild: re-point /Figure structure elements to PDF 1.7 namespace"
"$PYTHON" scripts/postbuild_fix_figure_namespace.py

echo "==> done: output/print/umw-logic.pdf"
