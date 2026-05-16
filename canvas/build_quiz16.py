#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 16: Natural Deduction Next Line."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz16_temp"
IMSCC_TARGET = CANVAS / "quiz16_natural_deduction.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz16_natural_deduction",
    "title": "Quiz 16: Natural Deduction Next Line",
    "description": "Autograded multiple-choice quiz testing the rules of natural deduction (Chapter 10).",
    "questions": [
        # Question 1 (MP)
        (
            "<p>Given the following natural deduction proof, what is a valid next line using the rules from Chapter 10?</p>"
            '<table border="0" cellpadding="3" style="font-family: monospace; font-size: 1.1em;">'
            "<tr><td>1.</td><td>P &sup; Q</td><td></td></tr>"
            "<tr><td>2.</td><td>P</td><td>/ Q &or; R</td></tr>"
            "</table>",
            [
                "3. Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MP",
                "3. Q &or; R &nbsp;&nbsp;&nbsp;&nbsp; 2 Add",
                "3. P &sup; (Q &or; R) &nbsp;&nbsp;&nbsp;&nbsp; 1 Add",
                "3. Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MT",
            ],
            0,  # Correct answer index
        ),
        # Question 2 (DS)
        (
            "<p>Given the following natural deduction proof, what is a valid next line using the rules from Chapter 10?</p>"
            '<table border="0" cellpadding="3" style="font-family: monospace; font-size: 1.1em;">'
            "<tr><td>1.</td><td>P &lor; Q</td><td></td></tr>"
            "<tr><td>2.</td><td>~P</td><td>/ Q</td></tr>"
            "</table>",
            [
                "3. Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 DS",
                "3. ~Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 DS",
                "3. Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MT",
                "3. P &middot; Q &nbsp;&nbsp;&nbsp;&nbsp; 1,2 Conj",
            ],
            0,
        ),
        # Question 3 (MT)
        (
            "<p>Given the following natural deduction proof, what is a valid next line using the rules from Chapter 10?</p>"
            '<table border="0" cellpadding="3" style="font-family: monospace; font-size: 1.1em;">'
            "<tr><td>1.</td><td>R &sup; S</td><td></td></tr>"
            "<tr><td>2.</td><td>~S</td><td>/ ~R</td></tr>"
            "</table>",
            [
                "3. ~R &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MT",
                "3. ~R &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MP",
                "3. R &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MT",
                "3. ~S &nbsp;&nbsp;&nbsp;&nbsp; 1 Simp",
            ],
            0,
        ),
        # Question 4 (Simp)
        (
            "<p>Given the following natural deduction proof, what is a valid next line using the rules from Chapter 10?</p>"
            '<table border="0" cellpadding="3" style="font-family: monospace; font-size: 1.1em;">'
            "<tr><td>1.</td><td>P &middot; Q</td><td></td></tr>"
            "<tr><td>2.</td><td>R</td><td>/ P &middot; R</td></tr>"
            "</table>",
            [
                "3. P &nbsp;&nbsp;&nbsp;&nbsp; 1 Simp",
                "3. P &middot; R &nbsp;&nbsp;&nbsp;&nbsp; 1,2 Conj",
                "3. Q &nbsp;&nbsp;&nbsp;&nbsp; 1 Add",
                "3. P &nbsp;&nbsp;&nbsp;&nbsp; 1,2 MP",
            ],
            0,
        ),
        # Question 5 (CD)
        (
            "<p>Given the following natural deduction proof, what is a valid next line using the rules from Chapter 10?</p>"
            '<table border="0" cellpadding="3" style="font-family: monospace; font-size: 1.1em;">'
            "<tr><td>1.</td><td>A &sup; B</td><td></td></tr>"
            "<tr><td>2.</td><td>C &sup; D</td><td></td></tr>"
            "<tr><td>3.</td><td>A &lor; C</td><td>/ B &lor; D</td></tr>"
            "</table>",
            [
                "4. B &lor; D &nbsp;&nbsp;&nbsp;&nbsp; 1,2,3 CD",
                "4. B &middot; D &nbsp;&nbsp;&nbsp;&nbsp; 1,2 Conj",
                "4. A &lor; C &nbsp;&nbsp;&nbsp;&nbsp; 1,2 Add",
                "4. B &lor; D &nbsp;&nbsp;&nbsp;&nbsp; 1,3 DS",
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
            ident = f"q16_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q16_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q16_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 10 Quizzes</title>
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
