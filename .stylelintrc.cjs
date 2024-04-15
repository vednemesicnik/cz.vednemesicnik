/** Stylelint configuration https://stylelint.io/user-guide/configure */

/** @type {import("stylelint").Config} */
module.exports = {
  rules: {
    /** only 6-digit or 8-digit formats are allowed (e.g. #RRGGBB or #RRGGBBAA) */
    "color-hex-length": "long",
    /** fractional numbers less than 1 must have zero before the decimal point (e.g. 0.5) */
    // "number-leading-zero": "always",
    /** integers must be written without fractions (e.g. 1 /not 1.0) */
    // "number-no-trailing-zeros": true,
    /** zero lengths do not need specified unit (e.g.{ margin: 0;}) */
    "length-zero-no-unit": true,
    /** properties must be written in lowercase (e.g. {display: ...;}) */
    // "property-case": "lower",
    /** there must be empty line before a new css at-rule (e.g. @media) */
    "at-rule-empty-line-before": "always",
    /** duplicate properties are not allowed (e.g. {color: white; color: pink;}) */
    "declaration-block-no-duplicate-properties": true,
    /** longhand properties can not be overwritten by shorthand properties (e.g. {padding-left: 10px; padding: 20px;}) */
    "declaration-block-no-shorthand-property-overrides": true,
    /** curly braces of css at-rule must not be empty (e.g. { }) */
    "block-no-empty": true,
    /** no vendor prefixes are needed (e.g. webkit, moz) */
    "value-no-vendor-prefix": true,
    /** units must be written in lowercase (e.g. px) */
    // "unit-case": "lower",
    /** no empty comments are allowed */
    "comment-no-empty": true
  }
}