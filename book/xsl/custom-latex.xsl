<?xml version="1.0" encoding="UTF-8"?>
<!--
  Custom LaTeX stylesheet for the UMW Logic Textbook.

  Purpose: render <term> elements as plain prose, not italics, and tune
  the default PDF styling for pedagogical blocks.
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

    2. definitionstyle and examplestyle: keep the title visually
       separate from the body and suppress the end-of-block tombstones.
  -->
  <xsl:param name="latex.preamble.late">
\renewcommand{\terminology}[1]{#1}
\tcbset{definitionstyle/.style={bwminimalstyle, blockspacingstyle, fonttitle=\blocktitlefont\bfseries, bottomtitle=0.8ex, before upper app={\setparstyle}}}
\tcbset{examplestyle/.style={bwminimalstyle, blockspacingstyle, fonttitle=\blocktitlefont\bfseries, bottomtitle=0.8ex, before upper app={\setparstyle}}}
  </xsl:param>

  <!--
    Accessibility experiment promoted to the production print build:
    LaTeX's tagged-PDF machinery must be enabled before \documentclass,
    which is earlier than PreTeXt's latex.preamble.early hook. This book
    template mirrors the upstream PreTeXt book template and adds only the
    \DocumentMetadata line. The generated PDF should then expose a PDF
    structure tree instead of relying only on visual layout.
  -->
  <xsl:template match="book">
    <xsl:call-template name="converter-blurb-latex" />
    <xsl:call-template name="snapshot-package-info"/>
    <xsl:text>\DocumentMetadata{testphase={phase-III,math},pdfstandard=ua-2,lang=en-US}&#xa;</xsl:text>
    <xsl:text>\documentclass[</xsl:text>
    <xsl:call-template name="sidedness"/>
    <xsl:text>,</xsl:text>
    <xsl:value-of select="$font-size" />
    <xsl:text>,</xsl:text>
    <xsl:if test="$b-latex-draft-mode" >
      <xsl:text>draft,</xsl:text>
    </xsl:if>
    <xsl:text>]{</xsl:text>
    <xsl:value-of select="$document-class-prefix" />
    <xsl:text>book}&#xa;</xsl:text>
    <xsl:call-template name="latex-preamble" />
    <xsl:text>\begin{document}&#xa;</xsl:text>
    <xsl:call-template name="text-alignment"/>
    <xsl:call-template name="front-cover"/>
    <xsl:apply-templates select="*"/>
    <xsl:call-template name="back-cover"/>
    <xsl:text>\end{document}&#xa;</xsl:text>
  </xsl:template>

</xsl:stylesheet>
