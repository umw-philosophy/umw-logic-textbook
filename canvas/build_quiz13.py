#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 13: Necessary and Sufficient Conditions."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz13_temp"
IMSCC_TARGET = CANVAS / "quiz13_necessary_sufficient.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz13_necessary_sufficient",
    "title": "Quiz 13: Necessary and Sufficient Conditions",
    "description": "Autograded multiple-choice quiz testing the identification of necessary and sufficient conditions in sentential logic translations (Chapter 8). For each ordinary English statement, identify exactly what is being asserted as necessary and what is being asserted as sufficient.",
    "questions": [
        # Question 1 (17)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient:<br><br>"
            "<em>\"If the alarm sounds, the building will be evacuated.\"</em>",
            [
                "The alarm sounding is sufficient for evacuating the building, and evacuating the building is necessary for the alarm sounding.",
                "The alarm sounding is necessary for evacuating the building, and evacuating the building is sufficient for the alarm sounding.",
                "The alarm sounding is both necessary and sufficient for evacuating the building.",
                "Evacuating the building is sufficient for the alarm sounding, but the alarm sounding is not necessary for evacuating the building.",
            ],
            0,  # Correct answer index
        ),
        # Question 2 (18)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient:<br><br>"
            "<em>\"The building will be evacuated if the alarm sounds.\"</em>",
            [
                "The alarm sounding is sufficient for evacuating the building, and evacuating the building is necessary for the alarm sounding.",
                "The alarm sounding is necessary for evacuating the building, and evacuating the building is sufficient for the alarm sounding.",
                "The alarm sounding is both necessary and sufficient for evacuating the building.",
                "Neither event is asserted as necessary or sufficient for the other.",
            ],
            0,
        ),
        # Question 3 (19)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient:<br><br>"
            "<em>\"The building will be evacuated only if the alarm sounds.\"</em>",
            [
                "The alarm sounding is necessary for evacuating the building, and evacuating the building is sufficient for the alarm sounding.",
                "The alarm sounding is sufficient for evacuating the building, and evacuating the building is necessary for the alarm sounding.",
                "The alarm sounding is both necessary and sufficient for evacuating the building.",
                "Evacuating the building is necessary for the alarm sounding, but the alarm sounding is not sufficient for evacuating the building.",
            ],
            0,
        ),
        # Question 4 (20)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient:<br><br>"
            "<em>\"The building will be evacuated if and only if the alarm sounds.\"</em>",
            [
                "The alarm sounding is both necessary and sufficient for evacuating the building.",
                "The alarm sounding is sufficient for evacuating the building, but not necessary.",
                "The alarm sounding is necessary for evacuating the building, but not sufficient.",
                "The alarm sounding is neither necessary nor sufficient for evacuating the building.",
            ],
            0,
        ),
        # Question 5 (21)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient (recall that 'unless' translates as 'if not'):<br><br>"
            "<em>\"I will accept the results of the election unless I lose.\"</em>",
            [
                "Not losing is sufficient for accepting the results, and accepting the results is necessary for not losing.",
                "Losing is sufficient for accepting the results, and accepting the results is necessary for losing.",
                "Losing is necessary for accepting the results, and accepting the results is sufficient for losing.",
                "Not losing is necessary for accepting the results, and accepting the results is sufficient for not losing.",
            ],
            0,
        ),
        # Question 6 (22)
        (
            "Read the following statement, then identify what is being asserted as necessary and what is being asserted as sufficient:<br><br>"
            "<em>\"The grant will be renewed only if the report is submitted on time.\"</em>",
            [
                "Submitting the report on time is necessary for renewing the grant, and renewing the grant is sufficient for the report being submitted on time.",
                "Submitting the report on time is sufficient for renewing the grant, and renewing the grant is necessary for the report being submitted on time.",
                "Submitting the report on time is both necessary and sufficient for renewing the grant.",
                "Submitting the report on time is neither necessary nor sufficient for renewing the grant.",
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
            ident = f"q13_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q13_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q13_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 8 Translations</title>
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
