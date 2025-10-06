/**
 * @file A tree sitter that supports C
 * @author Cameron Parker
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "c",

  rules: {
    // top-level file: repeat statements
    source_file: $ => repeat($._statement),

    // statements: assignment, return, expression
    _statement: $ => choice(
      $.function_definition,
      $.assignment_statement,
      $.return_statement,
      $.expression_statement,
      $.variable_declaration
    ),
    function_definition: $ => seq(
      $.type,              // return type
      $.identifier,         // function name
      $.parameter_list,     // parameters
      $.compound_statement  // body
    ),
    type: $ => choice(
    'int', 'void', 'float', 'double', 'char' 
  ),
    parameter_list: $ => seq('(', ')'),
    parameter: $ => seq(
    $.type,                 // type of the parameter
    $.identifier            // name of the parameter
  ),
    compound_statement: $ => seq(
    '{',
    repeat($._statement),  // zero or more statements
    '}'
  ),

    // assignment: identifier = expression;
    assignment_statement: $ => seq(
      $.identifier,
      '=',
      $.expression,
      ';'
    ),

    // return statement: return expression;
    return_statement: $ => seq(
      'return',
      optional($.expression),
      ';'
    ),

    // expression statement: just an expression with semicolon
    expression_statement: $ => seq($.expression, ';'),

    variable_declaration: $ => seq(
      $.type,
      $.identifier,
      ';'
    ),

    // minimal expressions: number or identifier
    expression: $ => choice(
      $.number,
      $.identifier
    ),

    identifier: $ => /[a-zA-Z_]\w*/,
    number: $ => /\d+/
  }
});
