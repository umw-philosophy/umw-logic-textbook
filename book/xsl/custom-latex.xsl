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
    Redefine \terminology to be the identity (no italic).
    The default in PreTeXt's preamble is \newcommand{\terminology}[1]{\textit{#1}}.
    This \renewcommand fires after that, in the late preamble.
  -->
  <xsl:param name="latex.preamble.late">
\renewcommand{\terminology}[1]{#1}
  </xsl:param>

</xsl:stylesheet>
