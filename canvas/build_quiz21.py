#!/usr/bin/env python3
"""Build a Canvas Common Cartridge (.imscc) package for Quiz 21: Probability."""

from __future__ import annotations

import html
import shutil
import uuid
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANVAS = ROOT / "canvas"
BUILD = CANVAS / "build_quiz21_temp"
IMSCC_TARGET = CANVAS / "quiz21_probability.imscc"


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


QUIZ = {
    "slug": "quiz21_probability",
    "title": "Quiz 21: Probability Basics and Bayes",
    "description": "Autograded multiple-choice quiz testing basic probability rules and Bayes' theorem (Chapter 14).",
    "questions": [
        # Question 1: Interpretation
        (
            "<p>Which interpretation of probability defines it as the long-run relative frequency of an event in a sequence of similar trials?</p>",
            [
                "The frequentist interpretation",
                "The classical interpretation",
                "The subjective (Bayesian) interpretation",
                "The conditional interpretation",
            ],
            0,  # Correct answer index
        ),
        # Question 2: Complement Rule
        (
            "<p>If the probability of drawing a heart from a standard 52-card deck is 0.25, what is the probability of drawing a card that is NOT a heart? (Hint: use the complement rule).</p>",
            [
                "0.75",
                "0.50",
                "0.25",
                "1.00",
            ],
            0,
        ),
        # Question 3: Disjunctive (General Addition Rule)
        (
            "<p>A spinner has numbers 1 through 10. The probability of spinning an even number is 0.5. The probability of spinning a number greater than 7 is 0.3. The probability of spinning a number that is BOTH even and greater than 7 is 0.2. Using the general addition rule, what is the probability of spinning a number that is even OR greater than 7?</p>",
            [
                "0.6 (since 0.5 + 0.3 - 0.2 = 0.6)",
                "0.8 (since 0.5 + 0.3 = 0.8)",
                "0.15 (since 0.5 × 0.3 = 0.15)",
                "0.2 (since 0.5 - 0.3 = 0.2)",
            ],
            0,
        ),
        # Question 4: Conjunctive (Multiplication Rule)
        (
            "<p>Assuming that flipping a fair coin and rolling a fair six-sided die are independent events, what is the probability of flipping heads (probability 1/2) AND rolling a 6 (probability 1/6)?</p>",
            [
                "1/12 (approximately 0.083)",
                "4/6 (approximately 0.667)",
                "1/3 (approximately 0.333)",
                "11/12 (approximately 0.917)",
            ],
            0,
        ),
        # Question 5: Bayes' Theorem
        (
            "<p>Suppose 10% of packages delivered to a building are stolen (prior probability P(H) = 0.10, so P(~H) = 0.90). A security camera flags deliveries as suspicious. If a package is stolen, the camera flags it 90% of the time (P(E | H) = 0.90). If a package is NOT stolen, the camera falsely flags it 10% of the time (P(E | ~H) = 0.10). Using Bayes' theorem, if the camera flags a package, what is the probability it was actually stolen?</p>"
            "<p><em>Recall the formula: P(H | E) = [ P(E | H) × P(H) ] / [ P(E | H) × P(H) + P(E | ~H) × P(~H) ]</em></p>",
            [
                "0.5 (or 50%)",
                "0.9 (or 90%)",
                "0.1 (or 10%)",
                "0.81 (or 81%)",
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
            ident = f"q21_{q_idx}_a{c_idx}"
            choice_xml.append(f"""
              <response_label ident="{ident}">
                <material><mattext texttype="text/html">{html.escape(choice)}</mattext></material>
              </response_label>""")
        correct_ident = f"q21_{q_idx}_a{correct}"
        items.append(f"""
      <item ident="q21_{q_idx}" title="Question {q_idx}">
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
        <title>Chapter 14 Quizzes</title>
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
