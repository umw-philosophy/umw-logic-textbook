#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 22: Statistical Reasoning Skills."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz22_temp"
IMSCC_TARGET = CANVAS / "quiz22_statistical_reasoning.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz22_statistical_reasoning",
    "title": "Quiz 22: Statistical Reasoning Skills",
    "description": "Autograded multiple-choice quiz testing statistical skills: distributions, the empirical rule, polling, diagnostic tradeoffs, and data presentation (Chapter 15).",
    "questions": [
        # Question 1: Mean vs Median
        (
            "<p>A dataset of home prices in a neighborhood contains mostly homes valued around $200,000, but also includes one massive estate valued at $2.5 million. Which measure of center is the most appropriate to describe a 'typical' home price in this neighborhood, and why?</p>",
            [
                "The median, because it is resistant to being pulled up by the single extreme outlier.",
                "The mean, because it includes all the values in the calculation.",
                "The mode, because it tells you the exact average of all the homes.",
                "The median, because it will be exactly equal to the mean in this case.",
            ],
            0,  # Correct answer index
        ),
        # Question 2: Empirical Rule
        (
            "<p>The diameters of a certain variety of pine tree are approximately normally distributed with a mean of 150 cm and a standard deviation of 30 cm. According to the empirical rule, approximately what percentage of these trees have diameters between 90 cm and 210 cm?</p>",
            [
                "95%",
                "68%",
                "99.7%",
                "50%",
            ],
            0,
        ),
        # Question 3: Margin of Error
        (
            "<p>A news station reports on a poll of 600 voters with a margin of error of plus or minus 4 percentage points. The poll shows Candidate A with 51% and Candidate B with 49%. Based on the confidence interval, what is the most accurate statistical conclusion?</p>",
            [
                "The race is effectively tied and within the margin of error, since Candidate A's true support could be as low as 47% and Candidate B's as high as 53%.",
                "Candidate A will almost certainly win because 51% is a majority.",
                "The poll is invalid because the margin of error is too large.",
                "Candidate B will actually win because the margin of error must be subtracted from Candidate A.",
            ],
            0,
        ),
        # Question 4: Diagnostic Thresholds
        (
            "<p>A spam filter is currently set to catch 99% of all spam (high sensitivity), but it often flags legitimate emails as spam (low specificity). If you adjust the filter's threshold to be more conservative so that it almost never flags legitimate emails (increasing specificity), what will inevitably happen to the filter's sensitivity?</p>",
            [
                "It will decrease, meaning more spam emails will slip through into the inbox (more false negatives).",
                "It will increase, meaning it will catch even more spam.",
                "It will remain exactly the same because sensitivity and specificity are independent.",
                "It will decrease, meaning it will start flagging even more legitimate emails as spam.",
            ],
            0,
        ),
        # Question 5: Misleading Statistics
        (
            "<p>A political advertisement shows a bar graph where the incumbent's bar is visually twice as tall as the challenger's bar. However, the numbers on the vertical y-axis start at 40 instead of 0, and the actual values are 42 for the challenger and 44 for the incumbent. What kind of statistical distortion is this?</p>",
            [
                "A truncated axis, which makes a small difference look deceptively large.",
                "An area distortion, which misrepresents the volume of the bars.",
                "A cherry-picked baseline, which selects a misleading starting year.",
                "A false positive, which misidentifies the true leader.",
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
            ident = f"q22_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q22_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q22_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 15 Quizzes</title>
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
