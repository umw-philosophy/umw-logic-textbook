# Building the Book

## One-time setup

1. Install Python 3.10+ if you don't already have it.
2. Install PreTeXt:

   ```sh
   pip install pretext
   ```

3. Install supporting tools:
   - **For PDF output**: a TeX distribution (TeX Live on Linux/macOS, MiKTeX on Windows). PreTeXt uses XeLaTeX under the hood.
   - **For HTML output with rendered math**: nothing additional; PreTeXt bundles MathJax for the web target.
   - **For SVG figures from PreTeXt `<diagram>` elements**: the PreTeXt CLI handles this when run from inside the `book/` directory.

4. Verify the install:

   ```sh
   pretext --version
   ```

## Building

From inside `book/`:

```sh
# Build the web (HTML) version
pretext build web

# Build the print (PDF) version
pretext build print

# Serve the web version locally for browser preview
pretext view web
```

Outputs appear in `book/output/`.

> **Note**: The first `pretext build web` run downloads supporting files from
> `runestone.academy`. If you are behind a restrictive firewall or have no
> network, this download will fail — but cached files will be reused on
> subsequent runs once you have built once successfully.

## Verified working as of project alignment (April 2026)

The scaffold has been confirmed to build the PDF target on a Linux/Python
3.10 environment with `pretext==2.38.3`. The web target requires network
access on first run to fetch Runestone services.

## Conventions

- Source lives under `book/source/`.
- `main.ptx` is the root; chapters are in `chapters/`; reusable examples are in `examples/`.
- Publication settings (numbering, theme, accessibility) are in `book/publication/publication.ptx`.
- Reproducible builds: a frozen PreTeXt version will be pinned in a requirements file once we lock the toolchain. A Dockerfile will be added for fully reproducible builds (failure mode mitigation in `PROJECT_PLAN.md` §14).

## Accessibility verification

Before any chapter is considered complete, the rendered HTML must be opened
with a screen reader (VoiceOver on macOS, NVDA on Windows, Orca on Linux)
and verified for keyboard-only navigation, semantic structure, and
non-color-only feedback. See `PROJECT_PLAN.md` §7.
