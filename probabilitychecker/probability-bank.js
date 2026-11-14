/*
 * probability-bank.js
 * Story wrappers for the Probability Practice tool. These supply words only.
 * All numbers are generated, and all answers computed, in probability-core.js.
 *
 * To add a Bayes story, copy an entry and keep every field. {p} must read
 * correctly as either "4 percent" or "1 in 250"; the other placeholders are
 * always filled with "N percent". tp and fn must both describe cases where H
 * is true; fp and tn must both describe cases where H is false.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProbBank = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
  "bayes": [
    {
      "id": "rapid-strep-test",
      "topic": "medical",
      "setup": "A student visits the campus health center with a sore throat. The nurse uses a quick swab test for a bacterial throat infection.",
      "H": "the student has a bacterial throat infection",
      "notH": "the student does not have a bacterial throat infection",
      "E": "the quick swab test comes back positive",
      "notE": "the quick swab test does not come back positive",
      "prior": "Of all students who visit the health center with a sore throat, {p} have a bacterial throat infection.",
      "tp": "When a student has a bacterial throat infection, the swab test comes back positive {tp} of the time.",
      "fn": "When a student has a bacterial throat infection, the swab test fails to come back positive {fn} of the time.",
      "fp": "When a student does not have a bacterial throat infection, the swab test comes back positive anyway {fp} of the time.",
      "tn": "When a student does not have a bacterial throat infection, the swab test correctly comes back negative {tn} of the time.",
      "question": "The swab test comes back positive for a student. What is the probability that the student actually has a bacterial throat infection?",
      "priorRange": [
        0.1,
        0.4
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "wrist-fracture-program",
      "topic": "medical",
      "setup": "A patient falls on an icy sidewalk and lands on an outstretched hand. An emergency room program scans the X-ray and marks any possible fracture.",
      "H": "the wrist bone is broken",
      "notH": "the wrist bone is not broken",
      "E": "the program marks a possible fracture on the X-ray",
      "notE": "the program does not mark a possible fracture on the X-ray",
      "prior": "Of all patients who come in after falling onto an outstretched hand, {p} have a broken wrist bone.",
      "tp": "When a wrist bone is in fact broken, the program marks a possible fracture {tp} of the time.",
      "fn": "When a wrist bone is in fact broken, the program fails to mark a possible fracture {fn} of the time.",
      "fp": "When a wrist bone is not broken, the program marks a possible fracture anyway {fp} of the time.",
      "tn": "When a wrist bone is not broken, the program correctly marks no fracture {tn} of the time.",
      "question": "The program marks a possible fracture on a patient's X-ray. What is the probability that the wrist bone is actually broken?",
      "priorRange": [
        0.1,
        0.4
      ],
      "tpRange": [
        0.85,
        0.98
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "dental-cavity-scanner",
      "topic": "medical",
      "setup": "A dentist uses a handheld light scanner on a patient's back molar during a routine checkup. The scanner beeps when it detects possible tooth decay.",
      "H": "the tooth has a cavity",
      "notH": "the tooth does not have a cavity",
      "E": "the scanner beeps over the tooth",
      "notE": "the scanner stays silent over the tooth",
      "prior": "Of all back molars checked during routine visits, {p} have a cavity.",
      "tp": "When a tooth has a cavity, the scanner beeps {tp} of the time.",
      "fn": "When a tooth has a cavity, the scanner fails to beep {fn} of the time.",
      "fp": "When a tooth has no cavity, the scanner beeps anyway {fp} of the time.",
      "tn": "When a tooth has no cavity, the scanner correctly stays silent {tn} of the time.",
      "question": "The scanner beeps over a patient's back molar. What is the probability that the tooth actually has a cavity?",
      "priorRange": [
        0.05,
        0.3
      ],
      "tpRange": [
        0.7,
        0.9
      ],
      "fpRange": [
        0.05,
        0.2
      ]
    },
    {
      "id": "peanut-skin-test",
      "topic": "medical",
      "setup": "A nurse places a small drop of peanut extract on a patient's forearm and lightly pricks the skin. A raised red bump within a few minutes counts as a positive result.",
      "H": "the patient is allergic to peanuts",
      "notH": "the patient is not allergic to peanuts",
      "E": "the skin test shows a raised red bump",
      "notE": "the skin test does not show a raised red bump",
      "prior": "Of all patients referred for a peanut allergy test, {p} are truly allergic to peanuts.",
      "tp": "When a patient is truly allergic to peanuts, the skin test shows a raised red bump {tp} of the time.",
      "fn": "When a patient is truly allergic to peanuts, the skin test fails to show a raised red bump {fn} of the time.",
      "fp": "When a patient is not allergic to peanuts, the skin test shows a raised red bump anyway {fp} of the time.",
      "tn": "When a patient is not allergic to peanuts, the skin test correctly shows no raised red bump {tn} of the time.",
      "question": "The skin test shows a raised red bump on a patient's forearm. What is the probability that the patient is actually allergic to peanuts?",
      "priorRange": [
        0.05,
        0.2
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.05,
        0.2
      ]
    },
    {
      "id": "iron-deficiency-blood-test",
      "topic": "medical",
      "setup": "A patient reports tiredness and shortness of breath. The doctor orders a blood test, and the lab flags any sample with a low hemoglobin reading.",
      "H": "the patient has iron deficiency anemia",
      "notH": "the patient does not have iron deficiency anemia",
      "E": "the lab flags the blood sample as abnormal",
      "notE": "the lab does not flag the blood sample as abnormal",
      "prior": "Of all adults who come in with tiredness and shortness of breath, {p} have iron deficiency anemia.",
      "tp": "When a patient has iron deficiency anemia, the lab flags the blood sample as abnormal {tp} of the time.",
      "fn": "When a patient has iron deficiency anemia, the lab fails to flag the blood sample as abnormal {fn} of the time.",
      "fp": "When a patient does not have iron deficiency anemia, the lab flags the blood sample as abnormal anyway {fp} of the time.",
      "tn": "When a patient does not have iron deficiency anemia, the lab correctly leaves the blood sample unflagged {tn} of the time.",
      "question": "The lab flags a patient's blood sample as abnormal. What is the probability that the patient actually has iron deficiency anemia?",
      "priorRange": [
        0.03,
        0.15
      ],
      "tpRange": [
        0.75,
        0.9
      ],
      "fpRange": [
        0.05,
        0.15
      ]
    },
    {
      "id": "library-book-gate",
      "topic": "campus",
      "setup": "The university library has a gate at its exit. A security tag on a book sets off a beep when the book is carried out without being checked out.",
      "H": "the student is carrying an unchecked book out of the library",
      "notH": "the student is not carrying an unchecked book out of the library",
      "E": "the gate beeps as the student walks through",
      "notE": "the gate stays silent as the student walks through",
      "prior": "At a busy afternoon exit, the chance that a student is carrying an unchecked book is {p}.",
      "tp": "When a student is carrying an unchecked book, the gate beeps {tp} of the time.",
      "fn": "When a student is carrying an unchecked book, the gate fails to beep {fn} of the time.",
      "fp": "When a student is not carrying an unchecked book, the gate beeps anyway {fp} of the time.",
      "tn": "When a student is not carrying an unchecked book, the gate correctly stays silent {tn} of the time.",
      "question": "The gate beeps as a student walks through. What is the probability that the student is actually carrying an unchecked book?",
      "priorRange": [
        0.005,
        0.03
      ],
      "tpRange": [
        0.85,
        0.97
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "campus-parking-camera",
      "topic": "campus",
      "setup": "A camera mounted at the campus parking garage entrance reads license plates. It flags any car that does not have a valid permit.",
      "H": "the car has no valid permit",
      "notH": "the car has a valid permit",
      "E": "the camera flags the car's plate",
      "notE": "the camera does not flag the car's plate",
      "prior": "On a weekday morning, {p} of the cars entering the garage have no valid permit.",
      "tp": "When a car has no valid permit, the camera flags its plate {tp} of the time.",
      "fn": "When a car has no valid permit, the camera fails to flag its plate {fn} of the time.",
      "fp": "When a car has a valid permit, the camera flags its plate anyway {fp} of the time.",
      "tn": "When a car has a valid permit, the camera correctly leaves its plate unflagged {tn} of the time.",
      "question": "The camera flags a car's plate in the garage. What is the probability that the car actually has no valid permit?",
      "priorRange": [
        0.02,
        0.15
      ],
      "tpRange": [
        0.7,
        0.9
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "campus-shuttle-tracker",
      "topic": "campus",
      "setup": "A campus shuttle reports its location to a tracking app. The app shows the shuttle as stopped whenever its signal has not moved for several minutes.",
      "H": "the shuttle is running late",
      "notH": "the shuttle is on time",
      "E": "the app shows the shuttle as stopped",
      "notE": "the app does not show the shuttle as stopped",
      "prior": "Of all shuttle runs during the afternoon rush, {p} run late.",
      "tp": "When a shuttle is running late, the app shows it as stopped {tp} of the time.",
      "fn": "When a shuttle is running late, the app fails to show it as stopped {fn} of the time.",
      "fp": "When a shuttle is on time, the app shows it as stopped anyway {fp} of the time.",
      "tn": "When a shuttle is on time, the app correctly does not show it as stopped {tn} of the time.",
      "question": "The app shows a shuttle as stopped. What is the probability that the shuttle is actually running late?",
      "priorRange": [
        0.1,
        0.35
      ],
      "tpRange": [
        0.6,
        0.85
      ],
      "fpRange": [
        0.1,
        0.25
      ]
    },
    {
      "id": "recreation-center-turnstile",
      "topic": "campus",
      "setup": "A student uses a membership card to enter the campus recreation center. The turnstile reads the card and flags any card whose membership has ended.",
      "H": "the membership on the card has expired",
      "notH": "the membership on the card is still valid",
      "E": "the turnstile flags the card",
      "notE": "the turnstile does not flag the card",
      "prior": "Of all cards presented at the recreation center turnstiles, {p} belong to memberships that have expired.",
      "tp": "When a membership has expired, the turnstile flags the card {tp} of the time.",
      "fn": "When a membership has expired, the turnstile fails to flag the card {fn} of the time.",
      "fp": "When a membership is still valid, the turnstile flags the card anyway {fp} of the time.",
      "tn": "When a membership is still valid, the turnstile correctly leaves the card unflagged {tn} of the time.",
      "question": "The turnstile flags a student's card. What is the probability that the membership on the card has actually expired?",
      "priorRange": [
        0.05,
        0.2
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "email-spam-filter",
      "topic": "technology",
      "setup": "An email service sends incoming messages through a filter. The filter moves any message it judges to be spam into a separate spam folder.",
      "H": "the message is unwanted spam",
      "notH": "the message is not unwanted spam",
      "E": "the filter moves the message to the spam folder",
      "notE": "the filter leaves the message in the inbox",
      "prior": "Of all incoming messages to student accounts, {p} are unwanted spam.",
      "tp": "When a message is in fact unwanted spam, the filter moves it to the spam folder {tp} of the time.",
      "fn": "When a message is in fact unwanted spam, the filter leaves it in the inbox {fn} of the time.",
      "fp": "When a message is not unwanted spam, the filter moves it to the spam folder anyway {fp} of the time.",
      "tn": "When a message is not unwanted spam, the filter correctly leaves it in the inbox {tn} of the time.",
      "question": "The filter moves a message to the spam folder. What is the probability that the message is actually unwanted spam?",
      "priorRange": [
        0.2,
        0.5
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "card-fraud-alert",
      "topic": "technology",
      "setup": "A bank scores every card purchase for signs of fraud. The system sends an alert when a purchase gets a high score.",
      "H": "the card purchase is fraudulent",
      "notH": "the card purchase is legitimate",
      "E": "the system sends an alert for the purchase",
      "notE": "the system does not send an alert for the purchase",
      "prior": "Of all card purchases made by a bank's customers, {p} are fraudulent.",
      "tp": "When a purchase is in fact fraudulent, the system sends an alert {tp} of the time.",
      "fn": "When a purchase is in fact fraudulent, the system fails to send an alert {fn} of the time.",
      "fp": "When a purchase is legitimate, the system sends an alert anyway {fp} of the time.",
      "tn": "When a purchase is legitimate, the system correctly sends no alert {tn} of the time.",
      "question": "The system sends an alert for a card purchase. What is the probability that the purchase is actually fraudulent?",
      "priorRange": [
        0.001,
        0.01
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "essay-ai-detector",
      "topic": "technology",
      "setup": "A writing center runs a tool that estimates whether an essay was produced by an AI program. The tool labels an essay as likely AI-written when its score is high.",
      "H": "the essay was produced by an AI program",
      "notH": "the essay was not produced by an AI program",
      "E": "the tool labels the essay as likely AI-written",
      "notE": "the tool does not label the essay as likely AI-written",
      "prior": "Of all essays submitted in a first-year writing course, {p} were produced by an AI program.",
      "tp": "When an essay was produced by an AI program, the tool labels it as likely AI-written {tp} of the time.",
      "fn": "When an essay was produced by an AI program, the tool fails to label it as likely AI-written {fn} of the time.",
      "fp": "When an essay was not produced by an AI program, the tool labels it as likely AI-written anyway {fp} of the time.",
      "tn": "When an essay was not produced by an AI program, the tool correctly leaves it unlabeled {tn} of the time.",
      "question": "The tool labels an essay as likely AI-written. What is the probability that the essay was actually produced by an AI program?",
      "priorRange": [
        0.02,
        0.2
      ],
      "tpRange": [
        0.6,
        0.85
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "kitchen-smoke-alarm",
      "topic": "technology",
      "setup": "A smoke alarm hangs above the stove in a shared kitchen. Its sensor can also respond to steam from boiling water, not only to smoke.",
      "H": "a real fire is burning in the kitchen",
      "notH": "no real fire is burning in the kitchen",
      "E": "the alarm sounds",
      "notE": "the alarm does not sound",
      "prior": "On any given day, the chance that a real fire is burning in a shared kitchen is {p}.",
      "tp": "When a real fire is burning in the kitchen, the alarm sounds {tp} of the time.",
      "fn": "When a real fire is burning in the kitchen, the alarm fails to sound {fn} of the time.",
      "fp": "When no real fire is burning in the kitchen, the alarm sounds anyway {fp} of the time.",
      "tn": "When no real fire is burning in the kitchen, the alarm correctly stays silent {tn} of the time.",
      "question": "The alarm sounds in the kitchen. What is the probability that a real fire is actually burning there?",
      "priorRange": [
        0.001,
        0.01
      ],
      "tpRange": [
        0.92,
        0.98
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "student-login-alert",
      "topic": "technology",
      "setup": "A university login system compares each sign-in with the devices and locations a student usually uses. It flags any sign-in that looks unfamiliar.",
      "H": "the sign-in attempt comes from an intruder",
      "notH": "the sign-in attempt comes from the account owner",
      "E": "the system flags the sign-in attempt",
      "notE": "the system does not flag the sign-in attempt",
      "prior": "Of all sign-in attempts to student accounts, {p} come from an intruder.",
      "tp": "When a sign-in attempt comes from an intruder, the system flags it {tp} of the time.",
      "fn": "When a sign-in attempt comes from an intruder, the system fails to flag it {fn} of the time.",
      "fp": "When a sign-in attempt comes from the account owner, the system flags it anyway {fp} of the time.",
      "tn": "When a sign-in attempt comes from the account owner, the system correctly leaves it unflagged {tn} of the time.",
      "question": "The system flags a sign-in attempt. What is the probability that the attempt actually comes from an intruder?",
      "priorRange": [
        0.002,
        0.02
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "fingerprint-lab-match",
      "topic": "legal",
      "setup": "A crime lab compares a fingerprint lifted from a window with prints on file. The software reports a match when the ridge patterns look alike.",
      "H": "the suspect left the lifted print",
      "notH": "the suspect did not leave the lifted print",
      "E": "the software reports a match",
      "notE": "the software does not report a match",
      "prior": "Of all people whose prints are compared with a lifted print in this kind of case, {p} actually left it.",
      "tp": "When a person actually left the print, the software reports a match {tp} of the time.",
      "fn": "When a person actually left the print, the software fails to report a match {fn} of the time.",
      "fp": "When a person did not leave the print, the software reports a match anyway {fp} of the time.",
      "tn": "When a person did not leave the print, the software correctly reports no match {tn} of the time.",
      "question": "The software reports a match between the lifted print and a suspect's print. What is the probability that the suspect actually left the lifted print?",
      "priorRange": [
        0.01,
        0.1
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "highway-camera-stolen-list",
      "topic": "legal",
      "setup": "A highway camera reads license plates as cars pass. It flags any plate that appears on a state list of stolen cars.",
      "H": "the car is on the stolen list",
      "notH": "the car is not on the stolen list",
      "E": "the camera flags the plate",
      "notE": "the camera does not flag the plate",
      "prior": "Of all cars that pass this camera on a given day, {p} are on the stolen list.",
      "tp": "When a car is on the stolen list, the camera flags its plate {tp} of the time.",
      "fn": "When a car is on the stolen list, the camera fails to flag its plate {fn} of the time.",
      "fp": "When a car is not on the stolen list, the camera flags its plate anyway {fp} of the time.",
      "tn": "When a car is not on the stolen list, the camera correctly leaves its plate unflagged {tn} of the time.",
      "question": "The camera flags a car's plate. What is the probability that the car is actually on the stolen list?",
      "priorRange": [
        0.001,
        0.01
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "banknote-marker-pen",
      "topic": "legal",
      "setup": "A shop clerk marks a banknote with a special pen before accepting it. The ink turns dark on ordinary paper, but it stays pale on the paper used for real banknotes.",
      "H": "the banknote is counterfeit",
      "notH": "the banknote is genuine",
      "E": "the ink turns dark",
      "notE": "the ink stays pale",
      "prior": "Of all banknotes presented at this shop, {p} are counterfeit.",
      "tp": "When a banknote is counterfeit, the ink turns dark {tp} of the time.",
      "fn": "When a banknote is counterfeit, the ink stays pale {fn} of the time.",
      "fp": "When a banknote is genuine, the ink turns dark anyway {fp} of the time.",
      "tn": "When a banknote is genuine, the ink stays pale {tn} of the time.",
      "question": "The ink turns dark on a banknote. What is the probability that the banknote is actually counterfeit?",
      "priorRange": [
        0.001,
        0.02
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "check-watermark-review",
      "topic": "legal",
      "setup": "A bank teller holds each check up to a light to look for a faint watermark. A check without the watermark is sent to a manager for review.",
      "H": "the check is forged",
      "notH": "the check is genuine",
      "E": "the watermark is missing",
      "notE": "the watermark is present",
      "prior": "Of all checks presented at this branch, {p} are forged.",
      "tp": "When a check is forged, the watermark is missing {tp} of the time.",
      "fn": "When a check is forged, the watermark is present {fn} of the time.",
      "fp": "When a check is genuine, the watermark appears to be missing anyway {fp} of the time.",
      "tn": "When a check is genuine, the watermark is present {tn} of the time.",
      "question": "A teller finds that a check's watermark is missing. What is the probability that the check is actually forged?",
      "priorRange": [
        0.001,
        0.02
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "speed-camera-county-road",
      "topic": "legal",
      "setup": "A radar camera on a county road records the speed of each passing car. It flags any car going above the posted speed limit.",
      "H": "the car was speeding",
      "notH": "the car was not speeding",
      "E": "the camera flags the car",
      "notE": "the camera does not flag the car",
      "prior": "On this stretch of road, {p} of the cars that pass the camera are speeding.",
      "tp": "When a car is in fact speeding, the camera flags it {tp} of the time.",
      "fn": "When a car is in fact speeding, the camera fails to flag it {fn} of the time.",
      "fp": "When a car is not speeding, the camera flags it anyway {fp} of the time.",
      "tn": "When a car is not speeding, the camera correctly leaves it unflagged {tn} of the time.",
      "question": "The camera flags a car. What is the probability that the car was actually speeding?",
      "priorRange": [
        0.05,
        0.25
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "highway-traffic-app",
      "topic": "everyday",
      "setup": "A navigation app shows a red warning on a route when it expects heavy traffic. The app uses recent speeds reported by phones on the road.",
      "H": "the highway is jammed at rush hour",
      "notH": "the highway is not jammed at rush hour",
      "E": "the app shows a red warning on the route",
      "notE": "the app does not show a red warning on the route",
      "prior": "On a typical weekday, the chance that the highway is jammed at rush hour is {p}.",
      "tp": "When the highway is jammed at rush hour, the app shows a red warning {tp} of the time.",
      "fn": "When the highway is jammed at rush hour, the app fails to show a red warning {fn} of the time.",
      "fp": "When the highway is clear at rush hour, the app shows a red warning anyway {fp} of the time.",
      "tn": "When the highway is clear at rush hour, the app correctly shows no red warning {tn} of the time.",
      "question": "The app shows a red warning on a driver's route. What is the probability that the highway is actually jammed at rush hour?",
      "priorRange": [
        0.1,
        0.3
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.05,
        0.15
      ]
    },
    {
      "id": "doorbell-motion-alert",
      "topic": "everyday",
      "setup": "A doorbell camera on a house sends a phone alert whenever it detects motion. Passing cars and swaying branches can also set it off.",
      "H": "someone is standing at the front door",
      "notH": "no one is standing at the front door",
      "E": "the doorbell camera sends a motion alert",
      "notE": "the doorbell camera does not send a motion alert",
      "prior": "At a random moment during the day, the chance that someone is standing at the front door is {p}.",
      "tp": "When someone is standing at the front door, the camera sends a motion alert {tp} of the time.",
      "fn": "When someone is standing at the front door, the camera fails to send a motion alert {fn} of the time.",
      "fp": "When no one is standing at the front door, the camera sends a motion alert anyway {fp} of the time.",
      "tn": "When no one is standing at the front door, the camera correctly sends no motion alert {tn} of the time.",
      "question": "The doorbell camera sends a motion alert. What is the probability that someone is actually standing at the front door?",
      "priorRange": [
        0.01,
        0.1
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.05,
        0.2
      ]
    },
    {
      "id": "self-checkout-scale",
      "topic": "everyday",
      "setup": "A grocery store self-checkout has a scale under the bagging area. The scale flags a weight that does not match the item the shopper scanned.",
      "H": "an item went into the bag unscanned",
      "notH": "every item in the bag was scanned",
      "E": "the scale flags a weight mismatch",
      "notE": "the scale does not flag a weight mismatch",
      "prior": "Of all transactions at this self-checkout, {p} include an item that went into the bag unscanned.",
      "tp": "When an item went into the bag unscanned, the scale flags a weight mismatch {tp} of the time.",
      "fn": "When an item went into the bag unscanned, the scale fails to flag a weight mismatch {fn} of the time.",
      "fp": "When every item was scanned, the scale flags a weight mismatch anyway {fp} of the time.",
      "tn": "When every item was scanned, the scale correctly flags no weight mismatch {tn} of the time.",
      "question": "The scale flags a weight mismatch at a self-checkout. What is the probability that an item actually went into the bag unscanned?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "car-low-fuel-light",
      "topic": "everyday",
      "setup": "A car's dashboard has a light that comes on when the fuel level drops below a set point. The sensor in the tank can also fail and turn the light on by mistake.",
      "H": "the fuel tank is nearly empty",
      "notH": "the fuel tank is not nearly empty",
      "E": "the low-fuel light comes on",
      "notE": "the low-fuel light stays off",
      "prior": "At the start of a random drive, the chance that the fuel tank is nearly empty is {p}.",
      "tp": "When the fuel tank is nearly empty, the low-fuel light comes on {tp} of the time.",
      "fn": "When the fuel tank is nearly empty, the low-fuel light fails to come on {fn} of the time.",
      "fp": "When the fuel tank is not nearly empty, the low-fuel light comes on anyway {fp} of the time.",
      "tn": "When the fuel tank is not nearly empty, the low-fuel light correctly stays off {tn} of the time.",
      "question": "The low-fuel light comes on at the start of a drive. What is the probability that the fuel tank is actually nearly empty?",
      "priorRange": [
        0.03,
        0.15
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "salad-freshness-label",
      "topic": "everyday",
      "setup": "A bag of prepared salad greens has a label that turns red when the leaves have started to spoil. The label can also change color if the bag was warm during shipping.",
      "H": "the greens in the bag have spoiled",
      "notH": "the greens in the bag are still fresh",
      "E": "the freshness label turns red",
      "notE": "the freshness label stays green",
      "prior": "Of all bags of prepared greens on the shelf, {p} have spoiled.",
      "tp": "When the greens have spoiled, the label turns red {tp} of the time.",
      "fn": "When the greens have spoiled, the label stays green {fn} of the time.",
      "fp": "When the greens are still fresh, the label turns red anyway {fp} of the time.",
      "tn": "When the greens are still fresh, the label stays green {tn} of the time.",
      "question": "The freshness label on a bag has turned red. What is the probability that the greens inside have actually spoiled?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "goal-line-camera",
      "topic": "sports",
      "setup": "A goal-line camera system watches a shot that appears to cross the line. It signals a goal when it tracks the ball fully over the line.",
      "H": "the ball fully crossed the goal line",
      "notH": "the ball did not fully cross the goal line",
      "E": "the system signals a goal",
      "notE": "the system does not signal a goal",
      "prior": "Of the shots taken close to the goal line in a match, {p} fully cross it.",
      "tp": "When the ball fully crosses the line, the system signals a goal {tp} of the time.",
      "fn": "When the ball fully crosses the line, the system fails to signal a goal {fn} of the time.",
      "fp": "When the ball does not fully cross the line, the system signals a goal anyway {fp} of the time.",
      "tn": "When the ball does not fully cross the line, the system correctly signals no goal {tn} of the time.",
      "question": "The system signals a goal. What is the probability that the ball actually crossed the line completely?",
      "priorRange": [
        0.1,
        0.4
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.04
      ]
    },
    {
      "id": "stadium-ticket-scanner",
      "topic": "sports",
      "setup": "A stadium gate scanner reads the barcode on each ticket. It flags any ticket that was already scanned at an earlier gate.",
      "H": "the ticket has already been used by someone else",
      "notH": "the ticket has not already been used by someone else",
      "E": "the scanner flags the ticket as already used",
      "notE": "the scanner does not flag the ticket as already used",
      "prior": "Of all tickets presented at this gate on game day, {p} have already been used by someone else.",
      "tp": "When a ticket has already been used by someone else, the scanner flags it {tp} of the time.",
      "fn": "When a ticket has already been used by someone else, the scanner fails to flag it {fn} of the time.",
      "fp": "When a ticket has not already been used by someone else, the scanner flags it anyway {fp} of the time.",
      "tn": "When a ticket has not already been used by someone else, the scanner correctly leaves it unflagged {tn} of the time.",
      "question": "The scanner flags a ticket as already used. What is the probability that the ticket has actually already been used by someone else?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "bowling-pin-sensor",
      "topic": "sports",
      "setup": "A bowling lane has pin sensors that count the pins still standing after each roll. The sensor reports a strike when no pins are left standing.",
      "H": "the bowler knocked down every pin",
      "notH": "the bowler did not knock down every pin",
      "E": "the sensor reports a strike",
      "notE": "the sensor does not report a strike",
      "prior": "Of all first rolls on this lane, {p} knock down every pin.",
      "tp": "When the bowler knocks down every pin, the sensor reports a strike {tp} of the time.",
      "fn": "When the bowler knocks down every pin, the sensor fails to report a strike {fn} of the time.",
      "fp": "When the bowler does not knock down every pin, the sensor reports a strike anyway {fp} of the time.",
      "tn": "When the bowler does not knock down every pin, the sensor correctly reports no strike {tn} of the time.",
      "question": "The sensor reports a strike on a roll. What is the probability that the bowler actually knocked down every pin?",
      "priorRange": [
        0.05,
        0.2
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "shot-clock-sensor",
      "topic": "sports",
      "setup": "A basketball arena uses a shot clock sensor that starts when the offense gains possession. The sensor signals a violation if the team does not shoot before the clock runs out.",
      "H": "the offense failed to shoot before the clock ran out",
      "notH": "the offense shot before the clock ran out",
      "E": "the sensor signals a shot clock violation",
      "notE": "the sensor does not signal a shot clock violation",
      "prior": "Of all possessions in a game, {p} end with the offense failing to shoot before the clock runs out.",
      "tp": "When the offense fails to shoot in time, the sensor signals a violation {tp} of the time.",
      "fn": "When the offense fails to shoot in time, the sensor fails to signal a violation {fn} of the time.",
      "fp": "When the offense does shoot in time, the sensor signals a violation anyway {fp} of the time.",
      "tn": "When the offense does shoot in time, the sensor correctly signals no violation {tn} of the time.",
      "question": "The sensor signals a shot clock violation. What is the probability that the offense actually failed to shoot in time?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "ski-race-start-gate",
      "topic": "sports",
      "setup": "A ski race uses a start gate with a light sensor. The sensor flags a false start when a racer leaves the gate before the starting signal sounds.",
      "H": "the racer left the gate before the starting signal",
      "notH": "the racer left the gate after the starting signal",
      "E": "the sensor flags a false start",
      "notE": "the sensor does not flag a false start",
      "prior": "Of all racers who line up at the gate, {p} leave before the starting signal.",
      "tp": "When a racer leaves before the starting signal, the sensor flags a false start {tp} of the time.",
      "fn": "When a racer leaves before the starting signal, the sensor fails to flag a false start {fn} of the time.",
      "fp": "When a racer leaves after the starting signal, the sensor flags a false start anyway {fp} of the time.",
      "tn": "When a racer leaves after the starting signal, the sensor correctly flags no false start {tn} of the time.",
      "question": "The sensor flags a false start. What is the probability that the racer actually left before the starting signal?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "orchard-frost-warning",
      "topic": "nature",
      "setup": "A fruit grower has a temperature sensor among the apple trees. The sensor sends a warning when the air near the blossoms drops to a damaging level.",
      "H": "the blossoms will suffer frost damage tonight",
      "notH": "the blossoms will not suffer frost damage tonight",
      "E": "the sensor sends a frost warning",
      "notE": "the sensor does not send a frost warning",
      "prior": "On a night in early spring, the chance that the blossoms suffer frost damage is {p}.",
      "tp": "When the blossoms suffer frost damage, the sensor sends a frost warning {tp} of the time.",
      "fn": "When the blossoms suffer frost damage, the sensor fails to send a frost warning {fn} of the time.",
      "fp": "When the blossoms do not suffer frost damage, the sensor sends a frost warning anyway {fp} of the time.",
      "tn": "When the blossoms do not suffer frost damage, the sensor correctly sends no frost warning {tn} of the time.",
      "question": "The sensor sends a frost warning. What is the probability that the blossoms will actually suffer frost damage tonight?",
      "priorRange": [
        0.05,
        0.2
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.05,
        0.2
      ]
    },
    {
      "id": "campus-forecast-rain",
      "topic": "nature",
      "setup": "A weather model predicts rain for a campus quad each afternoon. The model's output is a forecast of rain or no rain for the afternoon.",
      "H": "measurable rain falls on the quad this afternoon",
      "notH": "no measurable rain falls on the quad this afternoon",
      "E": "the model predicts rain for the afternoon",
      "notE": "the model predicts no rain for the afternoon",
      "prior": "On a typical spring afternoon, the chance of measurable rain on the quad is {p}.",
      "tp": "When measurable rain falls on the quad, the model predicts rain {tp} of the time.",
      "fn": "When measurable rain falls on the quad, the model fails to predict rain {fn} of the time.",
      "fp": "When no measurable rain falls on the quad, the model predicts rain anyway {fp} of the time.",
      "tn": "When no measurable rain falls on the quad, the model correctly predicts no rain {tn} of the time.",
      "question": "The model predicts rain for the afternoon. What is the probability that measurable rain will actually fall on the quad?",
      "priorRange": [
        0.2,
        0.5
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.1,
        0.25
      ]
    },
    {
      "id": "ranger-station-smoke-sensor",
      "topic": "nature",
      "setup": "A ranger station has a sensor that samples the air for smoke particles. The sensor sends an alert when particle levels rise sharply, and fog or dust can also raise them.",
      "H": "a wildfire is burning in the forest near the station",
      "notH": "no wildfire is burning in the forest near the station",
      "E": "the sensor sends a smoke alert",
      "notE": "the sensor does not send a smoke alert",
      "prior": "On a random summer afternoon, the chance that a wildfire is burning in the forest near the station is {p}.",
      "tp": "When a wildfire is burning nearby, the sensor sends a smoke alert {tp} of the time.",
      "fn": "When a wildfire is burning nearby, the sensor fails to send a smoke alert {fn} of the time.",
      "fp": "When no wildfire is burning nearby, the sensor sends a smoke alert anyway {fp} of the time.",
      "tn": "When no wildfire is burning nearby, the sensor correctly sends no smoke alert {tn} of the time.",
      "question": "The sensor sends a smoke alert. What is the probability that a wildfire is actually burning in the forest near the station?",
      "priorRange": [
        0.001,
        0.02
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "trail-camera-deer",
      "topic": "nature",
      "setup": "A wildlife biologist mounts a trail camera beside a forest path. The camera takes a photo whenever its motion sensor is triggered, and wind can trigger it too.",
      "H": "a deer is passing the camera",
      "notH": "no deer is passing the camera",
      "E": "the camera is triggered",
      "notE": "the camera is not triggered",
      "prior": "On a given night, the chance that a deer passes this camera is {p}.",
      "tp": "When a deer passes the camera, the camera is triggered {tp} of the time.",
      "fn": "When a deer passes the camera, the camera fails to be triggered {fn} of the time.",
      "fp": "When no deer passes the camera, the camera is triggered anyway {fp} of the time.",
      "tn": "When no deer passes the camera, the camera correctly stays idle {tn} of the time.",
      "question": "The camera is triggered. What is the probability that a deer actually passed the camera?",
      "priorRange": [
        0.1,
        0.4
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.05,
        0.25
      ]
    },
    {
      "id": "egg-crack-scanner",
      "topic": "nature",
      "setup": "A poultry farm sends eggs past a light scanner on a conveyor belt. The scanner flags any egg whose shell may be cracked.",
      "H": "the egg has a crack in the shell",
      "notH": "the egg does not have a crack in the shell",
      "E": "the scanner flags the egg",
      "notE": "the scanner does not flag the egg",
      "prior": "Of all eggs on the conveyor belt, {p} have a crack in the shell.",
      "tp": "When an egg has a crack in the shell, the scanner flags the egg {tp} of the time.",
      "fn": "When an egg has a crack in the shell, the scanner fails to flag the egg {fn} of the time.",
      "fp": "When an egg has no crack in the shell, the scanner flags the egg anyway {fp} of the time.",
      "tn": "When an egg has no crack in the shell, the scanner correctly passes the egg {tn} of the time.",
      "question": "The scanner flags an egg. What is the probability that the egg actually has a crack in the shell?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "bottle-cap-seal-check",
      "topic": "manufacturing",
      "setup": "A camera checks each bottle cap on the packaging line for a seal that is not fully pressed down. Caps that fail the check are pulled from the line.",
      "H": "the bottle cap has a faulty seal",
      "notH": "the bottle cap has a good seal",
      "E": "the camera flags the bottle cap",
      "notE": "the camera does not flag the bottle cap",
      "prior": "Of the caps coming off the line, {p} have a faulty seal.",
      "tp": "When a cap has a faulty seal, the camera flags it {tp} of the time.",
      "fn": "When a cap has a faulty seal, the camera fails to flag it {fn} of the time.",
      "fp": "When a cap has a good seal, the camera flags it anyway {fp} of the time.",
      "tn": "When a cap has a good seal, the camera correctly leaves it unflagged {tn} of the time.",
      "question": "The camera flags a bottle cap. What is the probability that the cap actually has a faulty seal?",
      "priorRange": [
        0.005,
        0.05
      ],
      "tpRange": [
        0.9,
        0.97
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "circuit-board-solder-joint",
      "topic": "manufacturing",
      "setup": "An inspection machine uses a laser to scan the solder joints on each circuit board. It rejects any board where a joint looks faulty.",
      "H": "the board has a faulty solder joint",
      "notH": "the board has no faulty solder joint",
      "E": "the machine rejects the board",
      "notE": "the machine passes the board",
      "prior": "Of all boards coming off the assembly line, {p} have a faulty solder joint.",
      "tp": "When a board has a faulty solder joint, the machine rejects it {tp} of the time.",
      "fn": "When a board has a faulty solder joint, the machine fails to reject it {fn} of the time.",
      "fp": "When a board has no faulty solder joint, the machine rejects it anyway {fp} of the time.",
      "tn": "When a board has no faulty solder joint, the machine correctly passes it {tn} of the time.",
      "question": "The machine rejects a circuit board. What is the probability that the board actually has a faulty solder joint?",
      "priorRange": [
        0.01,
        0.08
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.1
      ]
    },
    {
      "id": "paint-batch-color-sensor",
      "topic": "manufacturing",
      "setup": "A paint plant runs a color sensor over each batch before it is canned. The sensor holds any batch that falls outside the approved shade.",
      "H": "the paint batch is outside the approved shade",
      "notH": "the paint batch is inside the approved shade",
      "E": "the sensor holds the batch",
      "notE": "the sensor releases the batch",
      "prior": "Of all paint batches mixed at this plant, {p} fall outside the approved shade.",
      "tp": "When a batch falls outside the approved shade, the sensor holds it {tp} of the time.",
      "fn": "When a batch falls outside the approved shade, the sensor releases it {fn} of the time.",
      "fp": "When a batch is inside the approved shade, the sensor holds it anyway {fp} of the time.",
      "tn": "When a batch is inside the approved shade, the sensor releases it {tn} of the time.",
      "question": "The sensor holds a paint batch. What is the probability that the batch actually falls outside the approved shade?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "stamping-press-die-sensor",
      "topic": "manufacturing",
      "setup": "A metal stamping press has a vibration sensor on its die. The sensor flags a die for replacement when its vibration pattern changes sharply.",
      "H": "the die is worn beyond safe use",
      "notH": "the die is still within safe use",
      "E": "the sensor flags the die for replacement",
      "notE": "the sensor does not flag the die for replacement",
      "prior": "Of all dies in use at this plant, {p} are worn beyond safe use.",
      "tp": "When a die is worn beyond safe use, the sensor flags it for replacement {tp} of the time.",
      "fn": "When a die is worn beyond safe use, the sensor fails to flag it for replacement {fn} of the time.",
      "fp": "When a die is still within safe use, the sensor flags it for replacement anyway {fp} of the time.",
      "tn": "When a die is still within safe use, the sensor does not flag it for replacement {tn} of the time.",
      "question": "The sensor flags a die for replacement. What is the probability that the die is actually worn beyond safe use?",
      "priorRange": [
        0.01,
        0.1
      ],
      "tpRange": [
        0.75,
        0.9
      ],
      "fpRange": [
        0.05,
        0.2
      ]
    },
    {
      "id": "battery-cell-tester",
      "topic": "manufacturing",
      "setup": "A battery plant tests each cell with a short electrical load. The tester labels a cell as weak when its voltage drops too fast under the load.",
      "H": "the battery cell holds less than its rated charge",
      "notH": "the battery cell holds its full rated charge",
      "E": "the tester labels the cell as weak",
      "notE": "the tester does not label the cell as weak",
      "prior": "Of all cells produced in a day, {p} hold less than their rated charge.",
      "tp": "When a cell holds less than its rated charge, the tester labels it as weak {tp} of the time.",
      "fn": "When a cell holds less than its rated charge, the tester fails to label it as weak {fn} of the time.",
      "fp": "When a cell holds its full rated charge, the tester labels it as weak anyway {fp} of the time.",
      "tn": "When a cell holds its full rated charge, the tester correctly does not label it as weak {tn} of the time.",
      "question": "The tester labels a cell as weak. What is the probability that the cell actually holds less than its rated charge?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.95
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "ear-infection-tympanometer",
      "topic": "medical",
      "setup": "A pediatrician places a small probe against a child's ear canal during a clinic visit. The device measures eardrum movement and flags fluid behind the eardrum.",
      "H": "the child has fluid in the middle ear",
      "notH": "the child does not have fluid in the middle ear",
      "E": "the device flags fluid behind the eardrum",
      "notE": "the device does not flag fluid behind the eardrum",
      "prior": "Of all children checked at the clinic for ear pain, {p} have fluid in the middle ear.",
      "tp": "When a child has fluid in the middle ear, the device flags fluid {tp} of the time.",
      "fn": "When a child has fluid in the middle ear, the device fails to flag fluid {fn} of the time.",
      "fp": "When a child has no fluid in the middle ear, the device flags fluid anyway {fp} of the time.",
      "tn": "When a child has no fluid in the middle ear, the device correctly flags no fluid {tn} of the time.",
      "question": "The device flags fluid behind a child's eardrum. What is the probability that the child actually has fluid in the middle ear?",
      "priorRange": [
        0.1,
        0.3
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.05,
        0.15
      ]
    },
    {
      "id": "sleep-apnea-finger-monitor",
      "topic": "medical",
      "setup": "A patient wears a clip-on finger sensor overnight at home to screen for breathing pauses during sleep. The monitor flags the night as abnormal when blood oxygen drops repeatedly.",
      "H": "the patient has obstructive sleep apnea",
      "notH": "the patient does not have obstructive sleep apnea",
      "E": "the overnight monitor flags the night as abnormal",
      "notE": "the overnight monitor does not flag the night as abnormal",
      "prior": "Of all patients sent home with this overnight monitor, {p} have obstructive sleep apnea.",
      "tp": "When a patient has obstructive sleep apnea, the monitor flags the night as abnormal {tp} of the time.",
      "fn": "When a patient has obstructive sleep apnea, the monitor fails to flag the night as abnormal {fn} of the time.",
      "fp": "When a patient does not have obstructive sleep apnea, the monitor flags the night as abnormal anyway {fp} of the time.",
      "tn": "When a patient does not have obstructive sleep apnea, the monitor correctly leaves the night unflagged {tn} of the time.",
      "question": "The overnight monitor flags a patient's night as abnormal. What is the probability that the patient actually has obstructive sleep apnea?",
      "priorRange": [
        0.1,
        0.3
      ],
      "tpRange": [
        0.8,
        0.94
      ],
      "fpRange": [
        0.05,
        0.18
      ]
    },
    {
      "id": "glaucoma-eye-puff-test",
      "topic": "medical",
      "setup": "An optometrist blows a gentle puff of air at a patient's eye to measure pressure inside the eyeball. The machine prints a warning when the pressure reading is high.",
      "H": "the patient has elevated eye pressure",
      "notH": "the patient has normal eye pressure",
      "E": "the machine prints a high-pressure warning",
      "notE": "the machine does not print a high-pressure warning",
      "prior": "Of all adults screened during routine eye exams, {p} have elevated eye pressure.",
      "tp": "When a patient has elevated eye pressure, the machine prints a warning {tp} of the time.",
      "fn": "When a patient has elevated eye pressure, the machine fails to print a warning {fn} of the time.",
      "fp": "When a patient has normal eye pressure, the machine prints a warning anyway {fp} of the time.",
      "tn": "When a patient has normal eye pressure, the machine correctly prints no warning {tn} of the time.",
      "question": "The machine prints a high-pressure warning for a patient. What is the probability that the patient actually has elevated eye pressure?",
      "priorRange": [
        0.02,
        0.08
      ],
      "tpRange": [
        0.8,
        0.92
      ],
      "fpRange": [
        0.04,
        0.12
      ]
    },
    {
      "id": "celiac-antibody-screen",
      "topic": "medical",
      "setup": "A clinic runs a blood screen on patients who report frequent stomach cramps after eating wheat. The lab marks the test positive when antibody levels exceed a threshold.",
      "H": "the patient has celiac disease",
      "notH": "the patient does not have celiac disease",
      "E": "the lab marks the antibody test positive",
      "notE": "the lab marks the antibody test negative",
      "prior": "Of all patients tested for frequent stomach cramps after eating wheat, {p} have celiac disease.",
      "tp": "When a patient has celiac disease, the lab marks the test positive {tp} of the time.",
      "fn": "When a patient has celiac disease, the lab marks the test negative {fn} of the time.",
      "fp": "When a patient does not have celiac disease, the lab marks the test positive anyway {fp} of the time.",
      "tn": "When a patient does not have celiac disease, the lab correctly marks the test negative {tn} of the time.",
      "question": "The lab marks a patient's antibody test positive. What is the probability that the patient actually has celiac disease?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "dining-hall-tray-sensor",
      "topic": "campus",
      "setup": "A conveyor belt in the campus dining hall carries dirty trays into the dish room. An overhead sensor sounds a chime when it detects a metal fork or spoon still sitting on a tray.",
      "H": "a piece of silverware is still on the tray",
      "notH": "no silverware is on the tray",
      "E": "the overhead sensor sounds a chime",
      "notE": "the overhead sensor stays quiet",
      "prior": "Of all trays placed on the dish return belt, {p} still have a piece of silverware on them.",
      "tp": "When a tray still has silverware on it, the sensor sounds a chime {tp} of the time.",
      "fn": "When a tray still has silverware on it, the sensor fails to sound a chime {fn} of the time.",
      "fp": "When a tray has no silverware on it, the sensor sounds a chime anyway {fp} of the time.",
      "tn": "When a tray has no silverware on it, the sensor correctly stays quiet {tn} of the time.",
      "question": "The overhead sensor sounds a chime as a tray passes. What is the probability that a piece of silverware is actually still on the tray?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "dorm-laundry-washer-app",
      "topic": "campus",
      "setup": "A residence hall laundry room connects each washing machine to a campus phone app. The app marks a machine as finished when vibration drops below a threshold.",
      "H": "the wash cycle has finished",
      "notH": "the wash cycle is still running",
      "E": "the app marks the washing machine as finished",
      "notE": "the app shows the washing machine as still running",
      "prior": "When a student checks the app during laundry hours, the chance that the wash cycle has finished is {p}.",
      "tp": "When the wash cycle has finished, the app marks the machine as finished {tp} of the time.",
      "fn": "When the wash cycle has finished, the app fails to mark the machine as finished {fn} of the time.",
      "fp": "When the wash cycle is still running, the app marks the machine as finished anyway {fp} of the time.",
      "tn": "When the wash cycle is still running, the app correctly shows the machine as running {tn} of the time.",
      "question": "The app marks a student's washing machine as finished. What is the probability that the wash cycle has actually finished?",
      "priorRange": [
        0.15,
        0.4
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "chemistry-fume-hood-alarm",
      "topic": "campus",
      "setup": "A teaching laboratory has airflow sensors inside its glass fume hoods. A red light flashes on the hood frame when exhaust airflow drops too low to clear chemical vapors safely.",
      "H": "the fume hood has low exhaust airflow",
      "notH": "the fume hood has normal exhaust airflow",
      "E": "the red light flashes on the hood frame",
      "notE": "the red light stays off on the hood frame",
      "prior": "At the start of a lab session, the chance that a given fume hood has low exhaust airflow is {p}.",
      "tp": "When a fume hood has low exhaust airflow, the red light flashes {tp} of the time.",
      "fn": "When a fume hood has low exhaust airflow, the red light fails to flash {fn} of the time.",
      "fp": "When a fume hood has normal exhaust airflow, the red light flashes anyway {fp} of the time.",
      "tn": "When a fume hood has normal exhaust airflow, the red light correctly stays off {tn} of the time.",
      "question": "The red light flashes on a fume hood during lab. What is the probability that the fume hood actually has low exhaust airflow?",
      "priorRange": [
        0.005,
        0.03
      ],
      "tpRange": [
        0.88,
        0.98
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "lecture-hall-microphone-light",
      "topic": "campus",
      "setup": "A campus media desk monitors wireless lapel microphones in large lecture halls. An indicator on the control panel turns amber when a microphone battery is running low.",
      "H": "the microphone battery is nearly dead",
      "notH": "the microphone battery has plenty of charge",
      "E": "the panel indicator turns amber",
      "notE": "the panel indicator stays green",
      "prior": "At the start of a morning class, the chance that a lapel microphone battery is nearly dead is {p}.",
      "tp": "When a microphone battery is nearly dead, the panel indicator turns amber {tp} of the time.",
      "fn": "When a microphone battery is nearly dead, the panel indicator stays green {fn} of the time.",
      "fp": "When a microphone battery has plenty of charge, the panel indicator turns amber anyway {fp} of the time.",
      "tn": "When a microphone battery has plenty of charge, the panel indicator stays green {tn} of the time.",
      "question": "The panel indicator turns amber before a lecture. What is the probability that the microphone battery is actually nearly dead?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.02,
        0.09
      ]
    },
    {
      "id": "laptop-overheat-sensor",
      "topic": "technology",
      "setup": "A laptop motherboard uses a thermal sensor near the processor to protect the chip from heat damage. The system pops up a cooling warning when it reads an unsafe temperature.",
      "H": "the processor is overheating",
      "notH": "the processor is within its safe temperature range",
      "E": "the system pops up a cooling warning",
      "notE": "the system does not pop up a cooling warning",
      "prior": "During a heavy workload, the chance that a laptop processor is overheating is {p}.",
      "tp": "When the processor is overheating, the system pops up a cooling warning {tp} of the time.",
      "fn": "When the processor is overheating, the system fails to pop up a cooling warning {fn} of the time.",
      "fp": "When the processor is within its safe temperature range, the system pops up a cooling warning anyway {fp} of the time.",
      "tn": "When the processor is within its safe temperature range, the system correctly shows no warning {tn} of the time.",
      "question": "The system pops up a cooling warning on a laptop. What is the probability that the processor is actually overheating?",
      "priorRange": [
        0.01,
        0.08
      ],
      "tpRange": [
        0.85,
        0.97
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "server-disk-failure-monitor",
      "topic": "technology",
      "setup": "A data center runs diagnostic software on its storage drives every night. The software flags a drive when it detects unusual read delays.",
      "H": "the storage drive is beginning to fail",
      "notH": "the storage drive is healthy",
      "E": "the software flags the storage drive",
      "notE": "the software does not flag the storage drive",
      "prior": "Of all storage drives checked during the nightly scan, {p} are beginning to fail.",
      "tp": "When a storage drive is beginning to fail, the software flags it {tp} of the time.",
      "fn": "When a storage drive is beginning to fail, the software fails to flag it {fn} of the time.",
      "fp": "When a storage drive is healthy, the software flags it anyway {fp} of the time.",
      "tn": "When a storage drive is healthy, the software correctly leaves it unflagged {tn} of the time.",
      "question": "The diagnostic software flags a storage drive during the nightly scan. What is the probability that the drive is actually beginning to fail?",
      "priorRange": [
        0.002,
        0.02
      ],
      "tpRange": [
        0.8,
        0.94
      ],
      "fpRange": [
        0.01,
        0.06
      ]
    },
    {
      "id": "code-plagiarism-scanner",
      "topic": "technology",
      "setup": "A computer science course runs student programming assignments through a similarity checker. The checker highlights a submission when its structure closely matches another file in the archive.",
      "H": "the program was copied from another student",
      "notH": "the program was written independently",
      "E": "the checker highlights the submission",
      "notE": "the checker does not highlight the submission",
      "prior": "Of all programs submitted for this assignment, {p} were copied from another student.",
      "tp": "When a program was copied from another student, the checker highlights it {tp} of the time.",
      "fn": "When a program was copied from another student, the checker fails to highlight it {fn} of the time.",
      "fp": "When a program was written independently, the checker highlights it anyway {fp} of the time.",
      "tn": "When a program was written independently, the checker correctly leaves it unhighlighted {tn} of the time.",
      "question": "The similarity checker highlights a student's submission. What is the probability that the program was actually copied from another student?",
      "priorRange": [
        0.02,
        0.12
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "email-attachment-virus-scan",
      "topic": "technology",
      "setup": "A company mail server scans every incoming spreadsheet attachment before delivering it. The scanner quarantines an attachment when it finds code that resembles a malicious macro.",
      "H": "the attachment contains a malicious macro",
      "notH": "the attachment is harmless",
      "E": "the scanner quarantines the attachment",
      "notE": "the scanner delivers the attachment normally",
      "prior": "Of all spreadsheet attachments sent to the company, {p} contain a malicious macro.",
      "tp": "When an attachment contains a malicious macro, the scanner quarantines it {tp} of the time.",
      "fn": "When an attachment contains a malicious macro, the scanner delivers it normally {fn} of the time.",
      "fp": "When an attachment is harmless, the scanner quarantines it anyway {fp} of the time.",
      "tn": "When an attachment is harmless, the scanner correctly delivers it normally {tn} of the time.",
      "question": "The scanner quarantines an incoming spreadsheet attachment. What is the probability that the attachment actually contains a malicious macro?",
      "priorRange": [
        0.002,
        0.02
      ],
      "tpRange": [
        0.88,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "weigh-station-axle-sensor",
      "topic": "legal",
      "setup": "A highway weigh station has plates in the pavement that measure truck weight as trucks roll through at low speed. A signal light directs the driver to pull over when the reading exceeds the legal limit.",
      "H": "the truck is over the legal weight limit",
      "notH": "the truck is within the legal weight limit",
      "E": "the signal light directs the truck to pull over",
      "notE": "the signal light waves the truck through",
      "prior": "Of all freight trucks that roll across the pavement plates, {p} are over the legal weight limit.",
      "tp": "When a truck is over the legal weight limit, the signal light directs it to pull over {tp} of the time.",
      "fn": "When a truck is over the legal weight limit, the signal light waves it through {fn} of the time.",
      "fp": "When a truck is within the legal weight limit, the signal light directs it to pull over anyway {fp} of the time.",
      "tn": "When a truck is within the legal weight limit, the signal light waves it through {tn} of the time.",
      "question": "The signal light directs a freight truck to pull over. What is the probability that the truck is actually over the legal weight limit?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "courthouse-bag-xray",
      "topic": "legal",
      "setup": "Visitors entering a county courthouse place their bags on an X-ray belt. The screening machine outlines dark metal shapes that resemble a pocketknife.",
      "H": "the bag contains a pocketknife",
      "notH": "the bag does not contain a pocketknife",
      "E": "the machine outlines a knife shape in the bag",
      "notE": "the machine does not outline a knife shape in the bag",
      "prior": "Of all visitor bags screened at the courthouse door, {p} contain a pocketknife.",
      "tp": "When a bag contains a pocketknife, the machine outlines a knife shape {tp} of the time.",
      "fn": "When a bag contains a pocketknife, the machine fails to outline a knife shape {fn} of the time.",
      "fp": "When a bag does not contain a pocketknife, the machine outlines a knife shape anyway {fp} of the time.",
      "tn": "When a bag does not contain a pocketknife, the machine correctly outlines no knife shape {tn} of the time.",
      "question": "The machine outlines a knife shape in a visitor's bag. What is the probability that the bag actually contains a pocketknife?",
      "priorRange": [
        0.005,
        0.03
      ],
      "tpRange": [
        0.85,
        0.97
      ],
      "fpRange": [
        0.02,
        0.09
      ]
    },
    {
      "id": "arson-accelerant-sniffer",
      "topic": "legal",
      "setup": "A fire investigator waves an electronic vapor detector over charred floorboards after a warehouse fire. The detector beeps when it senses hydrocarbon fumes from a liquid accelerant.",
      "H": "liquid accelerant is present in the floorboards",
      "notH": "no liquid accelerant is present in the floorboards",
      "E": "the vapor detector beeps over the floorboards",
      "notE": "the vapor detector stays silent over the floorboards",
      "prior": "Of all warehouse floor samples tested after fires in the district, {p} contain liquid accelerant.",
      "tp": "When liquid accelerant is present, the vapor detector beeps {tp} of the time.",
      "fn": "When liquid accelerant is present, the vapor detector fails to beep {fn} of the time.",
      "fp": "When no liquid accelerant is present, the vapor detector beeps anyway {fp} of the time.",
      "tn": "When no liquid accelerant is present, the vapor detector correctly stays silent {tn} of the time.",
      "question": "The vapor detector beeps over a sample of charred floorboards. What is the probability that liquid accelerant is actually present?",
      "priorRange": [
        0.05,
        0.2
      ],
      "tpRange": [
        0.8,
        0.94
      ],
      "fpRange": [
        0.04,
        0.15
      ]
    },
    {
      "id": "harbor-bilge-oil-sensor",
      "topic": "legal",
      "setup": "A harbor patrol boat dips an optical probe into water pumped from the bilge of commercial vessels. The probe flashes a warning when it detects petroleum sheen above the legal limit.",
      "H": "the vessel is discharging oily bilge water",
      "notH": "the vessel is discharging clean bilge water",
      "E": "the optical probe flashes a warning",
      "notE": "the optical probe does not flash a warning",
      "prior": "Of all commercial vessels inspected in the harbor, {p} are discharging oily bilge water.",
      "tp": "When a vessel is discharging oily bilge water, the probe flashes a warning {tp} of the time.",
      "fn": "When a vessel is discharging oily bilge water, the probe fails to flash a warning {fn} of the time.",
      "fp": "When a vessel is discharging clean bilge water, the probe flashes a warning anyway {fp} of the time.",
      "tn": "When a vessel is discharging clean bilge water, the probe correctly flashes no warning {tn} of the time.",
      "question": "The optical probe flashes a warning during a vessel inspection. What is the probability that the vessel is actually discharging oily bilge water?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "basement-water-leak-puck",
      "topic": "everyday",
      "setup": "A homeowner places a small battery-powered moisture puck on the floor beside the water heater. The puck sounds a buzzer when water bridges its metal contacts, though heavy dampness can also trigger it.",
      "H": "the water heater is leaking onto the floor",
      "notH": "the water heater is not leaking onto the floor",
      "E": "the moisture puck sounds its buzzer",
      "notE": "the moisture puck stays silent",
      "prior": "In any given week, the chance that the water heater leaks onto the floor is {p}.",
      "tp": "When the water heater is leaking, the moisture puck sounds its buzzer {tp} of the time.",
      "fn": "When the water heater is leaking, the moisture puck fails to sound its buzzer {fn} of the time.",
      "fp": "When the water heater is not leaking, the moisture puck sounds its buzzer anyway {fp} of the time.",
      "tn": "When the water heater is not leaking, the moisture puck correctly stays silent {tn} of the time.",
      "question": "The moisture puck sounds its buzzer in the basement. What is the probability that the water heater is actually leaking?",
      "priorRange": [
        0.002,
        0.02
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.06
      ]
    },
    {
      "id": "tire-pressure-dash-icon",
      "topic": "everyday",
      "setup": "A passenger car uses wheel sensors to monitor air pressure in its tires. An amber icon lights up on the dashboard when a tire drops below the recommended pressure, or sometimes when cold air causes a brief dip.",
      "H": "a tire has a slow puncture",
      "notH": "none of the tires has a slow puncture",
      "E": "the tire-pressure icon lights up on the dashboard",
      "notE": "the tire-pressure icon stays off on the dashboard",
      "prior": "At the start of a morning commute, the chance that a tire on the car has a slow puncture is {p}.",
      "tp": "When a tire has a slow puncture, the dashboard icon lights up {tp} of the time.",
      "fn": "When a tire has a slow puncture, the dashboard icon fails to light up {fn} of the time.",
      "fp": "When no tire has a slow puncture, the dashboard icon lights up anyway {fp} of the time.",
      "tn": "When no tire has a slow puncture, the dashboard icon correctly stays off {tn} of the time.",
      "question": "The tire-pressure icon lights up on the dashboard. What is the probability that a tire actually has a slow puncture?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "stud-finder-wall-beep",
      "topic": "everyday",
      "setup": "A resident slides an electronic stud finder across a living room wall before hanging a heavy mirror. The tool lights up when it senses dense material behind the drywall.",
      "H": "there is a wooden stud behind that spot on the wall",
      "notH": "there is hollow space behind that spot on the wall",
      "E": "the stud finder lights up",
      "notE": "the stud finder stays dark",
      "prior": "Of all spots tested along a wall, {p} have a wooden stud behind them.",
      "tp": "When a wooden stud is behind the spot, the stud finder lights up {tp} of the time.",
      "fn": "When a wooden stud is behind the spot, the stud finder stays dark {fn} of the time.",
      "fp": "When hollow space is behind the spot, the stud finder lights up anyway {fp} of the time.",
      "tn": "When hollow space is behind the spot, the stud finder stays dark {tn} of the time.",
      "question": "The stud finder lights up at a spot on the wall. What is the probability that there is actually a wooden stud behind that spot?",
      "priorRange": [
        0.08,
        0.2
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.04,
        0.15
      ]
    },
    {
      "id": "meat-thermometer-chime",
      "topic": "everyday",
      "setup": "A home cook inserts a digital probe thermometer into a roast in the oven. The thermometer unit on the counter chimes when the probe tip reaches the target temperature.",
      "H": "the center of the roast is fully cooked",
      "notH": "the center of the roast is still undercooked",
      "E": "the thermometer unit chimes",
      "notE": "the thermometer unit does not chime",
      "prior": "At the time the cook checks the oven, the chance that the center of the roast is fully cooked is {p}.",
      "tp": "When the center of the roast is fully cooked, the thermometer chimes {tp} of the time.",
      "fn": "When the center of the roast is fully cooked, the thermometer fails to chime {fn} of the time.",
      "fp": "When the center of the roast is still undercooked, the thermometer chimes anyway {fp} of the time.",
      "tn": "When the center of the roast is still undercooked, the thermometer correctly stays silent {tn} of the time.",
      "question": "The thermometer unit chimes on the counter. What is the probability that the center of the roast is actually fully cooked?",
      "priorRange": [
        0.2,
        0.5
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.05,
        0.15
      ]
    },
    {
      "id": "tennis-line-camera",
      "topic": "sports",
      "setup": "A tennis court uses high-speed cameras to track where each serve lands near the service line. An automated speaker calls the ball out when the system calculates that the ball landed beyond the line.",
      "H": "the serve landed outside the service box",
      "notH": "the serve touched the line or landed inside the service box",
      "E": "the automated speaker calls the ball out",
      "notE": "the automated speaker stays silent",
      "prior": "Of all fast serves aimed near the back of the service box, {p} land outside the box.",
      "tp": "When a serve lands outside the box, the speaker calls it out {tp} of the time.",
      "fn": "When a serve lands outside the box, the speaker stays silent {fn} of the time.",
      "fp": "When a serve touches the line or lands inside, the speaker calls it out anyway {fp} of the time.",
      "tn": "When a serve touches the line or lands inside, the speaker stays silent {tn} of the time.",
      "question": "The automated speaker calls a serve out. What is the probability that the serve actually landed outside the service box?",
      "priorRange": [
        0.15,
        0.4
      ],
      "tpRange": [
        0.9,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "fencing-vest-touch-light",
      "topic": "sports",
      "setup": "In foil fencing, each competitor wears a metallic vest wired to a scoring box. A colored lamp on the box lights up when the tip of an opponent's blade presses against the vest.",
      "H": "the blade tip landed squarely on the target vest",
      "notH": "the blade tip missed the target vest",
      "E": "the scoring lamp lights up",
      "notE": "the scoring lamp stays dark",
      "prior": "Of all lunges made during a bout, {p} land squarely on the opponent's target vest.",
      "tp": "When a lunge lands squarely on the target vest, the scoring lamp lights up {tp} of the time.",
      "fn": "When a lunge lands squarely on the target vest, the scoring lamp fails to light up {fn} of the time.",
      "fp": "When a lunge misses the target vest, the scoring lamp lights up anyway {fp} of the time.",
      "tn": "When a lunge misses the target vest, the scoring lamp correctly stays dark {tn} of the time.",
      "question": "The scoring lamp lights up after a lunge. What is the probability that the blade tip actually landed squarely on the target vest?",
      "priorRange": [
        0.15,
        0.4
      ],
      "tpRange": [
        0.88,
        0.97
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "swimming-relay-touchpad",
      "topic": "sports",
      "setup": "A competitive swimming pool has electronic touchpads on the wall and sensors on the starting blocks. The timing console flags a relay exchange when a swimmer leaves the block before the incoming teammate touches the wall.",
      "H": "the outgoing swimmer left the block too early",
      "notH": "the outgoing swimmer waited for the wall touch",
      "E": "the timing console flags the relay exchange",
      "notE": "the timing console clears the relay exchange",
      "prior": "Of all relay exchanges in a college swim meet, {p} have an outgoing swimmer who leaves the block too early.",
      "tp": "When an outgoing swimmer leaves too early, the console flags the exchange {tp} of the time.",
      "fn": "When an outgoing swimmer leaves too early, the console clears the exchange {fn} of the time.",
      "fp": "When an outgoing swimmer waits for the wall touch, the console flags the exchange anyway {fp} of the time.",
      "tn": "When an outgoing swimmer waits for the wall touch, the console clears the exchange {tn} of the time.",
      "question": "The timing console flags a relay exchange. What is the probability that the outgoing swimmer actually left the block too early?",
      "priorRange": [
        0.01,
        0.05
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "beehive-mite-acoustic-sensor",
      "topic": "nature",
      "setup": "A beekeeper places a small microphone inside a hive to listen for changes in the colony's hum. The device sends an alert when the sound pattern matches a hive infested with parasitic mites.",
      "H": "the hive has a mite infestation",
      "notH": "the hive is free of mites",
      "E": "the acoustic device sends an infestation alert",
      "notE": "the acoustic device sends no alert",
      "prior": "Of all hives inspected in the county each summer, {p} have a mite infestation.",
      "tp": "When a hive has a mite infestation, the device sends an alert {tp} of the time.",
      "fn": "When a hive has a mite infestation, the device fails to send an alert {fn} of the time.",
      "fp": "When a hive is free of mites, the device sends an alert anyway {fp} of the time.",
      "tn": "When a hive is free of mites, the device correctly sends no alert {tn} of the time.",
      "question": "The acoustic device sends an infestation alert for a hive. What is the probability that the hive actually has a mite infestation?",
      "priorRange": [
        0.08,
        0.25
      ],
      "tpRange": [
        0.75,
        0.9
      ],
      "fpRange": [
        0.05,
        0.18
      ]
    },
    {
      "id": "grain-silo-moisture-probe",
      "topic": "nature",
      "setup": "A farm cooperative stores harvested wheat in tall metal silos equipped with humidity probes. A control panel warns the operator when a pocket of damp grain starts to heat up and mold.",
      "H": "mold is growing in the stored grain",
      "notH": "the stored grain is dry and sound",
      "E": "the control panel shows a mold warning",
      "notE": "the control panel shows no warning",
      "prior": "Of all grain silos checked during late summer, {p} have mold growing in the stored grain.",
      "tp": "When mold is growing in the grain, the control panel shows a warning {tp} of the time.",
      "fn": "When mold is growing in the grain, the control panel fails to show a warning {fn} of the time.",
      "fp": "When the grain is dry and sound, the control panel shows a warning anyway {fp} of the time.",
      "tn": "When the grain is dry and sound, the control panel correctly shows no warning {tn} of the time.",
      "question": "The control panel shows a mold warning for a silo. What is the probability that mold is actually growing in the stored grain?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.8,
        0.94
      ],
      "fpRange": [
        0.03,
        0.12
      ]
    },
    {
      "id": "river-buoy-algae-sensor",
      "topic": "nature",
      "setup": "An environmental agency anchors a floating sensor buoy in a reservoir during warm weather. The buoy transmits an alert when water fluorescence points to a harmful algae bloom.",
      "H": "a harmful algae bloom is forming in the reservoir",
      "notH": "no harmful algae bloom is forming in the reservoir",
      "E": "the buoy transmits an algae alert",
      "notE": "the buoy does not transmit an algae alert",
      "prior": "In a given summer week, the chance that a harmful algae bloom is forming in the reservoir is {p}.",
      "tp": "When a harmful algae bloom is forming, the buoy transmits an alert {tp} of the time.",
      "fn": "When a harmful algae bloom is forming, the buoy fails to transmit an alert {fn} of the time.",
      "fp": "When no harmful algae bloom is forming, the buoy transmits an alert anyway {fp} of the time.",
      "tn": "When no harmful algae bloom is forming, the buoy correctly transmits no alert {tn} of the time.",
      "question": "The buoy transmits an algae alert from the reservoir. What is the probability that a harmful algae bloom is actually forming?",
      "priorRange": [
        0.03,
        0.15
      ],
      "tpRange": [
        0.8,
        0.95
      ],
      "fpRange": [
        0.04,
        0.14
      ]
    },
    {
      "id": "ash-tree-borer-trap",
      "topic": "nature",
      "setup": "A forester hangs purple prism traps in ash trees along the edge of a park to watch for wood-boring beetles. A trap is marked positive when an inspector finds suspect beetles stuck to the glue surface.",
      "H": "the ash grove is infested with wood-boring beetles",
      "notH": "the ash grove is free of wood-boring beetles",
      "E": "the trap is marked positive by the inspector",
      "notE": "the trap is marked negative by the inspector",
      "prior": "Of all ash groves monitored across the region, {p} are infested with wood-boring beetles.",
      "tp": "When a grove is infested with wood-boring beetles, the trap is marked positive {tp} of the time.",
      "fn": "When a grove is infested with wood-boring beetles, the trap is marked negative {fn} of the time.",
      "fp": "When a grove is free of wood-boring beetles, look-alike insects cause the trap to be marked positive anyway {fp} of the time.",
      "tn": "When a grove is free of wood-boring beetles, the trap is correctly marked negative {tn} of the time.",
      "question": "A trap in an ash grove is marked positive by the inspector. What is the probability that the grove is actually infested with wood-boring beetles?",
      "priorRange": [
        0.02,
        0.12
      ],
      "tpRange": [
        0.75,
        0.9
      ],
      "fpRange": [
        0.03,
        0.1
      ]
    },
    {
      "id": "glass-jar-vacuum-tapper",
      "topic": "manufacturing",
      "setup": "A cannery passes sealed jam jars under an acoustic tapper that strikes each metal lid with a small pulse. The machine diverts any jar whose lid rings at the wrong pitch because the vacuum seal failed.",
      "H": "the jam jar has a loose lid",
      "notH": "the jam jar has a tight vacuum seal",
      "E": "the tapper diverts the jar",
      "notE": "the tapper lets the jar pass",
      "prior": "Of all jam jars coming out of the cooling tunnel, {p} have a loose lid.",
      "tp": "When a jar has a loose lid, the tapper diverts it {tp} of the time.",
      "fn": "When a jar has a loose lid, the tapper lets it pass {fn} of the time.",
      "fp": "When a jar has a tight vacuum seal, the tapper diverts it anyway {fp} of the time.",
      "tn": "When a jar has a tight vacuum seal, the tapper lets it pass {tn} of the time.",
      "question": "The acoustic tapper diverts a jam jar from the line. What is the probability that the jar actually has a loose lid?",
      "priorRange": [
        0.004,
        0.03
      ],
      "tpRange": [
        0.88,
        0.98
      ],
      "fpRange": [
        0.01,
        0.05
      ]
    },
    {
      "id": "ceramic-tile-ultrasound",
      "topic": "manufacturing",
      "setup": "A kiln plant passes finished floor tiles beneath an ultrasonic scanner. The scanner marks a tile as a reject when sound waves bounce off an internal air pocket.",
      "H": "the ceramic tile has an internal air pocket",
      "notH": "the ceramic tile is solid throughout",
      "E": "the scanner marks the tile as a reject",
      "notE": "the scanner passes the tile",
      "prior": "Of all floor tiles coming out of the kiln, {p} have an internal air pocket.",
      "tp": "When a tile has an internal air pocket, the scanner marks it as a reject {tp} of the time.",
      "fn": "When a tile has an internal air pocket, the scanner passes it {fn} of the time.",
      "fp": "When a tile is solid throughout, the scanner marks it as a reject anyway {fp} of the time.",
      "tn": "When a tile is solid throughout, the scanner passes it {tn} of the time.",
      "question": "The ultrasonic scanner marks a floor tile as a reject. What is the probability that the tile actually has an internal air pocket?",
      "priorRange": [
        0.01,
        0.06
      ],
      "tpRange": [
        0.85,
        0.96
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    },
    {
      "id": "fabric-loom-optical-camera",
      "topic": "manufacturing",
      "setup": "A textile mill runs woven cotton cloth under a line-scan camera before rolling it onto bolts. The camera stops the roller when it spots a snagged thread in the weave.",
      "H": "the cloth section has a snagged thread",
      "notH": "the cloth section has an even weave",
      "E": "the camera stops the roller",
      "notE": "the camera lets the roller keep running",
      "prior": "Of all cloth sections inspected on the loom, {p} have a snagged thread.",
      "tp": "When a cloth section has a snagged thread, the camera stops the roller {tp} of the time.",
      "fn": "When a cloth section has a snagged thread, the camera lets the roller keep running {fn} of the time.",
      "fp": "When a cloth section has an even weave, the camera stops the roller anyway {fp} of the time.",
      "tn": "When a cloth section has an even weave, the camera lets the roller keep running {tn} of the time.",
      "question": "The line-scan camera stops the roller on a section of cloth. What is the probability that the cloth section actually has a snagged thread?",
      "priorRange": [
        0.02,
        0.1
      ],
      "tpRange": [
        0.8,
        0.94
      ],
      "fpRange": [
        0.02,
        0.08
      ]
    }
  ],
  "wrappers": {
    "complement": [
      {
        "id": "comp-umw-major",
        "text": "{p} of UMW students have declared a major. What is the probability that a randomly chosen UMW student has not declared a major?",
        "pRange": [
          0.5,
          0.9
        ]
      },
      {
        "id": "comp-fredericksburg-rain",
        "text": "In a typical year in Fredericksburg, {p} of the days have measurable rain. What is the probability that a randomly chosen day has no measurable rain?",
        "pRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "comp-library-study-room",
        "text": "{p} of the study rooms in the university library are booked at a given hour. What is the probability that a randomly chosen study room is not booked at that hour?",
        "pRange": [
          0.3,
          0.8
        ]
      },
      {
        "id": "comp-shuttle-on-time",
        "text": "{p} of the campus shuttle runs leave on time. What is the probability that a randomly chosen shuttle run does not leave on time?",
        "pRange": [
          0.6,
          0.95
        ]
      },
      {
        "id": "comp-orchard-bruising",
        "text": "{p} of the apples in a packing house show some bruising. What is the probability that a randomly chosen apple shows no bruising?",
        "pRange": [
          0.05,
          0.3
        ]
      },
      {
        "id": "comp-airport-flights",
        "text": "{p} of the flights from a regional airport arrive on time. What is the probability that a randomly chosen flight does not arrive on time?",
        "pRange": [
          0.7,
          0.9
        ]
      },
      {
        "id": "comp-mailing-list-opens",
        "text": "{p} of the messages sent to a campus mailing list are opened within a day. What is the probability that a randomly chosen message is not opened within a day?",
        "pRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "comp-bakery-loaves",
        "text": "{p} of the loaves from a bakery's morning batch sell before noon. What is the probability that a randomly chosen loaf is still unsold at noon?",
        "pRange": [
          0.4,
          0.9
        ]
      },
      {
        "id": "comp-gym-pool",
        "text": "{p} of the members of a campus gym use the pool. What is the probability that a randomly chosen member does not use the pool?",
        "pRange": [
          0.1,
          0.4
        ]
      },
      {
        "id": "comp-highway-carpool",
        "text": "{p} of the commuters on a Fredericksburg highway carpool. What is the probability that a randomly chosen commuter does not carpool?",
        "pRange": [
          0.05,
          0.3
        ]
      },
      {
        "id": "comp-umw-on-campus",
        "text": "{p} of UMW students live on campus. What is the probability that a randomly chosen UMW student does not live on campus?",
        "pRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "comp-seed-germination",
        "text": "{p} of the seeds in a packet germinate within a week. What is the probability that a randomly chosen seed does not germinate within a week?",
        "pRange": [
          0.6,
          0.95
        ]
      }
    ],
    "genadd": [
      {
        "id": "genadd-sport-band",
        "text": "{a} of the students in a campus survey play a sport, {b} play in a band, and {ab} do both. What is the probability that a randomly chosen student plays a sport or plays in a band (or both)?",
        "A": "plays a sport",
        "B": "plays in a band",
        "aRange": [
          0.2,
          0.4
        ],
        "bRange": [
          0.1,
          0.3
        ]
      },
      {
        "id": "genadd-car-off-campus",
        "text": "Among UMW students, {a} own a car, {b} live off campus, and {ab} do both. What is the probability that a randomly chosen UMW student owns a car or lives off campus (or both)?",
        "A": "owns a car",
        "B": "lives off campus",
        "aRange": [
          0.3,
          0.6
        ],
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "genadd-hikers-map-filter",
        "text": "In a group of hikers on a trail, {a} carry a map, {b} carry a water filter, and {ab} do both. What is the probability that a randomly chosen hiker carries a map or carries a water filter (or both)?",
        "A": "carries a map",
        "B": "carries a water filter",
        "aRange": [
          0.3,
          0.6
        ],
        "bRange": [
          0.1,
          0.4
        ]
      },
      {
        "id": "genadd-valley-rain-fog",
        "text": "In a river valley, {a} of mornings have rain, {b} have fog, and {ab} have both. What is the probability that a randomly chosen morning has rain or fog (or both)?",
        "A": "has rain",
        "B": "has fog",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.1,
          0.3
        ]
      },
      {
        "id": "genadd-seminar-glasses-bike",
        "text": "In a seminar of students, {a} wear glasses, {b} ride a bicycle to campus, and {ab} do both. What is the probability that a randomly chosen student wears glasses or rides a bicycle to campus (or both)?",
        "A": "wears glasses",
        "B": "rides a bicycle to campus",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "genadd-households-tomatoes-chickens",
        "text": "In a neighborhood survey, {a} of households grow tomatoes, {b} keep chickens, and {ab} do both. What is the probability that a randomly chosen household grows tomatoes or keeps chickens (or both)?",
        "A": "grows tomatoes",
        "B": "keeps chickens",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.1,
          0.3
        ]
      },
      {
        "id": "genadd-units-dog-cat",
        "text": "In an apartment complex, {a} of the units have a dog, {b} have a cat, and {ab} have both. What is the probability that a randomly chosen unit has a dog or has a cat (or both)?",
        "A": "has a dog",
        "B": "has a cat",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "genadd-route-early-bus-lunch",
        "text": "Among the commuters on a campus route, {a} take the early bus, {b} buy lunch on campus, and {ab} do both. What is the probability that a randomly chosen commuter takes the early bus or buys lunch on campus (or both)?",
        "A": "takes the early bus",
        "B": "buys lunch on campus",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.3,
          0.6
        ]
      },
      {
        "id": "genadd-college-job-club",
        "text": "At a small college, {a} of the students work a part-time job, {b} join a club, and {ab} do both. What is the probability that a randomly chosen student works a part-time job or joins a club (or both)?",
        "A": "works a part-time job",
        "B": "joins a club",
        "aRange": [
          0.3,
          0.6
        ],
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "genadd-diners-bottle-lunch",
        "text": "In a dining hall survey, {a} of diners use a reusable bottle, {b} bring lunch from home, and {ab} do both. What is the probability that a randomly chosen diner uses a reusable bottle or brings lunch from home (or both)?",
        "A": "uses a reusable bottle",
        "B": "brings lunch from home",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "genadd-cans-scratch-dent",
        "text": "In a shipment of cans, {a} have a scratch, {b} have a dent, and {ab} have both. What is the probability that a randomly chosen can has a scratch or has a dent (or both)?",
        "A": "has a scratch",
        "B": "has a dent",
        "aRange": [
          0.1,
          0.4
        ],
        "bRange": [
          0.1,
          0.3
        ]
      },
      {
        "id": "genadd-first-year-residence",
        "text": "At a small college, {a} of the students are first-year students, {b} live in a residence hall, and {ab} are both. What is the probability that a randomly chosen student is a first-year student or lives in a residence hall (or both)?",
        "A": "is a first-year student",
        "B": "lives in a residence hall",
        "aRange": [
          0.2,
          0.5
        ],
        "bRange": [
          0.3,
          0.6
        ]
      }
    ],
    "cond": [
      {
        "id": "cond-bicycle-shuttle",
        "text": "{b} of the students at a commuter campus ride the campus shuttle, and {ab} of all students both ride the shuttle and own a bicycle. Given that a randomly chosen student rides the campus shuttle, what is the probability that the student also owns a bicycle?",
        "A": "owns a bicycle",
        "B": "rides the campus shuttle",
        "bRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "cond-porch-garden",
        "text": "{b} of the homes in a Fredericksburg neighborhood have a garden, and {ab} of all homes have both a garden and a porch. Given that a randomly chosen home has a garden, what is the probability that the home also has a porch?",
        "A": "has a porch",
        "B": "has a garden",
        "bRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "cond-newspaper-sports",
        "text": "{b} of UMW students follow a local sports team, and {ab} of all UMW students both follow a local sports team and read the campus newspaper. Given that a randomly chosen UMW student follows a local sports team, what is the probability that the student also reads the campus newspaper?",
        "A": "reads the campus newspaper",
        "B": "follows a local sports team",
        "bRange": [
          0.3,
          0.7
        ]
      },
      {
        "id": "cond-library-card-study-room",
        "text": "{b} of the students in a residence hall use a study room, and {ab} of all students both use a study room and have a library card. Given that a randomly chosen student uses a study room, what is the probability that the student also has a library card?",
        "A": "has a library card",
        "B": "uses a study room",
        "bRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "cond-jacket-walk",
        "text": "{b} of the students at a commuter campus walk to campus, and {ab} of all students both walk to campus and own a rain jacket. Given that a randomly chosen student walks to campus, what is the probability that the student also owns a rain jacket?",
        "A": "owns a rain jacket",
        "B": "walks to campus",
        "bRange": [
          0.3,
          0.7
        ]
      },
      {
        "id": "cond-chess-team",
        "text": "{b} of the students in a campus club compete on a team, and {ab} of all club members both compete on a team and play chess. Given that a randomly chosen club member competes on a team, what is the probability that the member also plays chess?",
        "A": "plays chess",
        "B": "competes on a team",
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "cond-hiking-tent",
        "text": "{b} of the members of a campus outdoors group own a tent, and {ab} of all members both own a tent and enjoy hiking. Given that a randomly chosen member owns a tent, what is the probability that the member also enjoys hiking?",
        "A": "enjoys hiking",
        "B": "owns a tent",
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "cond-crates-visual-weight",
        "text": "{b} of the crates in a shipment pass the weight check, and {ab} of all crates both pass the weight check and pass the visual check. Given that a randomly chosen crate passes the weight check, what is the probability that the crate also passes the visual check?",
        "A": "passes the visual check",
        "B": "passes the weight check",
        "bRange": [
          0.4,
          0.8
        ]
      },
      {
        "id": "cond-senior-campus-job",
        "text": "{b} of the students in a campus survey have a campus job, and {ab} of all students both have a campus job and are seniors. Given that a randomly chosen student has a campus job, what is the probability that the student is also a senior?",
        "A": "is a senior",
        "B": "has a campus job",
        "bRange": [
          0.2,
          0.5
        ]
      },
      {
        "id": "cond-bag-farmers-market",
        "text": "{b} of the customers in a grocery survey shop at the farmers market, and {ab} of all customers both shop at the farmers market and carry a reusable bag. Given that a randomly chosen customer shops at the farmers market, what is the probability that the customer also carries a reusable bag?",
        "A": "carries a reusable bag",
        "B": "shops at the farmers market",
        "bRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "cond-morning-class-off-campus",
        "text": "{b} of UMW students live off campus, and {ab} of all UMW students both live off campus and take a morning class. Given that a randomly chosen UMW student lives off campus, what is the probability that the student also takes a morning class?",
        "A": "takes a morning class",
        "B": "lives off campus",
        "bRange": [
          0.3,
          0.7
        ]
      },
      {
        "id": "cond-kayak-river",
        "text": "{b} of the residents of a river town live near the river, and {ab} of all residents both live near the river and own a kayak. Given that a randomly chosen resident lives near the river, what is the probability that the resident also owns a kayak?",
        "A": "owns a kayak",
        "B": "lives near the river",
        "bRange": [
          0.2,
          0.5
        ]
      }
    ],
    "mult": [
      {
        "id": "mult-laptop-tablet",
        "text": "{a} of the students at a small college carry a laptop to class. Of those students, {c} also keep a tablet in their bag. What is the probability that a randomly chosen student both carries a laptop to class and keeps a tablet in the bag?",
        "A": "carries a laptop to class",
        "B": "keeps a tablet in the bag",
        "aRange": [
          0.3,
          0.8
        ],
        "condRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "mult-car-parking-pass",
        "text": "{a} of UMW students commute by car. Of those students, {c} also have a parking pass. What is the probability that a randomly chosen UMW student both commutes by car and has a parking pass?",
        "A": "commutes by car",
        "B": "has a parking pass",
        "aRange": [
          0.2,
          0.6
        ],
        "condRange": [
          0.5,
          0.9
        ]
      },
      {
        "id": "mult-dog-walk",
        "text": "{a} of the households in a neighborhood own a dog. Of those households, {c} also walk the dog every day. What is the probability that a randomly chosen household both owns a dog and walks it every day?",
        "A": "owns a dog",
        "B": "walks it every day",
        "aRange": [
          0.2,
          0.5
        ],
        "condRange": [
          0.5,
          0.9
        ]
      },
      {
        "id": "mult-morning-shift-break",
        "text": "{a} of the workers at a bakery work the morning shift. Of those workers, {c} also take a break before noon. What is the probability that a randomly chosen worker both works the morning shift and takes a break before noon?",
        "A": "works the morning shift",
        "B": "takes a break before noon",
        "aRange": [
          0.3,
          0.7
        ],
        "condRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "mult-basil-tomatoes",
        "text": "{a} of the gardeners in a community plot grow basil. Of those gardeners, {c} also grow tomatoes. What is the probability that a randomly chosen gardener both grows basil and grows tomatoes?",
        "A": "grows basil",
        "B": "grows tomatoes",
        "aRange": [
          0.1,
          0.4
        ],
        "condRange": [
          0.3,
          0.7
        ]
      },
      {
        "id": "mult-river-flood-insurance",
        "text": "{a} of the residents of a river town live near the river. Of those residents, {c} also have flood insurance. What is the probability that a randomly chosen resident both lives near the river and has flood insurance?",
        "A": "lives near the river",
        "B": "has flood insurance",
        "aRange": [
          0.1,
          0.4
        ],
        "condRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "mult-first-shift-inspection",
        "text": "{a} of the parts in a batch come from the first shift. Of those parts, {c} also pass the final inspection. What is the probability that a randomly chosen part both comes from the first shift and passes the final inspection?",
        "A": "comes from the first shift",
        "B": "passes the final inspection",
        "aRange": [
          0.3,
          0.7
        ],
        "condRange": [
          0.6,
          0.9
        ]
      },
      {
        "id": "mult-first-year-third-floor",
        "text": "{a} of the students in a residence hall are first-year students. Of those students, {c} also live on the third floor. What is the probability that a randomly chosen student is a first-year student and lives on the third floor?",
        "A": "is a first-year student",
        "B": "lives on the third floor",
        "aRange": [
          0.2,
          0.5
        ],
        "condRange": [
          0.1,
          0.4
        ]
      },
      {
        "id": "mult-market-honey",
        "text": "{a} of the shoppers in a town square attend the weekend market. Of those shoppers, {c} also buy local honey. What is the probability that a randomly chosen shopper attends the weekend market and buys local honey?",
        "A": "attends the weekend market",
        "B": "buys local honey",
        "aRange": [
          0.2,
          0.5
        ],
        "condRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "mult-meal-plan-breakfast",
        "text": "{a} of the students at a small college have a campus meal plan. Of those students, {c} also eat breakfast on campus. What is the probability that a randomly chosen student has a campus meal plan and eats breakfast on campus?",
        "A": "has a campus meal plan",
        "B": "eats breakfast on campus",
        "aRange": [
          0.4,
          0.8
        ],
        "condRange": [
          0.3,
          0.7
        ]
      },
      {
        "id": "mult-instrument-choir",
        "text": "{a} of the students in a campus survey play a musical instrument. Of those students, {c} also sing in a choir. What is the probability that a randomly chosen student both plays a musical instrument and sings in a choir?",
        "A": "plays a musical instrument",
        "B": "sings in a choir",
        "aRange": [
          0.1,
          0.4
        ],
        "condRange": [
          0.2,
          0.6
        ]
      },
      {
        "id": "mult-bike-rental-return",
        "text": "{a} of the visitors to a campus bike shop rent a bicycle. Of those visitors, {c} also return the bicycle on time. What is the probability that a randomly chosen visitor both rents a bicycle and returns it on time?",
        "A": "rents a bicycle",
        "B": "returns it on time",
        "aRange": [
          0.1,
          0.5
        ],
        "condRange": [
          0.5,
          0.9
        ]
      }
    ]
  }
};
});
