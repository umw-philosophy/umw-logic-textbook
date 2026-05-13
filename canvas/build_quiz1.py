#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 1: Syllabus and Arguments."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz1_temp"
IMSCC_TARGET = CANVAS / "quiz1_syllabus.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz1_syllabus",
    "title": "Quiz 1: Syllabus and Arguments",
    "description": "After reading the syllabus and first two reading assignments, answer the following questions about the syllabus and arguments.",
    "questions": [
        # Question 1
        (
            "How can you get in touch with me (the instructor, Michael Reno)?",
            [
                "email me at mreno@umw.edu or through the discussion board on canvas.",
                "Call me at 517-YoL-ogic",
                "Wait around at my office in person for me to show up.",
                "Make rude comments on the youTube videos for the course until I respond.",
            ],
            0,  # Correct answer index
        ),
        # Question 2
        (
            "In order to succeed, about how much time should you spend each day on the course material?",
            [
                "At least 2-3 hours, probably more like 4 hours per day.",
                "None. This is an easy A.",
                "1 hour",
                "12 hours per day.",
            ],
            0,
        ),
        # Question 3
        (
            "When's the first exam and how long do you have to complete it?",
            [
                "It's on Friday, May 23rd. The end of the first week of class! You'll have 2 hours to complete it, starting at 9 am.",
                "There are no exams.",
                "There's an exam every day, so Monday, May 17th",
                "June 16th",
            ],
            0,
        ),
        # Question 4
        (
            "A statement is a sentence that is true or false.",
            [
                "True",
                "False",
            ],
            0,
        ),
        # Question 5
        (
            "In the following passage, which sentence is the final conclusion?<br><br>"
            "For example, under this Proposal — if a Square customer’s mother gifts her daughter $4,000 in physical cash and the daughter deposits those funds in a bank, the bank would have no obligation to collect information on the customer’s mother. Under the Proposal, if this same transaction were completed in cryptocurrency, the bank would have to reach beyond its customer relationship and intrude upon the mother’s private information in order for the daughter to successfully deposit and freely access her gift.<br><br>"
            "The incongruity between the treatment of cash and cryptocurrency under FinCEN’s Proposal will inhibit adoption of cryptocurrency and invade the privacy of individuals. Yet the rule fails to explain the difference in risk. As such, this low threshold and its extension of KYC obligations beyond customer relationships is arbitrary and unjustified.",
            [
                "As such, this low threshold and its extension of KYC obligations beyond customer relationships is arbitrary and unjustified.",
                "under this Proposal — if a Square customer’s mother gifts her daughter $4,000 in physical cash and the daughter deposits those funds in a bank, the bank would have no obligation to collect information on the customer’s mother.",
                "The bank would have to reach beyond its customer relationship and intrude upon the mother’s private information in order for the daughter to successfully deposit and freely access her gift.",
                "Yet the rule fails to explain the difference in risk.",
                "The incongruity between the treatment of cash and cryptocurrency under FinCEN’s Proposal will inhibit adoption of cryptocurrency and invade the privacy of individuals.",
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
            ident = f"q1_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/plain">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q1_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q1_{q_idx}" title="Question {q_idx}">
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
        <title>Imported Quizzes</title>
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
