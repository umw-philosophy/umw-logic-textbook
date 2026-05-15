#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 4: Argument Reconstruction."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz4_temp"
IMSCC_TARGET = CANVAS / "quiz4_recon.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz4_recon",
    "title": "Quiz 4: Argument Reconstruction",
    "due": "2026-05-19T23:59:00Z",
    "description": "Autograded quiz covering Chapter 2 concepts of argument reconstruction, including independent vs. dependent premises, sub-conclusions, final conclusions, and implicit premises. Due May 19th.",
    "questions": [
        # Question 1
        (
            "Consider the following argument reconstruction:<br><br>"
            "P1: The early bus is usually less crowded.<br>"
            "P2: The early bus gets to campus before the coffee line gets ridiculous.<br>"
            "C: You should take the early bus.<br><br>"
            "According to Chapter 2, what is the support relationship between P1 and P2?",
            [
                "They provide independent support because each premise gives its own separate reason to accept the conclusion without needing to be combined with the other.",
                "They provide dependent support because neither premise makes sense grammatically on its own.",
                "P1 is a sub-conclusion supported by P2.",
                "P2 is an implicit premise that must be supplied by the reader.",
            ],
            0,  # Correct answer index
        ),
        # Question 2
        (
            "Consider the following argument reconstruction:<br><br>"
            "P1: If the only available exam time conflicts with a required lab, the department should offer a make-up exam.<br>"
            "P2: The only available exam time conflicts with a required lab.<br>"
            "C: The department should offer a make-up exam.<br><br>"
            "How do P1 and P2 support the conclusion?",
            [
                "They provide dependent support because neither premise alone gives the complete reason for the conclusion; the policy principle and the factual condition must work together.",
                "They provide independent support because each statement is a complete, truth-apt sentence on its own.",
                "P1 supports P2 independently, while P2 supports C dependently.",
                "They do not support the conclusion because the argument commits the fallacy of affirming the consequent.",
            ],
            0,
        ),
        # Question 3
        (
            "Read the following layered argument passage:<br><br>"
            "<em>\"The discount brings in students who would otherwise skip the museum, and those students often return later with family members. That means the student discount builds future audiences. Programs that build future audiences are worth preserving, so the museum has a good reason to continue the discount.\"</em><br><br>"
            "Which statement functions as a <strong>sub-conclusion</strong> (an intermediate conclusion) in this argument?",
            [
                "The student discount builds future audiences.",
                "The museum has a good reason to continue the discount.",
                "The discount brings in students who would otherwise skip the museum.",
                "Programs that build future audiences are worth preserving.",
            ],
            0,
        ),
        # Question 4
        (
            "In the museum discount argument from the previous question, which statement represents the <strong>final conclusion</strong>?",
            [
                "The museum has a good reason to continue the discount.",
                "The student discount builds future audiences.",
                "The discount brings in students who would otherwise skip the museum.",
                "Those students often return later with family members.",
            ],
            0,
        ),
        # Question 5
        (
            "Consider this short passage:<br><br>"
            "<em>\"The emergency grant program gives students short-term financial help. Therefore, the program protects student retention.\"</em><br><br>"
            "To reconstruct this argument fairly using the principle of charity, which of the following is the most appropriate <strong>implicit premise</strong> to add?",
            [
                "Short-term financial help helps keep students enrolled and protects retention.",
                "Every student at the university receives an emergency grant at some point.",
                "Emergency grants are funded entirely by private alumni donations.",
                "Students should never drop out of college under any circumstances.",
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
            ident = f"q4_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q4_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q4_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 2 Quizzes</title>
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
