#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 10: Immediate Inferences."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz10_temp"
IMSCC_TARGET = CANVAS / "quiz10_immediate_inference.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz10_immediate_inference",
    "title": "Quiz 10: Immediate Inferences",
    "description": "Autograded multiple-choice quiz testing immediate inferences in categorical logic (Chapter 6). For each pair of statements, identify the operation performed and whether it is valid on the modern interpretation.",
    "questions": [
        # Question 1 (User's example: I to O -> no named immediate inference, invalid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: Some garbage trucks are noisy vehicles.<br>"
            "Conclusion: Some garbage trucks are not noisy vehicles.</em>",
            [
                "no named immediate inference, invalid",
                "obversion, valid",
                "denial of the contradictory, valid",
                "contraposition, invalid",
                "conversion, invalid",
            ],
            0,  # Correct answer index
        ),
        # Question 2 (Conversion of E -> conversion, valid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: No school board members are ridiculous clowns.<br>"
            "Conclusion: No ridiculous clowns are school board members.</em>",
            [
                "conversion, valid",
                "conversion, invalid",
                "contraposition, invalid",
                "obversion, valid",
                "denial of the contradictory, valid",
            ],
            0,
        ),
        # Question 3 (Obversion of A -> obversion, valid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: All crayons are non-toxic things.<br>"
            "Conclusion: No crayons are toxic things.</em>",
            [
                "obversion, valid",
                "contraposition, valid",
                "conversion, invalid",
                "denial of the contradictory, valid",
                "no named immediate inference, invalid",
            ],
            0,
        ),
        # Question 4 (Contraposition of O -> contraposition, valid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: Some students are not seniors.<br>"
            "Conclusion: Some non-seniors are not non-students.</em>",
            [
                "contraposition, valid",
                "contraposition, invalid",
                "obversion, valid",
                "conversion, valid",
                "no named immediate inference, invalid",
            ],
            0,
        ),
        # Question 5 (Denial of the contradictory -> denial of the contradictory, valid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: It is false that all dumpster fires are bad things.<br>"
            "Conclusion: Some dumpster fires are not bad things.</em>",
            [
                "denial of the contradictory, valid",
                "obversion, valid",
                "conversion, invalid",
                "contraposition, invalid",
                "no named immediate inference, invalid",
            ],
            0,
        ),
        # Question 6 (Contraposition of E -> contraposition, invalid)
        (
            "Read the following premise and conclusion, then select the immediate inference operation that transforms the premise into the conclusion AND determine whether the inference is valid on the modern interpretation:<br><br>"
            "<em>Premise: No school board members are ridiculous clowns.<br>"
            "Conclusion: No non-ridiculous-clowns are non-school-board-members.</em>",
            [
                "contraposition, invalid",
                "contraposition, valid",
                "obversion, valid",
                "conversion, valid",
                "denial of the contradictory, valid",
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
            ident = f"q10_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q10_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q10_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 6 Quizzes</title>
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
