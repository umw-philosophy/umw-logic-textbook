<?xml version="1.0" encoding="UTF-8"?>
<!--
  Custom LaTeX stylesheet for the UMW Logic Textbook.

  Purpose: render <term> elements as plain prose, not italics.
  Source still uses <term> for first-introduction tagging (so the
  index, cross-references, and future tooling work). The styling
  override here just suppresses the italic in PDF output.

  See PROJECT_PLAN.md decision: terms are tagged for structure but
  not visually emphasized, because the course does not test on
  vocabulary memorization.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

  <xsl:import href="./core/pretext-latex.xsl"/>

  <!--
    Custom LaTeX overrides for the UMW Logic textbook:

    1. \terminology: render <term> as plain prose (not italic).
       PreTeXt default is \newcommand{\terminology}[1]{\textit{#1}}.

    2. \ptxdiamond: suppress the end-of-definition marker (◇).
       PreTeXt's default tcolorbox style for <definition> appends a
       Zapf Dingbat diamond (\ding{117}) after the upper content.
       Renewing \ptxdiamond to empty removes the marker for
       definitions while leaving other tombstones (\ptxsquare for
       theorems, \ptxtriangle for examples) untouched.
  -->
  <xsl:param name="latex.preamble.late">
\renewcommand{\terminology}[1]{#1}
\renewcommand{\ptxdiamond}{}
  </xsl:param>

</xsl:stylesheet>
