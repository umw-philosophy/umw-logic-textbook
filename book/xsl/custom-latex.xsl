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
    Tagged-PDF table hygiene:

    PreTeXt's <tabular> is used both for actual data tables and for
    display layouts such as proof schemas.  With LaTeX's tagged-PDF
    machinery active, every LaTeX tabular is otherwise exposed as a
    semantic PDF Table.  Accessibility checkers then report "table has
    no header" for proof layouts that are not really data tables.

    If the source tabular has an explicit header row (or row headers),
    pass that header information through to LaTeX's table tagging.
    Otherwise, tag the tabular as a Div so the text remains available
    without pretending the display is a data table.
  -->
  <xsl:template match="tabular[row[@header] or @row-headers = 'yes']">
    <xsl:text>\tagpdfsetup{</xsl:text>
    <xsl:if test="row[@header]">
      <xsl:text>table/header-rows={</xsl:text>
      <xsl:call-template name="integer-list">
        <xsl:with-param name="start" select="1"/>
        <xsl:with-param name="finish" select="count(row[@header])"/>
      </xsl:call-template>
      <xsl:text>}</xsl:text>
    </xsl:if>
    <xsl:if test="row[@header] and @row-headers = 'yes'">
      <xsl:text>,</xsl:text>
    </xsl:if>
    <xsl:if test="@row-headers = 'yes'">
      <xsl:text>table/header-columns={1}</xsl:text>
    </xsl:if>
    <xsl:text>}&#xa;</xsl:text>
    <xsl:apply-imports/>
    <xsl:text>\tagpdfsetup{table/header-rows={},table/header-columns={}}&#xa;</xsl:text>
  </xsl:template>

  <xsl:template match="tabular[not(row[@header] or @row-headers = 'yes')]">
    <xsl:text>\tagpdfsetup{table/tagging=div}&#xa;</xsl:text>
    <xsl:apply-imports/>
    <xsl:text>\tagpdfsetup{table/tagging=true}&#xa;</xsl:text>
  </xsl:template>

  <xsl:template name="integer-list">
    <xsl:param name="start"/>
    <xsl:param name="finish"/>
    <xsl:if test="$start &lt;= $finish">
      <xsl:value-of select="$start"/>
      <xsl:if test="$start &lt; $finish">
        <xsl:text>,</xsl:text>
        <xsl:call-template name="integer-list">
          <xsl:with-param name="start" select="$start + 1"/>
          <xsl:with-param name="finish" select="$finish"/>
        </xsl:call-template>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!--
    PreTeXt emits image descriptions for accessible HTML, but this
    tagged-PDF build also needs a short /Alt entry on the graphic
    itself.  LaTeX's graphics tagging support reads the "alt" option on
    \includegraphics, so pass PreTeXt <shortdescription> through when it
    is present.  Long <description> content stays in the source for
    readers who need fuller context.
  -->
  <xsl:template match="image[@source][shortdescription]" mode="image-inclusion">
    <xsl:variable name="extension">
      <xsl:call-template name="file-extension">
        <xsl:with-param name="filename" select="@source"/>
      </xsl:call-template>
    </xsl:variable>
    <xsl:text>\includegraphics[width=\linewidth,alt={</xsl:text>
    <xsl:apply-templates select="shortdescription"/>
    <xsl:text>}</xsl:text>
    <xsl:if test="@rotate">
      <xsl:text>,angle=</xsl:text>
      <xsl:value-of select="@rotate"/>
      <xsl:text>,origin=c</xsl:text>
    </xsl:if>
    <xsl:text>]{</xsl:text>
    <xsl:value-of select="$external-directory"/>
    <xsl:value-of select="@source"/>
    <xsl:if test="$extension = ''">
      <xsl:text>.pdf</xsl:text>
    </xsl:if>
    <xsl:text>}&#xa;</xsl:text>
  </xsl:template>

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

  <!--
    The appendix reference sheet needs a handout-style print layout:
    all eighteen rule names and schemas on one page, without the
    explanatory material or side-by-side wrapping used in the source.
  -->
  <xsl:template match="section[@xml:id='sec-appendix-rules-reference-sheet']">
    <xsl:text>\clearpage
\newgeometry{margin=0.5in}
\thispagestyle{empty}
\phantomsection
\addcontentsline{toc}{section}{Reference Sheet: All Eighteen Rules}
\begingroup
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\renewcommand{\arraystretch}{0.9}
\newcommand{\sheetneg}{\text{\textasciitilde}}
\newcommand{\impblock}[2]{\begin{minipage}[t]{0.43\linewidth}\centering{\normalsize\bfseries #1}\par\vspace{0.2ex}{\normalsize #2\par}\end{minipage}}
\newcommand{\replblock}[2]{\begin{minipage}[t]{0.48\linewidth}\centering{\normalsize\bfseries #1}\par\vspace{0.2ex}{\normalsize #2\par}\end{minipage}}
\begin{center}
{\Large\bfseries The Eighteen Rules of Inference}
\end{center}
\vspace{0.12in}
\begin{center}{\large\bfseries Implication Rules}\end{center}
\vspace{0.08in}
\noindent\impblock{MP (Modus Ponens)}{\(\begin{array}{@{}c@{}}\mathcal{A}\supset\mathcal{B}\\ \mathcal{A}\\ \hline \mathcal{B}\end{array}\)}\hfill\impblock{MT (Modus Tollens)}{\(\begin{array}{@{}c@{}}\mathcal{A}\supset\mathcal{B}\\ \sheetneg\mathcal{B}\\ \hline \sheetneg\mathcal{A}\end{array}\)}\par
\vspace{0.24in}
\noindent\impblock{HS (Hypothetical Syllogism)}{\(\begin{array}{@{}c@{}}\mathcal{A}\supset\mathcal{B}\\ \mathcal{B}\supset\mathcal{C}\\ \hline \mathcal{A}\supset\mathcal{C}\end{array}\)}\hfill\impblock{DS (Disjunctive Syllogism)}{\(\begin{array}{@{}c@{}}\mathcal{A}\lor\mathcal{B}\\ \sheetneg\mathcal{A}\\ \hline \mathcal{B}\end{array}\)}\par
\vspace{0.24in}
\noindent\impblock{Conj (Conjunction)}{\(\begin{array}{@{}c@{}}\mathcal{A}\\ \mathcal{B}\\ \hline \mathcal{A}\cdot\mathcal{B}\end{array}\)}\hfill\impblock{Simp (Simplification)}{\(\begin{array}{@{}c@{}}\mathcal{A}\cdot\mathcal{B}\\ \hline \mathcal{A}\end{array}\)}\par
\vspace{0.24in}
\noindent\impblock{Add (Addition)}{\(\begin{array}{@{}c@{}}\mathcal{A}\\ \hline \mathcal{A}\lor\mathcal{B}\end{array}\)}\hfill\impblock{CD (Constructive Dilemma)}{\(\begin{array}{@{}c@{}}\mathcal{A}\supset\mathcal{B}\\ \mathcal{C}\supset\mathcal{D}\\ \mathcal{A}\lor\mathcal{C}\\ \hline \mathcal{B}\lor\mathcal{D}\end{array}\)}\par
\vspace{0.30in}
\begin{center}{\large\bfseries Replacement Rules}\end{center}
\vspace{0.08in}
\noindent\hspace*{0.02\linewidth}\begin{minipage}{0.96\linewidth}
\noindent\replblock{DeM (De Morgan's)}{\(\begin{array}{@{}l@{}}\sheetneg(\mathcal{A}\cdot\mathcal{B})\mathrel{::}\sheetneg\mathcal{A}\lor\sheetneg\mathcal{B}\\ \sheetneg(\mathcal{A}\lor\mathcal{B})\mathrel{::}\sheetneg\mathcal{A}\cdot\sheetneg\mathcal{B}\end{array}\)}\hfill\replblock{DN (Double Negation)}{\(\mathcal{A}\mathrel{::}\sheetneg\sheetneg\mathcal{A}\)}\par
\vspace{0.26in}
\noindent\replblock{Com (Commutation)}{\(\begin{array}{@{}l@{}}\mathcal{A}\cdot\mathcal{B}\mathrel{::}\mathcal{B}\cdot\mathcal{A}\\ \mathcal{A}\lor\mathcal{B}\mathrel{::}\mathcal{B}\lor\mathcal{A}\end{array}\)}\hfill\replblock{Assoc (Association)}{\(\begin{array}{@{}l@{}}\mathcal{A}\cdot(\mathcal{B}\cdot\mathcal{C})\mathrel{::}(\mathcal{A}\cdot\mathcal{B})\cdot\mathcal{C}\\ \mathcal{A}\lor(\mathcal{B}\lor\mathcal{C})\mathrel{::}(\mathcal{A}\lor\mathcal{B})\lor\mathcal{C}\end{array}\)}\par
\vspace{0.26in}
\noindent\replblock{Dist (Distribution)}{\(\begin{array}{@{}l@{}}\mathcal{A}\cdot(\mathcal{B}\lor\mathcal{C})\mathrel{::}(\mathcal{A}\cdot\mathcal{B})\lor(\mathcal{A}\cdot\mathcal{C})\\ \mathcal{A}\lor(\mathcal{B}\cdot\mathcal{C})\mathrel{::}(\mathcal{A}\lor\mathcal{B})\cdot(\mathcal{A}\lor\mathcal{C})\end{array}\)}\hfill\replblock{Impl (Material Implication)}{\(\mathcal{A}\supset\mathcal{B}\mathrel{::}\sheetneg\mathcal{A}\lor\mathcal{B}\)}\par
\vspace{0.26in}
\noindent\replblock{Trans (Transposition)}{\(\mathcal{A}\supset\mathcal{B}\mathrel{::}\sheetneg\mathcal{B}\supset\sheetneg\mathcal{A}\)}\hfill\replblock{Exp (Exportation)}{\((\mathcal{A}\cdot\mathcal{B})\supset\mathcal{C}\mathrel{::}\mathcal{A}\supset(\mathcal{B}\supset\mathcal{C})\)}\par
\vspace{0.26in}
\noindent\replblock{Equiv (Material Equivalence)}{\(\begin{array}{@{}l@{}}\mathcal{A}\equiv\mathcal{B}\mathrel{::}(\mathcal{A}\supset\mathcal{B})\cdot(\mathcal{B}\supset\mathcal{A})\\ \mathcal{A}\equiv\mathcal{B}\mathrel{::}(\mathcal{A}\cdot\mathcal{B})\lor(\sheetneg\mathcal{A}\cdot\sheetneg\mathcal{B})\end{array}\)}\hfill\replblock{Taut (Tautology)}{\(\begin{array}{@{}l@{}}\mathcal{A}\mathrel{::}\mathcal{A}\cdot\mathcal{A}\\ \mathcal{A}\mathrel{::}\mathcal{A}\lor\mathcal{A}\end{array}\)}\par
\end{minipage}
\endgroup
\restoregeometry
\clearpage
</xsl:text>
  </xsl:template>

</xsl:stylesheet>
