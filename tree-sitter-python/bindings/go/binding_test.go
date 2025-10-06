package tree_sitter_python_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_python "github.com/alexandriaai/xandriaai.git/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_python.Language())
	if language == nil {
		t.Errorf("Error loading Python tree sitter grammar")
	}
}
