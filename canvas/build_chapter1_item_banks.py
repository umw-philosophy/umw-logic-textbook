#!/usr/bin/env python3
"""Build Canvas QTI item-bank packages for Chapter 1.

The generated ZIP files are intended for Canvas New Quizzes item-bank import.
They use QTI 1.2 multiple-choice items only, which keeps the bank portable and
autograded.
"""

from __future__ import annotations

import html
import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "canvas" / "item_banks"
BUILD = ROOT / "canvas" / "build_item_banks_ch1"


BANKS = [
    {
        "slug": "ch1-sec1-language",
        "title": "Chapter 1 Item Bank - 1.1 Language Uses",
        "questions": [
            (
                "What is the main thing the speaker is doing?<br><br><em>Please close the classroom door.</em>",
                ["Commanding or requesting", "Stating", "Arguing", "Explaining"],
            ),
            (
                "What is the main thing the speaker is doing?<br><br><em>The library closes at midnight during exams.</em>",
                ["Stating", "Greeting", "Promising", "Commanding"],
            ),
            (
                "What is the main thing the speaker is doing?<br><br><em>I promise I will return the notes before class.</em>",
                ["Promising", "Explaining", "Arguing", "Asking a question"],
            ),
            (
                "What is the main thing the speaker is doing?<br><br><em>Why did the train leave early?</em>",
                ["Asking a question", "Stating", "Arguing", "Promising"],
            ),
            (
                "What is the main thing the speaker is doing?<br><br><em>Congratulations on finishing the project!</em>",
                ["Expressing or greeting", "Arguing", "Explaining", "Reporting a fact"],
            ),
            (
                "In the textbook's special sense, an argument is best understood as:",
                [
                    "an offering of reasons in support of a claim",
                    "a disagreement between two people",
                    "any attempt to persuade an audience",
                    "a sentence that expresses emotion",
                ],
            ),
            (
                "A commercial shows famous athletes drinking a sports drink but gives no reasons for buying it. This is best described as:",
                ["persuasion without argument", "deductive argument", "standard form", "a statement"],
            ),
            (
                "Which sentence is most clearly an argument?",
                [
                    "You should bring an umbrella because the forecast calls for storms.",
                    "Could you bring an umbrella?",
                    "Umbrellas are often stored near the door.",
                    "Wow, that umbrella is enormous.",
                ],
            ),
            (
                "Which passage is persuasion without argument?",
                [
                    "A poster says, 'Everyone cool wears this brand,' but gives no reason to think the brand is good.",
                    "The hallway is wet because the roof leaked overnight.",
                    "You should leave early because the bridge is closed.",
                    "If the battery is dead, the car will not start. The battery is dead. So the car will not start.",
                ],
            ),
            (
                "What distinguishes arguing from merely persuading?",
                [
                    "Arguing offers reasons in support of a claim.",
                    "Arguing always succeeds in changing someone's mind.",
                    "Arguing always involves anger.",
                    "Arguing never appears in ordinary conversation.",
                ],
            ),
            (
                "Which sentence best uses language to perform an action?",
                [
                    "I apologize for missing the meeting.",
                    "The meeting was at 2:00.",
                    "Was the meeting at 2:00?",
                    "The meeting room has six chairs.",
                ],
            ),
            (
                "Which of these is not enough, by itself, to make something an argument?",
                [
                    "It tries to get someone to believe something.",
                    "It gives reasons for a claim.",
                    "It contains a premise and a conclusion.",
                    "It offers support for a statement.",
                ],
            ),
            (
                "A person says, 'Buy this phone. It has the longest battery life in its price range.' This is best classified as:",
                ["an argument", "a greeting", "a command with no reason", "a question"],
            ),
            (
                "A person says, 'Buy this phone!' and nothing else. In the textbook's sense, this is:",
                ["not an argument, because no reason is offered", "an argument, because it is forceful", "an explanation", "a premise indicator"],
            ),
            (
                "Which choice best captures the relationship between persuasion and argument?",
                [
                    "Some persuasion uses arguments, but persuasion can also work without arguments.",
                    "All persuasion is argument.",
                    "Arguments are never persuasive.",
                    "Persuasion and argument mean exactly the same thing.",
                ],
            ),
        ],
    },
    {
        "slug": "ch1-sec2-statements",
        "title": "Chapter 1 Item Bank - 1.2 Statements",
        "questions": [
            (
                "Which of the following is a statement in the logical sense?",
                ["The exam begins at 9:00.", "Please open the window.", "How late is the library open?", "Good morning!"],
            ),
            (
                "Why do logicians care about statements?",
                [
                    "Statements are the kinds of claims that can be true or false.",
                    "Statements are always persuasive.",
                    "Statements are always commands.",
                    "Statements never appear inside arguments.",
                ],
            ),
            (
                "Which sentence is not a statement?",
                ["Take the quiz before midnight.", "Fredericksburg is in Virginia.", "Some dogs are mammals.", "The classroom has windows."],
            ),
            (
                "A sentence can be grammatically declarative but still fail to be a useful logical statement when:",
                [
                    "it is too vague or context-dependent to evaluate clearly",
                    "it contains more than five words",
                    "it appears in a paragraph",
                    "it is written in English",
                ],
            ),
            (
                "Which choice best explains the relation between sentences and statements?",
                [
                    "A sentence is a piece of language; a statement is a claim that can be true or false.",
                    "Every sentence is automatically a statement.",
                    "Statements are questions with punctuation removed.",
                    "Sentences can be true or false, but statements cannot.",
                ],
            ),
            (
                "Which is a statement?",
                ["Every student in the room has completed the reading.", "Complete the reading.", "Have you completed the reading?", "Welcome to class."],
            ),
            (
                "Which is not a statement?",
                ["Please submit the homework.", "The homework is due Friday.", "Some homework assignments are short.", "No quizzes are open after midnight."],
            ),
            (
                "A claim can be a statement even if:",
                [
                    "we do not know whether it is true or false",
                    "it is phrased as a command",
                    "it is a greeting",
                    "it cannot possibly be evaluated",
                ],
            ),
            (
                "Which sentence is too context-dependent to evaluate clearly without more information?",
                ["This is too heavy.", "Washington, D.C. is south of Baltimore.", "All squares have four sides.", "Some classes meet online."],
            ),
            (
                "Which pair contains two statements?",
                [
                    "The lights are on; the door is locked.",
                    "Close the door; the door is locked.",
                    "Is the door locked?; the lights are on.",
                    "Good morning; close the door.",
                ],
            ),
            (
                "Which sentence expresses a claim that could be false?",
                ["The cafeteria opens at 7:30.", "Please eat breakfast.", "How much is breakfast?", "Thanks for breakfast."],
            ),
            (
                "What makes a statement truth-apt?",
                [
                    "It says something that can be evaluated as true or false.",
                    "It is emotionally powerful.",
                    "It has a period at the end.",
                    "It persuades an audience.",
                ],
            ),
            (
                "Which sentence is a statement even if it is controversial?",
                ["College athletes should be paid.", "Pay college athletes!", "Should college athletes be paid?", "Wow, college sports!"],
            ),
            (
                "Which choice is the best reason 'Shut the window' is not a statement?",
                [
                    "It tells someone to do something rather than making a true-or-false claim.",
                    "It is too short.",
                    "It contains no nouns.",
                    "It appears outside an argument.",
                ],
            ),
            (
                "In logic, 'statement' is closest in meaning to:",
                ["truth-apt claim", "angry disagreement", "persuasive slogan", "grammatical sentence of any kind"],
            ),
        ],
    },
    {
        "slug": "ch1-sec3-premises-conclusions",
        "title": "Chapter 1 Item Bank - 1.3 Premises and Conclusions",
        "questions": [
            (
                "Identify the conclusion:<br><br><em>The sidewalks are wet because it rained overnight.</em>",
                ["The sidewalks are wet.", "It rained overnight.", "Because", "There is no argument here."],
            ),
            (
                "Which word or phrase is commonly a premise indicator?",
                ["since", "therefore", "so", "it follows that"],
            ),
            (
                "Which word or phrase is commonly a conclusion indicator?",
                ["therefore", "because", "given that", "for the reason that"],
            ),
            (
                "In standard form, premises are normally labeled as:",
                ["P1, P2, P3, ...", "C1, C2, C3, ...", "A, E, I, O", "T and F only"],
            ),
            (
                "In the conditional statement <em>If the battery is dead, then the car will not start</em>, what is the consequent?",
                ["the car will not start", "the battery is dead", "if", "the whole conditional is the consequent"],
            ),
            (
                "Identify the premise:<br><br><em>Since the battery is dead, the car will not start.</em>",
                ["The battery is dead.", "The car will not start.", "Since", "There is no premise."],
            ),
            (
                "Identify the conclusion:<br><br><em>The museum should extend its hours, since students need evening access for their projects.</em>",
                ["The museum should extend its hours.", "Students need evening access for their projects.", "Since", "Their projects."],
            ),
            (
                "Which reconstruction is in standard form?",
                [
                    "P1: The forecast calls for storms. C: You should bring an umbrella.",
                    "Because the forecast calls for storms, you should bring an umbrella.",
                    "You should bring an umbrella because storms.",
                    "Argument: umbrella.",
                ],
            ),
            (
                "What is a conclusion?",
                [
                    "The claim the premises are offered to support.",
                    "Any sentence that appears first.",
                    "A word such as because or since.",
                    "A question that begins an argument.",
                ],
            ),
            (
                "What is a premise?",
                [
                    "A statement offered in support of a conclusion.",
                    "The final sentence of every passage.",
                    "Any sentence with emotional force.",
                    "A command in an argument.",
                ],
            ),
            (
                "Identify the conclusion:<br><br><em>The lecture was recorded. So students who missed class can watch it.</em>",
                ["Students who missed class can watch it.", "The lecture was recorded.", "So", "The lecture."],
            ),
            (
                "Which phrase most strongly signals a conclusion?",
                ["hence", "because", "given that", "for"],
            ),
            (
                "Which phrase most strongly signals a premise?",
                ["for the reason that", "therefore", "thus", "we may conclude"],
            ),
            (
                "In the conditional <em>If the team practices, then it will improve</em>, what is the antecedent?",
                ["the team practices", "it will improve", "then", "the team"],
            ),
            (
                "Which is the best standard-form version of this argument?<br><br><em>Because the lab is required, you should not schedule the exam during the lab.</em>",
                [
                    "P1: The lab is required. C: You should not schedule the exam during the lab.",
                    "P1: You should not schedule the exam during the lab. C: The lab is required.",
                    "P1: Because. C: The lab.",
                    "There is no argument because it has one sentence.",
                ],
            ),
        ],
    },
    {
        "slug": "ch1-sec4-recognizing-arguments",
        "title": "Chapter 1 Item Bank - 1.4 Recognizing Arguments",
        "questions": [
            (
                "Argument or explanation?<br><br><em>The road is closed because a water main broke downtown.</em>",
                ["Explanation", "Argument", "Neither", "Both, because all uses of 'because' are arguments"],
            ),
            (
                "Argument or explanation?<br><br><em>You should avoid Route 3 because a water main broke downtown and traffic is backed up for miles.</em>",
                ["Argument", "Explanation", "Greeting", "Promise"],
            ),
            (
                "When a passage contains no indicator words, the best strategy is to:",
                [
                    "ask which claim the other claims are meant to support",
                    "assume it is not an argument",
                    "treat the first sentence as the conclusion every time",
                    "ignore the passage",
                ],
            ),
            (
                "A sub-conclusion is:",
                [
                    "a claim supported by earlier premises that also supports a later conclusion",
                    "a premise that is false",
                    "a question inside an argument",
                    "a conclusion that has no support",
                ],
            ),
            (
                "Which reconstruction best fits this argument?<br><br><em>If the server is down, students cannot submit the quiz. The server is down. So students cannot submit the quiz.</em>",
                [
                    "P1: If the server is down, students cannot submit the quiz. P2: The server is down. C: Students cannot submit the quiz.",
                    "P1: Students cannot submit the quiz. C: The server is down.",
                    "P1: The server is down. P2: Students can submit the quiz. C: No argument.",
                    "P1: If students cannot submit the quiz, the server is down. C: The server is down.",
                ],
            ),
            (
                "Which passage is most clearly an explanation rather than an argument?",
                [
                    "The alarm sounded because smoke reached the sensor.",
                    "You should leave because the alarm sounded.",
                    "The alarm sounded. Therefore, we should leave.",
                    "Since smoke is dangerous, we should leave.",
                ],
            ),
            (
                "Which passage is most clearly an argument?",
                [
                    "The alarm sounded, so we should leave the building.",
                    "The alarm sounded because smoke reached the sensor.",
                    "The alarm was loud and repeated.",
                    "After the alarm sounded, people left.",
                ],
            ),
            (
                "What is the explanandum in an explanation?",
                [
                    "The thing being explained.",
                    "The reason offered for accepting a conclusion.",
                    "The final conclusion of an argument.",
                    "A conclusion indicator.",
                ],
            ),
            (
                "What is the explanans in an explanation?",
                [
                    "The claim or claims doing the explaining.",
                    "The claim being supported in an argument.",
                    "The word therefore.",
                    "Any emotional appeal.",
                ],
            ),
            (
                "Which feature is most important for deciding whether a passage is an argument?",
                [
                    "Whether some claims are offered as reasons to accept another claim.",
                    "Whether the passage contains the word because.",
                    "Whether the passage is long.",
                    "Whether the passage contains a question mark.",
                ],
            ),
            (
                "Which passage has a likely sub-conclusion?",
                [
                    "The tutoring center helps students revise papers. Better writing improves graduation rates. So the tutoring center supports student success. Therefore, it should be funded.",
                    "The tutoring center is in the library. The library has three floors.",
                    "Please visit the tutoring center before Friday.",
                    "Where is the tutoring center located?",
                ],
            ),
            (
                "In a layered argument, a sub-conclusion:",
                [
                    "is both supported by earlier claims and used to support a further conclusion",
                    "cannot be used as support for anything else",
                    "is always false",
                    "is the same thing as a premise indicator",
                ],
            ),
            (
                "Which is the best first question to ask when reconstructing a messy passage?",
                [
                    "What is the main claim the author wants me to accept?",
                    "How many commas does the passage contain?",
                    "Does the first sentence have more than ten words?",
                    "Can I ignore all sentences without indicator words?",
                ],
            ),
            (
                "Which passage is not an argument?",
                [
                    "The printer jammed because someone loaded the paper tray incorrectly.",
                    "You should reload the paper tray because it was loaded incorrectly.",
                    "Since the paper tray was loaded incorrectly, the printer may jam again.",
                    "The printer may jam again, so we should reload the tray.",
                ],
            ),
            (
                "Which support note best communicates a simple layered structure?",
                [
                    "C2: The policy should be changed. (from C1 and P3)",
                    "C2: The policy should be changed. (from nothing)",
                    "P2: The policy should be changed. (therefore)",
                    "Argument: The policy.",
                ],
            ),
        ],
    },
]


def qti_item(bank_slug: str, q_num: int, prompt: str, choices: list[str]) -> str:
    item_id = f"{bank_slug}_q{q_num}"
    labels = []
    for i, choice in enumerate(choices):
        labels.append(
            f"""              <response_label ident="{item_id}_a{i}">
                <material><mattext texttype="text/plain">{html.escape(choice)}</mattext></material>
              </response_label>"""
        )
    return f"""
      <item ident="{item_id}" title="Question {q_num}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield>
            <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1</fieldentry></qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material><mattext texttype="text/html">{html.escape('<div>' + prompt + '</div>')}</mattext></material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>
{chr(10).join(labels)}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
          <respcondition continue="No">
            <conditionvar><varequal respident="response1">{item_id}_a0</varequal></conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>"""


def assessment_xml(slug: str, title: str, questions: list[tuple[str, list[str]]]) -> str:
    items = "\n".join(qti_item(slug, i, prompt, choices) for i, (prompt, choices) in enumerate(questions, 1))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="{slug}" title="{html.escape(title)}">
    <qtimetadata>
      <qtimetadatafield><fieldlabel>cc_maxattempts</fieldlabel><fieldentry>unlimited</fieldentry></qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
{items}
    </section>
  </assessment>
</questestinterop>
"""


def manifest_xml(slug: str, title: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" identifier="manifest_{slug}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd">
  <metadata>
    <schema>QTI</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations/>
  <resources>
    <resource identifier="{slug}" type="imsqti_xmlv1p2" href="assessment.xml">
      <file href="assessment.xml"/>
    </resource>
  </resources>
</manifest>
"""


def write_bank(slug: str, title: str, questions: list[tuple[str, list[str]]]) -> None:
    bank_dir = BUILD / slug
    bank_dir.mkdir(parents=True, exist_ok=True)
    (bank_dir / "assessment.xml").write_text(assessment_xml(slug, title, questions), encoding="utf-8")
    (bank_dir / "imsmanifest.xml").write_text(manifest_xml(slug, title), encoding="utf-8")
    zip_path = OUT / f"{slug}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(bank_dir / "imsmanifest.xml", "imsmanifest.xml")
        zf.write(bank_dir / "assessment.xml", "assessment.xml")


def main() -> None:
    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("ch1-*.zip"):
        old.unlink()

    all_questions: list[tuple[str, list[str]]] = []
    for bank in BANKS:
        write_bank(bank["slug"], bank["title"], bank["questions"])
        all_questions.extend(bank["questions"])

    write_bank("ch1-all-item-bank", "Chapter 1 Item Bank - All Questions", all_questions)

    readme = """# Chapter 1 Canvas Item Banks

These ZIP files are QTI 1.2 packages for Canvas New Quizzes item-bank import.

- `ch1-all-item-bank.zip`: all Chapter 1 questions in one bank.
- `ch1-sec1-language.zip`: Section 1.1 question bank.
- `ch1-sec2-statements.zip`: Section 1.2 question bank.
- `ch1-sec3-premises-conclusions.zip`: Section 1.3 question bank.
- `ch1-sec4-recognizing-arguments.zip`: Section 1.4 question bank.

Each question is multiple choice, worth 1 point, and the first answer choice in
the source data is the correct answer. The QTI generator preserves that answer
key in the output XML.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")
    print(f"Wrote {len(list(OUT.glob('ch1-*.zip')))} item-bank ZIP files to {OUT}")


if __name__ == "__main__":
    main()
