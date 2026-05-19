#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 20: Inductive Reasoning Skills."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz20_temp"
IMSCC_TARGET = CANVAS / "quiz20_inductive_reasoning.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz20_inductive_reasoning",
    "title": "Quiz 20: Inductive Reasoning Skills",
    "description": "Autograded multiple-choice quiz testing skills related to inductive reasoning, generalizations, and causal arguments (Chapter 13).",
    "questions": [
        # Question 1: Deductive vs Inductive
        (
            "<p>Determine whether the following argument is best understood as deductive or inductive: <em>The last four buses on this route arrived late during heavy rain. It is raining heavily now. So this bus will probably arrive late.</em></p>",
            [
                "Inductive, because the premises are intended to make the conclusion probable, not certain.",
                "Deductive, because the premises are intended to make the conclusion certain.",
                "Inductive, because the premises are intended to make the conclusion certain.",
                "Deductive, because the premises are intended to make the conclusion probable.",
            ],
            0,  # Correct answer index
        ),
        # Question 2: Sample and Population
        (
            "<p>In the following inductive generalization, identify the sample and the population: <em>A researcher asks 500 students in the campus dining hall whether they support the new parking fee, concluding that the majority of the student body opposes it.</em></p>",
            [
                "Sample: 500 students in the dining hall; Population: The entire student body.",
                "Sample: The entire student body; Population: 500 students in the dining hall.",
                "Sample: 500 students in the dining hall; Population: Students who oppose the fee.",
                "Sample: Students who oppose the fee; Population: 500 students in the dining hall.",
            ],
            0,
        ),
        # Question 3: Alternative Causes
        (
            "<p>A campus survey finds a correlation between attending early morning classes and earning higher grades. Which of the following is an example of a <strong>common cause</strong> that could explain this correlation without one causing the other?</p>",
            [
                "Highly motivated students are more likely to register for early morning classes and also more likely to study hard and earn higher grades.",
                "Getting better grades causes students to feel energized, making them more willing to wake up early for classes.",
                "Attending early morning classes causes students to have more free time in the afternoon to study, leading to better grades.",
                "The survey only interviewed a small number of students, so the correlation is just a coincidence.",
            ],
            0,
        ),
        # Question 4: Inductive Strength
        (
            "<p>Consider the following inductive argument: <em>'The first person I saw walking out of the library today was carrying a coffee. Therefore, most people who use the library carry coffee.'</em> How would you evaluate the strength of this argument?</p>",
            [
                "Weak, because the sample size (one person) is far too small to support a generalization about most people.",
                "Strong, because if the premise is true, it makes the conclusion highly probable.",
                "Cogent, because the premise is true and the argument is deductively valid.",
                "Defeasible, because the conclusion is guaranteed to be true.",
            ],
            0,
        ),
        # Question 5: Arguments by Analogy
        (
            "<p>Suppose a student argues: <em>'My logic class and my calculus class both meet in the same building and at the same time of day. Since I got an A in calculus, I will probably get an A in logic.'</em> Why is this argument by analogy weak?</p>",
            [
                "The similarities mentioned (building and time) are not relevant to the conclusion (earning a good grade).",
                "The argument is deductively valid, not inductively strong.",
                "The sample size of classes is too small to draw a causal conclusion.",
                "The argument ignores the possibility of a common cause.",
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
            ident = f"q20_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q20_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q20_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 13 Quizzes</title>
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
