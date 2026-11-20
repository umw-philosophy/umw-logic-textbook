/*
 * stats-bank.js
 * Wording for the Statistics Practice tool (UMW Logic Textbook, Chapter 15).
 * These entries supply words, units, and plausible ranges only. Every number
 * in a problem is generated, and every answer computed, in stats-core.js.
 *
 * center: contexts for small datasets (Center and Spread tabs).
 *   setup     one sentence; {n} is replaced by the number of values.
 *   label     names the data line ("Quiz scores: 62, 74, ...").
 *   noun      what one value is ("quiz score"); used in "a typical quiz score".
 *   unit      plural unit written after a number ("points"); '' for none.
 *   money     values are dollars.
 *   step      values are whole multiples of this (1, 0.5, 1000, ...).
 *   range     [low, high] for ordinary values.
 *   outlier   [low, high] for one extreme high value, or null if none fits.
 *   left      a long tail of low values is plausible (a few very low scores).
 *   sd        small enough numbers to work a standard deviation by hand.
 *   modeQ     a question that makes the most common value the thing that
 *             matters, or null.
 *   modeOnly  only used for mode questions (an average shoe size is odd).
 *
 * big: contexts for the larger-dataset standard deviation (spreadsheet).
 *   decimals  number of decimal places in each value.
 *
 * normal: approximately normal measurements, with {mean}, {sd}, and {x}.
 *   things    what is counted ("students"); measure: what they have ("scores").
 *   countable "Out of N things, how many ..." reads naturally.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StatsBank = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    center: [
      {
        id: 'quiz-scores', setup: 'A professor records quiz scores for {n} students.',
        label: 'Quiz scores', noun: 'quiz score', unit: 'points', money: false, step: 1,
        range: [55, 100], outlier: null, left: true, sd: true, modeQ: null,
      },
      {
        id: 'commute', setup: 'At one office, {n} employees report their one-way commute times, in minutes.',
        label: 'Commute times', noun: 'commute time', unit: 'minutes', money: false, step: 1,
        range: [10, 50], outlier: [95, 130], left: false, sd: true, modeQ: null,
      },
      {
        id: 'points-per-game', setup: 'A basketball player scored these points in her last {n} games.',
        label: 'Points per game', noun: 'number of points in a game', unit: 'points', money: false, step: 1,
        range: [8, 30], outlier: null, left: false, sd: true, modeQ: null,
      },
      {
        id: 'hospital-stay', setup: 'A hospital ward records how many days each of its last {n} patients stayed.',
        label: 'Length of stay (days)', noun: 'length of stay', unit: 'days', money: false, step: 1,
        range: [1, 9], outlier: [28, 45], left: false, sd: true, modeQ: null,
      },
      {
        id: 'home-prices', setup: 'These are the sale prices of the {n} homes sold in one neighborhood last month.',
        label: 'Sale prices', noun: 'home price', unit: '', money: true, step: 5000,
        range: [180000, 320000], outlier: [950000, 1600000], left: false, sd: false, modeQ: null,
      },
      {
        id: 'incomes', setup: 'These are the annual incomes of the {n} people who work at a small company.',
        label: 'Annual incomes', noun: 'income', unit: '', money: true, step: 1000,
        range: [30000, 72000], outlier: [450000, 1200000], left: false, sd: false, modeQ: null,
      },
      {
        id: 'study-hours', setup: 'In a survey, {n} students reported how many hours per week they study.',
        label: 'Study hours per week', noun: 'number of study hours', unit: 'hours', money: false, step: 1,
        range: [2, 16], outlier: [35, 45], left: false, sd: true, modeQ: null,
      },
      {
        id: 'screen-time', setup: 'In a study, {n} volunteers logged their daily screen time, in minutes.',
        label: 'Daily screen time', noun: 'daily screen time', unit: 'minutes', money: false, step: 1,
        range: [120, 300], outlier: null, left: false, sd: false, modeQ: null,
      },
      {
        id: 'plant-heights', setup: 'A gardener measures the heights, in centimeters, of {n} tomato plants at the end of June.',
        label: 'Plant heights', noun: 'plant height', unit: 'cm', money: false, step: 1,
        range: [40, 90], outlier: null, left: true, sd: true, modeQ: null,
      },
      {
        id: 'coffee-orders', setup: 'A campus café counts the coffee orders it receives in each of {n} one-hour periods.',
        label: 'Orders per hour', noun: 'number of orders in an hour', unit: 'orders', money: false, step: 1,
        range: [12, 40], outlier: null, left: false, sd: true, modeQ: null,
      },
      {
        id: 'rents', setup: 'These are the monthly rents for {n} apartments listed near campus.',
        label: 'Monthly rents', noun: 'rent', unit: '', money: true, step: 25,
        range: [850, 1500], outlier: [3800, 5200], left: false, sd: false, modeQ: null,
      },
      {
        id: 'clinic-wait', setup: 'A walk-in clinic records how long, in minutes, each of its last {n} patients waited to be seen.',
        label: 'Wait times', noun: 'wait time', unit: 'minutes', money: false, step: 1,
        range: [5, 35], outlier: [110, 160], left: false, sd: true, modeQ: null,
      },
      {
        id: 'shoe-sizes', setup: 'A shoe store lists the women’s sizes of the {n} pairs it sold on one Saturday.',
        label: 'Sizes sold', noun: 'shoe size', unit: '', money: false, step: 0.5,
        range: [6, 10.5], outlier: null, left: false, sd: false, modeOnly: true,
        modeQ: 'The store wants to know which size to reorder in the largest quantity.',
      },
      {
        id: 'household-size', setup: 'A survey records the number of people living in each of {n} households.',
        label: 'People per household', noun: 'household size', unit: 'people', money: false, step: 1,
        range: [1, 6], outlier: null, left: false, sd: false, modeOnly: true,
        modeQ: 'The housing office wants to know the most common household size.',
      },
      {
        id: 'class-sizes', setup: 'A department lists the enrollment in each of its {n} seminar sections.',
        label: 'Students per section', noun: 'section size', unit: 'students', money: false, step: 1,
        range: [12, 22], outlier: null, left: false, sd: true,
        modeQ: 'The scheduling office wants to know which section size comes up most often, so it can reserve rooms of that size.',
      },
    ],

    big: [
      {
        id: 'reaction-times', setup: 'In a psychology lab, {n} volunteers press a button as soon as a light turns on.',
        label: 'Reaction times (milliseconds)', unit: 'milliseconds', range: [220, 420], decimals: 0,
      },
      {
        id: 'battery-life', setup: 'A reviewer tests {n} phones of the same model and records how long each battery lasts.',
        label: 'Battery life (hours)', unit: 'hours', range: [8, 12.5], decimals: 1,
      },
      {
        id: 'cereal-weights', setup: 'A factory weighs {n} boxes of cereal labeled 500 grams.',
        label: 'Box weights (grams)', unit: 'grams', range: [492, 510], decimals: 1,
      },
      {
        id: 'daily-highs', setup: 'A weather station records the daily high temperature on {n} days in May.',
        label: 'Daily highs (°F)', unit: 'degrees', range: [58, 86], decimals: 0,
      },
      {
        id: 'race-times', setup: 'A running club records the finishing times of {n} members in a 5-kilometer race.',
        label: 'Finishing times (minutes)', unit: 'minutes', range: [19, 38], decimals: 1,
      },
    ],

    normal: [
      {
        id: 'exam', things: 'students', measure: 'scores', countable: true, unit: 'points', mean: [68, 72, 75, 78], sd: [4, 6, 8, 10],
        setup: 'Scores on a statistics exam are approximately normally distributed, with a mean of {mean} points and a standard deviation of {sd} points.',
        item: 'One student scored {x} points.',
      },
      {
        id: 'standardized-test', things: 'test-takers', measure: 'scores', countable: true, unit: 'points', mean: [500], sd: [100],
        setup: 'Scores on a standardized test are approximately normally distributed, with a mean of {mean} and a standard deviation of {sd}.',
        item: 'One test-taker scored {x}.',
      },
      {
        id: 'heights', things: 'adults', measure: 'heights', countable: true, unit: 'cm', mean: [163, 165, 170, 176], sd: [6, 7],
        setup: 'Heights of adults in a city are approximately normally distributed, with a mean of {mean} cm and a standard deviation of {sd} cm.',
        item: 'One adult in the city is {x} cm tall.',
      },
      {
        id: 'rainfall', things: 'years', measure: 'rainfall totals', countable: false, unit: 'inches', mean: [36, 40, 44], sd: [4, 5, 6],
        setup: 'Annual rainfall in a city is approximately normally distributed, with a mean of {mean} inches and a standard deviation of {sd} inches.',
        item: 'One year, the city got {x} inches of rain.',
      },
      {
        id: 'bulbs', things: 'bulbs', measure: 'lifetimes', countable: true, unit: 'hours', mean: [1000, 1200], sd: [50, 80],
        setup: 'The lifetimes of a factory’s light bulbs are approximately normally distributed, with a mean of {mean} hours and a standard deviation of {sd} hours.',
        item: 'One bulb lasted {x} hours.',
      },
      {
        id: 'pine-trees', things: 'trees', measure: 'trunk diameters', countable: true, unit: 'cm', mean: [150], sd: [30],
        setup: 'Trunk diameters of a variety of pine tree are approximately normally distributed, with a mean of {mean} cm and a standard deviation of {sd} cm.',
        item: 'One tree has a trunk diameter of {x} cm.',
      },
      {
        id: 'cholesterol', things: 'people', measure: 'cholesterol readings', countable: true, unit: 'mg/dL', mean: [160], sd: [50],
        setup: 'Serum cholesterol in a healthy reference population is approximately normally distributed, with a mean of {mean} mg/dL and a standard deviation of {sd} mg/dL.',
        item: 'One person’s reading is {x} mg/dL.',
      },
      {
        id: 'reaction', things: 'drivers', measure: 'reaction times', countable: true, unit: 'milliseconds', mean: [280, 300], sd: [30, 40],
        setup: 'Reaction times in a driving simulator are approximately normally distributed, with a mean of {mean} milliseconds and a standard deviation of {sd} milliseconds.',
        item: 'One driver reacted in {x} milliseconds.',
      },
      {
        id: 'birth-weights', things: 'babies', measure: 'birth weights', countable: true, unit: 'grams', mean: [3400, 3500], sd: [400, 500],
        setup: 'Birth weights at a hospital are approximately normally distributed, with a mean of {mean} grams and a standard deviation of {sd} grams.',
        item: 'One baby weighed {x} grams at birth.',
      },
    ],

    // ---------------------------------------------------------------
    // Margin of error (section 15.4)
    // poll: one yes-or-no question.
    //   pop     who was sampled (plural); phrase: what the yes group says,
    //           written to follow "54% ..." or "540 ...".
    // race: two named options and who was asked.
    // ---------------------------------------------------------------
    poll: [
      { id: 'ballot', pop: 'likely voters', phrase: 'support a proposed ballot measure' },
      { id: 'rail', pop: 'adults in the region', phrase: 'say they would use a new commuter rail line' },
      { id: 'leafblower', pop: 'city residents', phrase: 'favor a ban on gas-powered leaf blowers' },
      { id: 'start-time', pop: 'students', phrase: 'support starting the first class period an hour later' },
      { id: 'governor', pop: 'registered voters', phrase: 'approve of the governor’s job performance' },
      { id: 'school-start', pop: 'parents in the district', phrase: 'support a later start time for high schools' },
      { id: 'local-news', pop: 'adults', phrase: 'say they trust their local news' },
      { id: 'four-day', pop: 'employees at a large company', phrase: 'prefer a four-day work week' },
      { id: 'stadium', pop: 'county voters', phrase: 'support a tax increase to build a new stadium' },
      { id: 'phones', pop: 'parents', phrase: 'support banning phones during the school day' },
    ],
    race: [
      { id: 'mayor', office: 'the mayor’s race', a: 'Alvarez', b: 'Brooks', pop: 'likely voters' },
      { id: 'senate', office: 'a state senate race', a: 'Okafor', b: 'Lindqvist', pop: 'likely voters' },
      { id: 'council', office: 'a city council race', a: 'Nguyen', b: 'Harper', pop: 'registered voters' },
      { id: 'governor-race', office: 'the governor’s race', a: 'Castillo', b: 'Whitfield', pop: 'likely voters' },
      { id: 'sga', office: 'the student government election', a: 'Patel', b: 'Moreau', pop: 'students' },
      { id: 'board', office: 'a school board race', a: 'Reyes', b: 'Dunbar', pop: 'registered voters' },
    ],

    // ---------------------------------------------------------------
    // Diagnostic thresholds (section 15.5)
    // test: a yes-or-no screening test.
    //   name      the test, with its article ("A rapid strep test").
    //   items     what is screened (plural); cond: "have strep"; neg: "do not have strep".
    //   pos       what a positive result is called ("tests positive").
    // screen: a continuous measurement with a healthy reference population,
    //   flagged as abnormal outside a band around the mean.
    // flags: a tool whose flags are reviewed by a person.
    // ---------------------------------------------------------------
    test: [
      { id: 'strep', neg: 'do not have strep throat', name: 'A rapid strep test', items: 'patients', item: 'patient', cond: 'have strep throat', pos: 'tests positive' },
      { id: 'mammogram', neg: 'do not have breast cancer', name: 'A screening mammogram', items: 'women screened', item: 'woman', cond: 'have breast cancer', pos: 'is called back' },
      { id: 'bags', neg: 'contain no prohibited item', name: 'An airport bag scanner', items: 'bags', item: 'bag', cond: 'contain a prohibited item', pos: 'is flagged for a hand search' },
      { id: 'spam', neg: 'are legitimate', name: 'A spam filter', items: 'emails', item: 'email', cond: 'are spam', pos: 'is sent to the spam folder' },
      { id: 'fraud', neg: 'are legitimate', name: 'A bank’s fraud detector', items: 'card transactions', item: 'transaction', cond: 'are fraudulent', pos: 'is blocked for review' },
      { id: 'drug', neg: 'have not used the drug', name: 'A workplace drug test', items: 'employees tested', item: 'employee', cond: 'have used the drug', pos: 'tests positive' },
      { id: 'covid', neg: 'are not infected', name: 'A rapid antigen test', items: 'people tested', item: 'person', cond: 'are infected', pos: 'tests positive' },
    ],
    screen: [
      { id: 'cholesterol', what: 'Serum cholesterol', who: 'a healthy reference population', unit: 'mg/dL', mean: [160], sd: [50], things: 'healthy people', test: 'A clinical test' },
      { id: 'bp', what: 'Systolic blood pressure', who: 'healthy adults', unit: 'mmHg', mean: [118, 120], sd: [10, 12], things: 'healthy adults', test: 'A screening program' },
      { id: 'glucose', what: 'Fasting blood glucose', who: 'healthy adults', unit: 'mg/dL', mean: [88, 90], sd: [8, 10], things: 'healthy adults', test: 'A clinic' },
      { id: 'bolts', what: 'The length of a bolt from a properly working machine', who: '', unit: 'mm', mean: [50], sd: [0.2, 0.4], things: 'good bolts', test: 'A quality inspector' },
      { id: 'vibration', what: 'The vibration level of a healthy wind turbine', who: '', unit: 'mm/s', mean: [40, 60], sd: [4, 6], things: 'readings from healthy turbines', test: 'A monitoring system' },
    ],
    flags: [
      { id: 'plagiarism', tool: 'A university plagiarism-detection tool', items: 'submitted papers', flagged: 'flagged papers', good: 'legitimate work', bad: 'genuine cases of plagiarism' },
      { id: 'fraud-alerts', tool: 'A credit card company’s fraud alert system', items: 'transactions', flagged: 'flagged transactions', good: 'purchases the customer really made', bad: 'actual fraud' },
      { id: 'proctor', tool: 'An online exam proctoring program', items: 'exam sessions', flagged: 'flagged sessions', good: 'honest work', bad: 'actual cheating' },
      { id: 'content', tool: 'A social media site’s automated content filter', items: 'posts', flagged: 'flagged posts', good: 'within the rules', bad: 'real rule violations' },
    ],

    // ---------------------------------------------------------------
    // Lying with statistics (section 15.6)
    // bars: two-bar comparisons for the truncated-axis problem.
    //   title, measure, labels [larger, smaller], money, unit, scale
    //   (values are whole multiples of scale), size [low, high] in scale units.
    // icon: a price (or other amount) drawn as a picture scaled by height.
    // risk: a treatment and an outcome; rate is per year unless period says otherwise.
    // trend: a yearly series whose starting year can be chosen to flatter.
    // ---------------------------------------------------------------
    bars: [
      { id: 'sales', title: 'Monthly Sales', measure: 'monthly sales', labels: ['Product A', 'Product B'], money: true, unit: '', scale: 1000, size: [400, 1500] },
      { id: 'homes', title: 'New Homes Built', measure: 'new homes built', labels: ['Oak County', 'Pine County'], money: false, unit: 'homes', scale: 100, size: [1500, 2600] },
      { id: 'scores', title: 'Average Reading Score', measure: 'average reading scores', labels: ['Lincoln Elementary', 'Jefferson Elementary'], money: false, unit: 'points', scale: 1, size: [200, 320] },
      { id: 'riders', title: 'Weekday Transit Riders', measure: 'weekday riders', labels: ['Route 7', 'Route 12'], money: false, unit: 'riders', scale: 100, size: [80, 300] },
      { id: 'donations', title: 'Annual Donations', measure: 'annual donations', labels: ['Westside Food Bank', 'Eastside Food Bank'], money: true, unit: '', scale: 1000, size: [150, 900] },
    ],
    icon: [
      { id: 'gas', what: 'The average price of a gallon of gasoline', icon: 'a truck', money: true, cents: true, range: [2.5, 4.5] },
      { id: 'rent', what: 'The median monthly rent in a city', icon: 'a house', money: true, cents: false, range: [900, 2400] },
      { id: 'tuition', what: 'Annual tuition at a state university', icon: 'a graduation cap', money: true, cents: false, range: [6000, 14000] },
      { id: 'eggs', what: 'The average price of a dozen eggs', icon: 'an egg carton', money: true, cents: true, range: [1.8, 4.5] },
      { id: 'coffee', what: 'The price of a medium coffee at a campus café', icon: 'a coffee cup', money: true, cents: true, range: [1.8, 4.2] },
    ],
    risk: [
      { id: 'statin', treatment: 'a new cholesterol drug', outcome: 'a heart attack', group: 'patients', period: 'each year' },
      { id: 'supplement', treatment: 'a nutritional supplement', outcome: 'the condition', group: 'adults', period: 'over five years' },
      { id: 'vaccine', treatment: 'a new vaccine', outcome: 'the illness', group: 'people', period: 'over one flu season' },
      { id: 'helmet', treatment: 'a redesigned football helmet', outcome: 'a concussion', group: 'players', period: 'per season' },
      { id: 'aspirin', treatment: 'daily low-dose aspirin', outcome: 'a stroke', group: 'adults over 60', period: 'over ten years' },
      { id: 'app', treatment: 'a fall-prevention exercise program', outcome: 'a fall that needs medical care', group: 'older adults', period: 'each year' },
    ],
    trend: [
      { id: 'revenue', what: 'Annual revenue for a regional retailer', unit: 'million dollars', money: true, presenter: 'The company’s annual report', scale: 1 },
      { id: 'crime', what: 'The burglary rate in a city', unit: 'burglaries per 10,000 residents', money: false, presenter: 'The mayor’s office', scale: 1 },
      { id: 'enroll', what: 'Fall enrollment at a community college', unit: 'students', money: false, presenter: 'The college’s press office', scale: 10 },
      { id: 'ridership', what: 'Average daily bus ridership in a city', unit: 'riders', money: false, presenter: 'The transit authority', scale: 100 },
      { id: 'visitors', what: 'Annual attendance at a state park', unit: 'thousand visitors', money: false, presenter: 'The park service', scale: 1 },
    ],
  };
});
