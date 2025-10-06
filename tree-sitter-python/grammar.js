/**
 * @file A tree sitter that supports python
 * @author Cameron Parker
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "python",

  rules: {
    // top-level file: repeat statements
    source_file: $ => repeat($._statement),

    // statement can be assignment, return, or expression
    _statement: $ => choice(
      $.return_statement,
      $.assignment_statement,
      $.expression_statement
    ),

    // assignment: identifier = expression
    assignment_statement: $ => seq(
      $.identifier,
      '=',
      $.expression
    ),

    // return statement: 'return' [expression]
   return_statement: $ => seq(
    'return',
    $.expression
  ),

    // expression statement: just an expression on its own
    expression_statement: $ => $.expression,

    // simple expressions: number or identifier
    expression: $ => choice(
      $.number,
      $.identifier
    ),
   

    identifier: $ => /[a-zA-Z_]\w*/,
    number: $ => /\d+/
  }
});