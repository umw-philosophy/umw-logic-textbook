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
  };
});
