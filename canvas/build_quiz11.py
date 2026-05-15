#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 11: Categorical Syllogisms."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz11_temp"
IMSCC_TARGET = CANVAS / "quiz11_syllogisms.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz11_syllogisms",
    "title": "Quiz 11: Categorical Syllogisms",
    "description": "Autograded multiple-choice quiz testing the evaluation of categorical syllogisms (Chapter 7). For each syllogism, use a Venn diagram (or mood and figure) to determine its validity under the modern interpretation, and identify the form of its conclusion.",
    "questions": [
        # Question 1 (Valid, Conclusion is E)
        (
            "Use a Venn diagram (or mood and figure) to determine the validity of the following standard-form categorical syllogism under the modern interpretation:<br><br>"
            "<em>Major Premise: No AI safety researchers are accelerationists.<br>"
            "Minor Premise: All people calling for slower deployment are AI safety researchers.<br>"
            "Conclusion: No people calling for slower deployment are accelerationists.</em>",
            [
                "the argument is valid, and the conclusion is an E statement.",
                "the argument is invalid, and the conclusion is an E statement.",
                "the argument is valid, and the conclusion is an A statement.",
                "the argument is invalid, and the conclusion is an A statement.",
            ],
            0,  # Correct answer index
        ),
        # Question 2 (Valid, Conclusion is A)
        (
            "Use a Venn diagram (or mood and figure) to determine the validity of the following standard-form categorical syllogism under the modern interpretation:<br><br>"
            "<em>Major Premise: All laws that degrade human personality are unjust laws.<br>"
            "Minor Premise: All segregation statutes are laws that degrade human personality.<br>"
            "Conclusion: All segregation statutes are unjust laws.</em>",
            [
                "the argument is valid, and the conclusion is an A statement.",
                "the argument is invalid, and the conclusion is an A statement.",
                "the argument is valid, and the conclusion is an I statement.",
                "the argument is invalid, and the conclusion is an E statement.",
            ],
            0,
        ),
        # Question 3 (Invalid, Conclusion is A)
        (
            "Use a Venn diagram (or mood and figure) to determine the validity of the following standard-form categorical syllogism under the modern interpretation:<br><br>"
            "<em>Major Premise: No vegetarians are meat eaters.<br>"
            "Minor Premise: No consistent thinkers are meat eaters.<br>"
            "Conclusion: All consistent thinkers are vegetarians.</em>",
            [
                "the argument is invalid, and the conclusion is an A statement.",
                "the argument is valid, and the conclusion is an A statement.",
                "the argument is invalid, and the conclusion is an E statement.",
                "the argument is valid, and the conclusion is an E statement.",
            ],
            0,
        ),
        # Question 4 (Valid, Conclusion is O)
        (
            "Use a Venn diagram (or mood and figure) to determine the validity of the following standard-form categorical syllogism under the modern interpretation:<br><br>"
            "<em>Major Premise: No right-wing hate mongers are socialists.<br>"
            "Minor Premise: Some Americans are socialists.<br>"
            "Conclusion: Some Americans are not right-wing hate mongers.</em>",
            [
                "the argument is valid, and the conclusion is an O statement.",
                "the argument is invalid, and the conclusion is an O statement.",
                "the argument is valid, and the conclusion is an I statement.",
                "the argument is invalid, and the conclusion is an I statement.",
            ],
            0,
        ),
        # Question 5 (Invalid, Conclusion is I)
        (
            "Use a Venn diagram (or mood and figure) to determine the validity of the following standard-form categorical syllogism under the modern interpretation:<br><br>"
            "<em>Major Premise: All ozone molecules are good absorbers of UV rays.<br>"
            "Minor Premise: All ozone molecules are substances destroyed by chlorine.<br>"
            "Conclusion: Some substances destroyed by chlorine are good absorbers of UV rays.</em>",
            [
                "the argument is invalid, and the conclusion is an I statement.",
                "the argument is valid, and the conclusion is an I statement.",
                "the argument is invalid, and the conclusion is an A statement.",
                "the argument is valid, and the conclusion is an A statement.",
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
            ident = f"q11_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q11_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q11_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 7 Quizzes</title>
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
