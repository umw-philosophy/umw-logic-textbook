#!/usr/bin/env python3
"""Build a Canvas Common Cartridge for Chapter 1, version 2."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_imscc_v2"
PDF_SOURCE = ROOT / "book" / "output" / "print" / "umw-logic.pdf"
PDF_TARGET = BUILD / "files" / "umw-logic.pdf"
IMSCC_TARGET = CANVAS / "chapter1-v2.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZZES = [
    {
        "slug": "quiz1",
        "title": "Chapter 1 Quiz 1: Language Uses",
        "due": "2026-05-18T03:59:00Z",
        "description": "Autograded practice for Chapter 1, Section 1.1. Due May 17.",
        "questions": [
            (
                "What is the main thing the speaker is doing? <br><br><em>Please close the classroom door.</em>",
                ["Commanding or requesting", "Stating", "Arguing", "Explaining"],
                0,
            ),
            (
                "What is the main thing the speaker is doing? <br><br><em>The library closes at midnight during exams.</em>",
                ["Stating", "Greeting", "Promising", "Commanding"],
                0,
            ),
            (
                "In the textbook's special sense, an argument is best understood as:",
                [
                    "an offering of reasons in support of a claim",
                    "a disagreement between two people",
                    "any attempt to persuade an audience",
                    "a sentence that expresses emotion",
                ],
                0,
            ),
            (
                "A commercial shows famous athletes drinking a sports drink but gives no reasons for buying it. This is best described as:",
                ["persuasion without argument", "deductive argument", "standard form", "a statement"],
                0,
            ),
            (
                "Which sentence is most clearly an argument?",
                [
                    "You should bring an umbrella because the forecast calls for storms.",
                    "Could you bring an umbrella?",
                    "Umbrellas are often stored near the door.",
                    "Wow, that umbrella is enormous.",
                ],
                0,
            ),
        ],
    },
    {
        "slug": "quiz2",
        "title": "Chapter 1 Quiz 2: Statements",
        "due": "2026-05-18T03:59:00Z",
        "description": "Autograded practice for Chapter 1, Section 1.2. Due May 17.",
        "questions": [
            (
                "Which of the following is a statement in the logical sense?",
                ["The exam begins at 9:00.", "Please open the window.", "How late is the library open?", "Good morning!"],
                0,
            ),
            (
                "Why do logicians care about statements?",
                [
                    "Statements are the kinds of claims that can be true or false.",
                    "Statements are always persuasive.",
                    "Statements are always commands.",
                    "Statements never appear inside arguments.",
                ],
                0,
            ),
            (
                "Which sentence is not a statement?",
                ["Take the quiz before midnight.", "Fredericksburg is in Virginia.", "Some dogs are mammals.", "The classroom has windows."],
                0,
            ),
            (
                "A sentence can be grammatically declarative but still fail to be a useful logical statement when:",
                [
                    "it is too vague or context-dependent to evaluate clearly",
                    "it contains more than five words",
                    "it appears in a paragraph",
                    "it is written in English",
                ],
                0,
            ),
            (
                "Which choice best explains the relation between sentences and statements?",
                [
                    "A sentence is a piece of language; a statement is a claim that can be true or false.",
                    "Every sentence is automatically a statement.",
                    "Statements are questions with punctuation removed.",
                    "Sentences can be true or false, but statements cannot.",
                ],
                0,
            ),
        ],
    },
    {
        "slug": "quiz3",
        "title": "Chapter 1 Quiz 3: Premises and Conclusions",
        "due": "2026-05-19T03:59:00Z",
        "description": "Autograded practice for Chapter 1, Section 1.3. Due May 18.",
        "questions": [
            (
                "Identify the conclusion: <br><br><em>The sidewalks are wet because it rained overnight.</em>",
                ["The sidewalks are wet.", "It rained overnight.", "Because", "There is no argument here."],
                0,
            ),
            (
                "Which word or phrase is commonly a premise indicator?",
                ["since", "therefore", "so", "it follows that"],
                0,
            ),
            (
                "Which word or phrase is commonly a conclusion indicator?",
                ["therefore", "because", "given that", "for the reason that"],
                0,
            ),
            (
                "In standard form, premises are normally labeled as:",
                ["P1, P2, P3, ...", "C1, C2, C3, ...", "A, E, I, O", "T and F only"],
                0,
            ),
            (
                "In the conditional statement <em>If the battery is dead, then the car will not start</em>, what is the consequent?",
                [
                    "the car will not start",
                    "the battery is dead",
                    "if",
                    "the whole conditional is the consequent",
                ],
                0,
            ),
        ],
    },
    {
        "slug": "quiz4",
        "title": "Chapter 1 Quiz 4: Recognizing Arguments",
        "due": "2026-05-19T03:59:00Z",
        "description": "Autograded practice for Chapter 1, Section 1.4. Due May 18.",
        "questions": [
            (
                "Argument or explanation? <br><br><em>The road is closed because a water main broke downtown.</em>",
                ["Explanation", "Argument", "Neither", "Both, because all uses of 'because' are arguments"],
                0,
            ),
            (
                "Argument or explanation? <br><br><em>You should avoid Route 3 because a water main broke downtown and traffic is backed up for miles.</em>",
                ["Argument", "Explanation", "Greeting", "Promise"],
                0,
            ),
            (
                "When a passage contains no indicator words, the best strategy is to:",
                [
                    "ask which claim the other claims are meant to support",
                    "assume it is not an argument",
                    "treat the first sentence as the conclusion every time",
                    "ignore the passage",
                ],
                0,
            ),
            (
                "A sub-conclusion is:",
                [
                    "a claim supported by earlier premises that also supports a later conclusion",
                    "a premise that is false",
                    "a question inside an argument",
                    "a conclusion that has no support",
                ],
                0,
            ),
            (
                "Which reconstruction best fits this argument? <br><br><em>If the server is down, students cannot submit the quiz. The server is down. So students cannot submit the quiz.</em>",
                [
                    "P1: If the server is down, students cannot submit the quiz. P2: The server is down. C: Students cannot submit the quiz.",
                    "P1: Students cannot submit the quiz. C: The server is down.",
                    "P1: The server is down. P2: Students can submit the quiz. C: No argument.",
                    "P1: If students cannot submit the quiz, the server is down. C: The server is down.",
                ],
                0,
            ),
        ],
    },
]


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def page(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{html.escape(title)}</title>
  <style>
    body {{ font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; color: #1f2937; }}
    main {{ max-width: 820px; margin: 0 auto; padding: 1.5rem; }}
    h1 {{ color: #1f3a60; }}
    h2 {{ color: #1f3a60; margin-top: 1.5rem; }}
    .callout {{ border-left: 4px solid #1f3a60; background: #f5f7fb; padding: 1rem; margin: 1rem 0; }}
    a {{ color: #174ea6; }}
  </style>
</head>
<body>
<main>
{body}
</main>
</body>
</html>
"""


def build_pages() -> None:
    overview = """
<h1>Module 1: Chapter 1 - What Is an Argument?</h1>
<div class="callout">
  <p><strong>Exam 1 unit.</strong> This short module should take Day 1 and part of Day 2 of the five-week course.</p>
</div>
<h2>Module Schedule</h2>
<ul>
  <li><strong>May 17:</strong> Read Chapter 1, Sections 1.1 and 1.2. Complete Quizzes 1 and 2.</li>
  <li><strong>May 18:</strong> Read Chapter 1, Sections 1.3 and 1.4. Complete Quizzes 3 and 4.</li>
</ul>
<p><a href="../files/umw-logic.pdf">Open the textbook PDF</a>.</p>
"""
    day1 = """
<h1>Reading for May 17: Chapter 1, Sections 1.1 and 1.2</h1>
<p>Read Chapter 1, Sections 1.1 and 1.2 in the textbook PDF.</p>
<p><a href="../files/umw-logic.pdf">Open the textbook PDF</a>.</p>
<h2>Focus</h2>
<ul>
  <li>Different things people do with language.</li>
  <li>The special logical sense of <em>argument</em>.</li>
  <li>The difference between arguing and persuading.</li>
  <li>What statements are and why logic begins with them.</li>
</ul>
<h2>Due May 17</h2>
<ul>
  <li>Chapter 1 Quiz 1: Language Uses</li>
  <li>Chapter 1 Quiz 2: Statements</li>
</ul>
"""
    day2 = """
<h1>Reading for May 18: Chapter 1, Sections 1.3 and 1.4</h1>
<p>Read Chapter 1, Sections 1.3 and 1.4 in the textbook PDF.</p>
<p><a href="../files/umw-logic.pdf">Open the textbook PDF</a>.</p>
<h2>Focus</h2>
<ul>
  <li>Premises, conclusions, and indicator words.</li>
  <li>Standard form.</li>
  <li>Conditional statements, antecedents, and consequents.</li>
  <li>Recognizing arguments in ordinary prose.</li>
  <li>Distinguishing arguments from explanations.</li>
</ul>
<h2>Due May 18</h2>
<ul>
  <li>Chapter 1 Quiz 3: Premises and Conclusions</li>
  <li>Chapter 1 Quiz 4: Recognizing Arguments</li>
</ul>
"""
    write(BUILD / "overview" / "page.html", page("Module 1: Chapter 1", overview))
    write(BUILD / "may17-reading" / "page.html", page("Reading for May 17", day1))
    write(BUILD / "may18-reading" / "page.html", page("Reading for May 18", day2))


def qti_for_quiz(quiz: dict, idx: int) -> str:
    assessment_id = quiz["assessment_id"]
    items = []
    for q_idx, (prompt, choices, correct) in enumerate(quiz["questions"], start=1):
        choice_xml = []
        for c_idx, choice in enumerate(choices):
            ident = f"q{idx}_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/plain">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q{idx}_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q{idx}_{q_idx}" title="Question {q_idx}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield>
            <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1</fieldentry></qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material><mattext texttype="text/html">{html.escape('<div>' + prompt + '</div>')}</mattext></material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>{''.join(choice_xml)}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
          <respcondition continue="No">
            <conditionvar><varequal respident="response1">{correct_ident}</varequal></conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>""")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="{assessment_id}" title="{html.escape(quiz['title'])}">
    <qtimetadata>
      <qtimetadatafield><fieldlabel>cc_maxattempts</fieldlabel><fieldentry>unlimited</fieldentry></qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
{''.join(items)}
    </section>
  </assessment>
</questestinterop>
"""


def meta_for_quiz(quiz: dict) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<quiz xmlns="http://canvas.instructure.com/xsd/cccv1p0" identifier="{quiz['assessment_id']}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 http://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>{html.escape(quiz['title'])}</title>
  <description>&lt;p&gt;{html.escape(quiz['description'])}&lt;/p&gt;</description>
  <quiz_type>assignment</quiz_type>
  <points_possible>5</points_possible>
  <due_at>{quiz['due']}</due_at>
  <published>true</published>
</quiz>
"""


def build_quizzes() -> None:
    for idx, quiz in enumerate(QUIZZES, start=1):
        quiz["assessment_id"] = uid("assessment")
        # Canvas is picky here: the manifest resource identifier, the
        # assessment identifier, and the quiz metadata identifier need to
        # describe the same assessment or Canvas may import an empty shell.
        quiz["res_id"] = quiz["assessment_id"]
        quiz["meta_res_id"] = f"{quiz['assessment_id']}_meta"
        quiz["item_id"] = uid("item_quiz")
        write(BUILD / quiz["slug"] / "assessment_qti.xml", qti_for_quiz(quiz, idx))
        write(BUILD / quiz["slug"] / "assessment_meta.xml", meta_for_quiz(quiz))


def build_manifest() -> None:
    pages = {
        "overview": ("Module 1 Overview", uid("res_page"), uid("item_page")),
        "may17-reading": ("May 17 Reading: Sections 1.1 and 1.2", uid("res_page"), uid("item_page")),
        "may18-reading": ("May 18 Reading: Sections 1.3 and 1.4", uid("res_page"), uid("item_page")),
    }
    ordered_items = [
        ("page", "overview"),
        ("file", "pdf"),
        ("page", "may17-reading"),
        ("quiz", 0),
        ("quiz", 1),
        ("page", "may18-reading"),
        ("quiz", 2),
        ("quiz", 3),
    ]
    items = []
    for kind, key in ordered_items:
        if kind == "page":
            title, res_id, item_id = pages[key]
            items.append(f'        <item identifier="{item_id}" identifierref="{res_id}"><title>{title}</title></item>')
        elif kind == "file":
            items.append('        <item identifier="item_file_ch1_pdf" identifierref="res_file_ch1_pdf"><title>Textbook PDF: Chapter 1 Reading</title></item>')
        else:
            quiz = QUIZZES[key]
            items.append(f'        <item identifier="{quiz["item_id"]}" identifierref="{quiz["res_id"]}"><title>{html.escape(quiz["title"])}</title></item>')

    resources = [
        f'    <resource identifier="{res_id}" type="webcontent" href="{slug}/page.html"><file href="{slug}/page.html"/></resource>'
        for slug, (_title, res_id, _item_id) in pages.items()
    ]
    resources.append('    <resource identifier="res_file_ch1_pdf" type="webcontent" href="files/umw-logic.pdf"><file href="files/umw-logic.pdf"/></resource>')
    for quiz in QUIZZES:
        resources.append(
            f'''    <resource identifier="{quiz["res_id"]}" type="imsqti_xmlv1p2" href="{quiz["slug"]}/assessment_qti.xml">
      <file href="{quiz["slug"]}/assessment_qti.xml"/>
      <dependency identifierref="{quiz["meta_res_id"]}"/>
    </resource>
    <resource identifier="{quiz["meta_res_id"]}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="{quiz["slug"]}/assessment_meta.xml">
      <file href="{quiz["slug"]}/assessment_meta.xml"/>
    </resource>'''
        )

    manifest = f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" identifier="{uid('manifest')}" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="{uid('org')}" structure="rooted-hierarchy">
      <item identifier="{uid('module')}">
        <title>Module 1: Chapter 1 - What Is an Argument? (V2)</title>
{chr(10).join(items)}
      </item>
    </organization>
  </organizations>
  <resources>
{chr(10).join(resources)}
  </resources>
</manifest>
"""
    write(BUILD / "imsmanifest.xml", manifest)


def package() -> None:
    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)
    if not PDF_SOURCE.exists():
        raise FileNotFoundError(f"Expected PDF at {PDF_SOURCE}")
    build_pages()
    build_quizzes()
    PDF_TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PDF_SOURCE, PDF_TARGET)
    build_manifest()
    if IMSCC_TARGET.exists():
        IMSCC_TARGET.unlink()
    with zipfile.ZipFile(IMSCC_TARGET, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(BUILD.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(BUILD).as_posix())


if __name__ == "__main__":
    package()
    print(f"Built {IMSCC_TARGET}")
