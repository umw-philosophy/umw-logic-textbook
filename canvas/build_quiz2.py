#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 2: Statements and Language Uses (Application)."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz2_temp"
IMSCC_TARGET = CANVAS / "quiz2statement_language.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz2statement_language",
    "title": "Quiz 2: Statements and Language Uses",
    "due": "2026-05-18T23:59:00Z",
    "description": "Autograded multiple-choice quiz applying Chapter 1 concepts to actual passages. Due May 18th.",
    "questions": [
        # Question 1
        (
            "Read the following passage and identify what the speaker is primarily doing with language:<br><br>"
            "<em>\"Please make sure to log out of the library computers before leaving the lab.\"</em>",
            [
                "Commanding or requesting",
                "Stating an assertoric claim that is true or false",
                "Making an argument by offering premises for a conclusion",
                "Explaining why a past event occurred",
            ],
            0,  # Correct answer index
        ),
        # Question 2
        (
            "Read the following passage and identify what the speaker is primarily doing with language:<br><br>"
            "<em>\"I apologize for the delay in grading your midterms; the grades will be posted by Friday afternoon.\"</em>",
            [
                "Performing an action (apologizing) and making a promise",
                "Asking a question to gather information",
                "Making a deductive argument with guaranteed support",
                "Giving an explanation for why the midterm was difficult",
            ],
            0,
        ),
        # Question 3
        (
            "Read the following passage and decide whether it is an argument, an explanation, or a simple statement:<br><br>"
            "<em>\"The campus shuttle is running twenty minutes late today because a water main broke on College Avenue and blocked both lanes of traffic.\"</em>",
            [
                "An explanation (the speaker is showing <em>why</em> the shuttle is late, not trying to prove <em>that</em> it is late)",
                "An argument (the speaker is offering premises to convince you that water mains break frequently)",
                "A performative utterance that makes the shuttle arrive late",
                "A simple statement without any supporting reasons or causal claims",
            ],
            0,
        ),
        # Question 4
        (
            "Read the following passage and identify what the author is primarily doing:<br><br>"
            "<em>\"You should avoid taking the campus shuttle today. A water main broke on College Avenue, blocking both lanes of traffic, so the shuttle will be heavily delayed.\"</em>",
            [
                "Making an argument (offering reasons to support the conclusion that you should avoid the shuttle)",
                "Giving an explanation of how water mains are constructed",
                "Persuading without argument using purely emotional imagery",
                "Making a formal promise to repair the road",
            ],
            0,
        ),
        # Question 5
        (
            "Read the following passage and identify the primary language strategy being used:<br><br>"
            "<em>A university billboard shows smiling students throwing frisbees on a sunny green lawn with the slogan, \"Find Your Future Here.\" No statistics, academic details, or logical reasons are provided.</em>",
            [
                "Persuading without argument (using positive emotional association rather than offering logical premises)",
                "Making a deductive argument where the premises guarantee the conclusion",
                "Offering an explanation for why grass grows on campus",
                "Stating a truth-apt claim that can be evaluated using a truth table",
            ],
            0,
        ),
    ],
}


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def qti_for_quiz(quiz: dict) -> str:
    assessment_id = quiz["assessment_id"]
    items = []
    for q_idx, (prompt, choices, correct) in enumerate(quiz["questions"], start=1):
        choice_xml = []
        for c_idx, choice in enumerate(choices):
            ident = f"q2_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/plain">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q2_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q2_{q_idx}" title="Question {q_idx}">
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
    points = len(quiz["questions"])
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<quiz xmlns="http://canvas.instructure.com/xsd/cccv1p0" identifier="{quiz['assessment_id']}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 http://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>{html.escape(quiz['title'])}</title>
  <description>&lt;p&gt;{html.escape(quiz['description'])}&lt;/p&gt;</description>
  <quiz_type>assignment</quiz_type>
  <points_possible>{points}</points_possible>
  <due_at>{quiz['due']}</due_at>
  <published>true</published>
</quiz>
"""


def build_manifest(quiz: dict) -> str:
    items = f'        <item identifier="{quiz["item_id"]}" identifierref="{quiz["res_id"]}"><title>{html.escape(quiz["title"])}</title></item>'
    
    resources = f'''    <resource identifier="{quiz["res_id"]}" type="imsqti_xmlv1p2" href="{quiz["slug"]}/assessment_qti.xml">
      <file href="{quiz["slug"]}/assessment_qti.xml"/>
      <dependency identifierref="{quiz["meta_res_id"]}"/>
    </resource>
    <resource identifier="{quiz["meta_res_id"]}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="{quiz["slug"]}/assessment_meta.xml">
      <file href="{quiz["slug"]}/assessment_meta.xml"/>
    </resource>'''

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" identifier="{uid('manifest')}" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="{uid('org')}" structure="rooted-hierarchy">
      <item identifier="{uid('module')}">
        <title>Chapter 1 Quizzes</title>
{items}
      </item>
    </organization>
  </organizations>
  <resources>
{resources}
  </resources>
</manifest>
"""


def package() -> None:
    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)

    quiz = QUIZ
    quiz["assessment_id"] = uid("assessment")
    quiz["res_id"] = quiz["assessment_id"]
    quiz["meta_res_id"] = f"{quiz['assessment_id']}_meta"
    quiz["item_id"] = uid("item_quiz")

    write(BUILD / quiz["slug"] / "assessment_qti.xml", qti_for_quiz(quiz))
    write(BUILD / quiz["slug"] / "assessment_meta.xml", meta_for_quiz(quiz))
    write(BUILD / "imsmanifest.xml", build_manifest(quiz))

    if IMSCC_TARGET.exists():
        IMSCC_TARGET.unlink()

    with zipfile.ZipFile(IMSCC_TARGET, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(BUILD.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(BUILD).as_posix())

    # Clean up temp directory
    shutil.rmtree(BUILD)


if __name__ == "__main__":
    package()
    print(f"Successfully built {IMSCC_TARGET}")
