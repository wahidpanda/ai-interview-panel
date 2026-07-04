"""
A small built-in bank of coding problems, picked based on role keywords in the
job description. Each problem includes stdin/expected-stdout test cases that
work across languages (candidate reads from stdin, prints to stdout).
"""

PROBLEMS = {
    "two_sum": {
        "id": "two_sum",
        "title": "Two Sum (Closest Pair)",
        "difficulty": "Easy",
        "prompt": (
            "Read a target integer on the first line, then a comma-separated list "
            "of integers on the second line. Print the 0-based indices (comma "
            "separated, smaller index first) of the two numbers that add up to the "
            "target. Assume exactly one solution exists."
        ),
        "starter_code": {
            "python": "target = int(input())\nnums = list(map(int, input().split(',')))\n\n# TODO: print two indices, comma separated\n",
            "javascript": "const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\nconst target = parseInt(lines[0]);\nconst nums = lines[1].split(',').map(Number);\n\n// TODO: print two indices, comma separated\n",
        },
        "tests": [
            {"stdin": "9\n2,7,11,15", "expected": "0,1"},
            {"stdin": "6\n3,2,4", "expected": "1,2"},
            {"stdin": "11\n1,2,3,8", "expected": "1,3"},
        ],
    },
    "reverse_words": {
        "id": "reverse_words",
        "title": "Reverse Words In A Sentence",
        "difficulty": "Easy",
        "prompt": (
            "Read a single line of text. Print the words in reverse order, "
            "separated by single spaces, with no leading/trailing whitespace."
        ),
        "starter_code": {
            "python": "s = input()\n\n# TODO: print words reversed\n",
            "javascript": "const s = require('fs').readFileSync(0, 'utf8').trim();\n\n// TODO: print words reversed\n",
        },
        "tests": [
            {"stdin": "the sky is blue", "expected": "blue is sky the"},
            {"stdin": "  hello   world  ", "expected": "world hello"},
        ],
    },
    "valid_parens": {
        "id": "valid_parens",
        "title": "Valid Parentheses",
        "difficulty": "Medium",
        "prompt": (
            "Read a line containing only the characters ( ) { } [ ]. "
            "Print 'true' if every bracket is properly opened and closed in "
            "the correct order, otherwise print 'false'."
        ),
        "starter_code": {
            "python": "s = input().strip()\n\n# TODO: print 'true' or 'false'\n",
            "javascript": "const s = require('fs').readFileSync(0, 'utf8').trim();\n\n// TODO: print 'true' or 'false'\n",
        },
        "tests": [
            {"stdin": "()[]{}", "expected": "true"},
            {"stdin": "(]", "expected": "false"},
            {"stdin": "([{}])", "expected": "true"},
            {"stdin": "(((", "expected": "false"},
        ],
    },
    "word_frequency": {
        "id": "word_frequency",
        "title": "Most Frequent Word",
        "difficulty": "Medium",
        "prompt": (
            "Read a line of lowercase words separated by spaces. Print the word "
            "that occurs most often. If there's a tie, print the one that appears "
            "first in the input."
        ),
        "starter_code": {
            "python": "words = input().split()\n\n# TODO: print the most frequent word\n",
            "javascript": "const words = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\n\n// TODO: print the most frequent word\n",
        },
        "tests": [
            {"stdin": "a b a c b a", "expected": "a"},
            {"stdin": "x y y x z", "expected": "x"},
        ],
    },
}


def pick_problem_for_role(jd_text: str) -> dict:
    """Very simple keyword heuristic; falls back to an easy default."""
    text = jd_text.lower()
    if "algorithm" in text or "data structure" in text or "backend" in text:
        return PROBLEMS["valid_parens"]
    if "nlp" in text or "text" in text or "ml" in text or "ai" in text:
        return PROBLEMS["word_frequency"]
    return PROBLEMS["two_sum"]


def get_problem(problem_id: str) -> dict | None:
    return PROBLEMS.get(problem_id)
