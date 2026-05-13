#!/usr/bin/env python3
"""Transplant alt text from orphan /Figure StructElems onto the StructElems
that actually wrap the image content.

The bug
-------
``custom-latex.xsl`` emits ``\includegraphics[width=\\linewidth,alt={...}]{...}``
for raster figures, expecting LaTeX's tagged-PDF machinery to put the alt
text on a ``/Figure`` structure element that wraps the image. It does emit
a ``/Figure`` StructElem with ``/Alt``, but — because of an interaction
between PreTeXt's ``\\begin{image}`` environment and LaTeX's
``\\includegraphics`` tagging hooks — that ``/Figure`` ends up dangling.
It has ``/K`` pointing at unrelated text marked content, and the actual
image marked content (with the ``Do`` operator that draws the JPG/PNG)
is wrapped by a sibling ``/S /text`` StructElem with no ``/Alt``.

When Panorama walks the visual layer, it finds an image, looks up the
structure element that wraps it via the ParentTree, gets a ``/text`` with
no ``/Alt``, and reports "The item does not have an alternative text
description."

The fix
-------
For each raster figure:

1. Find the dangling ``/S /Figure`` StructElem that carries the ``/Alt``.
2. Find the ``/S /text`` StructElem that actually owns the image's
   marked-content reference (by locating the page+MCID of the ``/Figure``
   BDC sequence and walking the structure tree to find which StructElem's
   ``/K`` matches).
3. Move the role and accessibility metadata from (1) to (2): change /S
   to /Figure, copy /Alt, mirror it into /ActualText, drop /NS so any
   PDF/UA-1 validator can read it.
4. Neutralise the dangling StructElem from (1) by stripping its /Alt and
   converting it to /Span, so it doesn't show up as a Figure-without-image
   in validators.

Source order matches page order in the PreTeXt build, so the N-th orphan
/Figure StructElem in tree order pairs with the N-th image-bearing
``/Figure`` BDC in page order.

Usage
-----
After ``pretext build print``::

    python scripts/postbuild_fix_figure_namespace.py output/print/umw-logic.pdf

Run with no argument to use the default output path.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Optional

import pikepdf
from pikepdf import Array, Dictionary, Name, String

DEFAULT_PDF = Path(__file__).resolve().parent.parent / "output" / "print" / "umw-logic.pdf"

FIGURE_BDC_RE = re.compile(rb"/Figure\s*<<\s*/MCID\s+(\d+)\s*>>\s*BDC")
DO_RE = re.compile(rb"/(\w+)\s+Do\b")


def _children(node: Dictionary) -> list:
    k = node.get("/K")
    if k is None:
        return []
    if isinstance(k, Array):
        return [kk for kk in k]
    return [k]


def _collect_orphan_figure_alts(struct_root: Dictionary) -> list[tuple[Dictionary, str]]:
    """Return [(struct_elem, alt_text), ...] for every /S /Figure StructElem
    that has /Alt, in document tree order."""
    out: list[tuple[Dictionary, str]] = []

    def walk(node):
        if not isinstance(node, Dictionary):
            return
        if (
            node.get("/Type") == Name("/StructElem")
            and node.get("/S") == Name("/Figure")
            and node.get("/Alt") is not None
        ):
            out.append((node, str(node["/Alt"])))
        for kid in _children(node):
            walk(kid)

    walk(struct_root.get("/K"))
    return out


def _find_image_bearing_marked_content(pdf: pikepdf.Pdf) -> list[tuple[Dictionary, int]]:
    """Return [(page, mcid), ...] for every BDC marked-content tagged
    `/Figure` that draws at least one Image XObject inside it, in page order.
    """
    out: list[tuple[Dictionary, int]] = []
    for page in pdf.pages:
        content = page.get("/Contents")
        if content is None:
            continue
        streams = content if isinstance(content, Array) else [content]
        raw = b"".join(s.read_bytes() for s in streams)
        resources = page.get("/Resources") or {}
        xobjs = resources.get("/XObject") or {}
        # Walk each /Figure BDC ... EMC region and check for image Do ops
        for m in FIGURE_BDC_RE.finditer(raw):
            mcid = int(m.group(1))
            bdc_end = m.end()
            emc = raw.find(b"EMC", bdc_end)
            if emc < 0:
                continue
            region = raw[bdc_end:emc]
            for dm in DO_RE.finditer(region):
                name = "/" + dm.group(1).decode("latin-1")
                try:
                    xo = xobjs[name]
                except Exception:
                    continue
                if xo.get("/Subtype") == Name("/Image"):
                    out.append((page, mcid))
                    break  # one image per Figure is enough to qualify
    return out


def _find_struct_elem_for_mcr(struct_root: Dictionary, page: Dictionary, mcid: int) -> Optional[Dictionary]:
    """Walk the full structure tree and find the StructElem whose direct /K
    is an MCR pointing at (page, mcid). (Going top-down rather than via the
    ParentTree because the ParentTree appears inconsistent in this PDF.)"""

    def walk(node):
        if not isinstance(node, Dictionary):
            return None
        if node.get("/Type") == Name("/StructElem"):
            for kid in _children(node):
                if (
                    isinstance(kid, Dictionary)
                    and kid.get("/Type") == Name("/MCR")
                    and kid.get("/Pg") is not None
                    and kid.get("/MCID") is not None
                    and kid["/Pg"].objgen == page.objgen
                    and int(kid["/MCID"]) == mcid
                ):
                    return node
        for kid in _children(node):
            found = walk(kid)
            if found is not None:
                return found
        return None

    return walk(struct_root.get("/K"))


def fix(pdf_path: Path) -> tuple[int, list[str]]:
    pdf = pikepdf.open(pdf_path, allow_overwriting_input=True)
    st = pdf.Root.get("/StructTreeRoot")
    if st is None:
        raise SystemExit(f"{pdf_path}: no /StructTreeRoot — is the PDF tagged?")

    orphans = _collect_orphan_figure_alts(st)
    image_mcrs = _find_image_bearing_marked_content(pdf)

    log: list[str] = []
    log.append(f"orphan /Figure StructElems with /Alt: {len(orphans)}")
    log.append(f"image-bearing /Figure BDC marked contents: {len(image_mcrs)}")

    if len(orphans) != len(image_mcrs):
        log.append("WARNING: counts differ — pairing will be best-effort up to min().")

    fixed = 0
    for (orphan, alt_text), (page, mcid) in zip(orphans, image_mcrs):
        carrier = _find_struct_elem_for_mcr(st, page, mcid)
        if carrier is None:
            log.append(f"  could not find structural carrier for image at page MCID={mcid}")
            continue
        # Promote the carrier to be a real /Figure with the alt text.
        carrier["/S"] = Name("/Figure")
        carrier["/Alt"] = String(alt_text)
        carrier["/ActualText"] = String(alt_text)
        # Drop /NS so it lives in the default PDF 1.7 namespace any legacy
        # validator understands.
        if "/NS" in carrier:
            del carrier["/NS"]
        # Neutralise the orphan /Figure StructElem so we don't have an
        # alt-text-bearing Figure that wraps nothing.
        orphan["/S"] = Name("/Span")
        for k in ("/Alt", "/ActualText"):
            if k in orphan:
                del orphan[k]
        log.append(
            f"  alt {alt_text[:50]!r} -> carrier StructElem objgen={carrier.objgen}"
        )
        fixed += 1

    pdf.save(pdf_path)
    return fixed, log


def main(argv: list[str]) -> int:
    pdf_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_PDF
    if not pdf_path.exists():
        print(f"error: {pdf_path} does not exist", file=sys.stderr)
        return 1
    fixed, log = fix(pdf_path)
    for line in log:
        print(line)
    print(f"transplanted /Alt onto {fixed} structural figure(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
