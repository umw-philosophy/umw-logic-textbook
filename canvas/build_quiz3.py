#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 3: Arguments and Conclusions."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz3_temp"
IMSCC_TARGET = CANVAS / "quiz3arguments_conclusions.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz3arguments_conclusions",
    "title": "Quiz 3: Arguments and Conclusions",
    "description": "Identify the final conclusion for each of the following argument passages from Chapter 1.",
    "questions": [
        # Question 1 (Exercise 135 / ex-ch1-s12-05)
        (
            "Read the following passage and identify the final conclusion of the argument:<br><br>"
            "<em>\"We should not use attendance software that tracks students' locations. The software collects sensitive data. Sensitive data can be misused or exposed in a breach. Tools that create serious privacy risks should be avoided unless they are necessary. This software is not necessary, since professors can take attendance without location tracking.\"</em>",
            [
                "We should not use attendance software that tracks students' locations.",
                "The software collects sensitive data.",
                "Sensitive data can be misused or exposed in a breach.",
                "Tools that create serious privacy risks should be avoided unless they are necessary.",
                "This software is not necessary, since professors can take attendance without location tracking.",
            ],
            0,  # Correct answer index
        ),
        # Question 2 (Exercise 136 / ex-ch1-s12-06)
        (
            "Read the following passage and identify the final conclusion of the argument:<br><br>"
            "<em>\"The city should build a new park near the university. The nearest park is two miles away, and students without cars cannot easily reach it. A nearby park would improve mental health, because access to green space reduces stress. Reduced stress leads to better academic performance.\"</em>",
            [
                "The city should build a new park near the university.",
                "The nearest park is two miles away, and students without cars cannot easily reach it.",
                "A nearby park would improve mental health, because access to green space reduces stress.",
                "Reduced stress leads to better academic performance.",
            ],
            0,
        ),
        # Question 3 (Exercise 137 / ex-ch1-s12-07)
        (
            "Read the following passage and identify the final conclusion of the argument:<br><br>"
            "<em>\"We should require all first-year students to take a critical thinking course. Students arrive with widely varying reasoning skills. A shared course would give everyone a common vocabulary for evaluating arguments. A common vocabulary makes class discussions in other courses more productive. More productive discussions improve learning across the curriculum.\"</em>",
            [
                "We should require all first-year students to take a critical thinking course.",
                "Students arrive with widely varying reasoning skills.",
                "A shared course would give everyone a common vocabulary for evaluating arguments.",
                "A common vocabulary makes class discussions in other courses more productive.",
                "More productive discussions improve learning across the curriculum.",
            ],
            0,
        ),
        # Question 4 (Exercise 138 / ex-ch1-s12-08)
        (
            "Read the following passage and identify the final conclusion of the argument:<br><br>"
            "<em>\"The software should be replaced. It crashes at least once per week during peak hours. Each crash disrupts service for roughly 500 users. Frequent disruptions erode trust in the system. A system that users do not trust will not be used, and a system that is not used wastes the money spent on it.\"</em>",
            [
                "The software should be replaced.",
                "It crashes at least once per week during peak hours.",
                "Each crash disrupts service for roughly 500 users.",
                "Frequent disruptions erode trust in the system.",
                "A system that users do not trust will not be used, and a system that is not used wastes the money spent on it.",
            ],
            0,
        ),
        # Question 5 (Exercise 143 / ex-ch1-s13-05)
        (
            "Read the following passage and identify the final conclusion of the argument:<br><br>"
            "<em>\"If the collaboration policy applies to group chat notes, then students must list those notes in their acknowledgments. The collaboration policy does apply to group chat notes. Therefore, students must list those notes in their acknowledgments.\"</em>",
            [
                "students must list those notes in their acknowledgments.",
                "If the collaboration policy applies to group chat notes, then students must list those notes in their acknowledgments.",
                "The collaboration policy does apply to group chat notes.",
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
            ident = f"q3_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q3_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q3_{q_idx}" title="Question {q_idx}">
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
