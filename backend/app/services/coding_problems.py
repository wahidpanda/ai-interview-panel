"""
A built-in bank of coding problems, picked based on role keywords in the
job description and randomized so candidates don't get the same problem
every time. Each problem includes stdin/expected-stdout test cases that
work across languages (candidate reads from stdin, prints to stdout).

Numeric problems specify the exact rounding/format expected, and test
values are deliberately chosen to avoid rounding-boundary ambiguity
(e.g. Euclidean distances that land on a perfect square), so a correct
solution can't fail just from a formatting mismatch.
"""
import random

GENERAL_PROBLEMS = {
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

AI_ML_PROBLEMS = {
    "euclidean_distance": {
        "id": "euclidean_distance",
        "title": "Euclidean Distance Between Vectors",
        "difficulty": "Easy",
        "prompt": (
            "Read two comma-separated lists of numbers (one per line) representing "
            "two vectors of equal length. Print their Euclidean distance formatted "
            "to EXACTLY 4 decimal places (e.g. '5.0000', not '5.0' or '5' - use a "
            "fixed-width format like Python's f'{x:.4f}', not just round())."
        ),
        "starter_code": {
            "python": "a = list(map(float, input().split(',')))\nb = list(map(float, input().split(',')))\n\n# TODO: print the Euclidean distance formatted to 4 decimal places, e.g. f'{dist:.4f}'\n",
            "javascript": "const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');\nconst a = lines[0].split(',').map(Number);\nconst b = lines[1].split(',').map(Number);\n\n// TODO: print the Euclidean distance formatted to 4 decimal places, e.g. dist.toFixed(4)\n",
        },
        "tests": [
            {"stdin": "0,0\n3,4", "expected": "5.0000"},
            {"stdin": "0,0,0\n2,3,6", "expected": "7.0000"},
            {"stdin": "0,0,0\n1,1,1", "expected": "1.7321"},
        ],
    },
    "minmax_normalize": {
        "id": "minmax_normalize",
        "title": "Min-Max Normalization",
        "difficulty": "Easy",
        "prompt": (
            "Read a comma-separated list of numbers. Scale them to the range [0, 1] "
            "using min-max normalization: (x - min) / (max - min). Print the results "
            "comma-separated, each formatted to EXACTLY 2 decimal places (e.g. "
            "'0.00', not '0.0' or '0' - use a fixed-width format like f'{x:.2f}', "
            "not just round())."
        ),
        "starter_code": {
            "python": "nums = list(map(float, input().split(',')))\n\n# TODO: print min-max normalized values, comma separated, 2 decimals each\n",
            "javascript": "const nums = require('fs').readFileSync(0, 'utf8').trim().split(',').map(Number);\n\n// TODO: print min-max normalized values, comma separated, 2 decimals each\n",
        },
        "tests": [
            {"stdin": "0,5,10", "expected": "0.00,0.50,1.00"},
            {"stdin": "10,20,30,40", "expected": "0.00,0.33,0.67,1.00"},
        ],
    },
    "one_hot_encode": {
        "id": "one_hot_encode",
        "title": "One-Hot Encoding",
        "difficulty": "Easy",
        "prompt": (
            "Read a comma-separated list of category labels on the first line, and "
            "a single query label on the second line. Using the ALPHABETICALLY "
            "SORTED unique categories as column order, print the one-hot vector "
            "(comma-separated 0s and a single 1) for the query label."
        ),
        "starter_code": {
            "python": "categories = input().split(',')\nquery = input().strip()\n\n# TODO: print the one-hot vector for `query` using sorted unique categories\n",
            "javascript": "const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');\nconst categories = lines[0].split(',');\nconst query = lines[1].trim();\n\n// TODO: print the one-hot vector for `query` using sorted unique categories\n",
        },
        "tests": [
            {"stdin": "cat,dog,bird\ndog", "expected": "0,0,1"},
            {"stdin": "red,green,blue,red\nblue", "expected": "1,0,0"},
        ],
    },
    "softmax": {
        "id": "softmax",
        "title": "Softmax Probabilities",
        "difficulty": "Medium",
        "prompt": (
            "Read a comma-separated list of numbers (logits). Print the softmax "
            "probabilities (e^x_i / sum(e^x_j)), comma-separated, each formatted "
            "to EXACTLY 4 decimal places (e.g. '0.0900', not '0.09' - use a "
            "fixed-width format like f'{x:.4f}', not just round())."
        ),
        "starter_code": {
            "python": "logits = list(map(float, input().split(',')))\n\n# TODO: print softmax probabilities, comma separated, 4 decimals each\n",
            "javascript": "const logits = require('fs').readFileSync(0, 'utf8').trim().split(',').map(Number);\n\n// TODO: print softmax probabilities, comma separated, 4 decimals each\n",
        },
        "tests": [
            {"stdin": "1,2,3", "expected": "0.0900,0.2447,0.6652"},
            {"stdin": "0,0,0", "expected": "0.3333,0.3333,0.3333"},
        ],
    },
    "accuracy_score": {
        "id": "accuracy_score",
        "title": "Classification Accuracy",
        "difficulty": "Easy",
        "prompt": (
            "Read two comma-separated lists of equal length (one per line): "
            "predicted labels, then true labels. Print the classification accuracy "
            "(fraction of matching positions) formatted to EXACTLY 2 decimal places "
            "(e.g. '0.75' - use a fixed-width format like f'{x:.2f}', not just round())."
        ),
        "starter_code": {
            "python": "predicted = input().split(',')\ntrue = input().split(',')\n\n# TODO: print accuracy rounded to 2 decimal places\n",
            "javascript": "const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');\nconst predicted = lines[0].split(',');\nconst trueLabels = lines[1].split(',');\n\n// TODO: print accuracy rounded to 2 decimal places\n",
        },
        "tests": [
            {"stdin": "1,0,1,1\n1,0,0,1", "expected": "0.75"},
            {"stdin": "cat,dog,cat,cat\ncat,dog,dog,cat", "expected": "0.75"},
        ],
    },
    "moving_average": {
        "id": "moving_average",
        "title": "Moving Average (Sliding Window)",
        "difficulty": "Medium",
        "prompt": (
            "Read a comma-separated list of numbers on the first line and a window "
            "size (integer) on the second line. Print the moving averages for every "
            "window of that size, comma-separated, each formatted to EXACTLY 2 "
            "decimal places (e.g. '1.50' - use a fixed-width format like "
            "f'{x:.2f}', not just round())."
        ),
        "starter_code": {
            "python": "nums = list(map(float, input().split(',')))\nwindow = int(input())\n\n# TODO: print moving averages, comma separated, 2 decimals each\n",
            "javascript": "const lines = require('fs').readFileSync(0, 'utf8').trim().split('\\n');\nconst nums = lines[0].split(',').map(Number);\nconst window = parseInt(lines[1]);\n\n// TODO: print moving averages, comma separated, 2 decimals each\n",
        },
        "tests": [
            {"stdin": "1,2,3,4,5\n2", "expected": "1.50,2.50,3.50,4.50"},
            {"stdin": "2,4,6,8\n3", "expected": "4.00,6.00"},
        ],
    },
    "bag_of_words": {
        "id": "bag_of_words",
        "title": "Bag of Words - Unique Token Count",
        "difficulty": "Easy",
        "prompt": (
            "Read a line of text. Lowercase it, split on whitespace, and print the "
            "number of DISTINCT tokens (a simple bag-of-words vocabulary size)."
        ),
        "starter_code": {
            "python": "text = input()\n\n# TODO: print the count of distinct lowercase tokens\n",
            "javascript": "const text = require('fs').readFileSync(0, 'utf8').trim();\n\n// TODO: print the count of distinct lowercase tokens\n",
        },
        "tests": [
            {"stdin": "the cat sat on the mat", "expected": "5"},
            {"stdin": "AI is AI and ML is ML", "expected": "4"},
        ],
    },
}


def pick_problem_for_role(jd_text: str) -> dict:
    """Picks a random problem from a pool chosen by role keywords, so
    candidates get variety across attempts instead of the same problem
    every time."""
    text = jd_text.lower()
    if any(kw in text for kw in ("ai", "ml", "machine learning", "nlp", "data scien")):
        pool = AI_ML_PROBLEMS
    elif any(kw in text for kw in ("algorithm", "data structure", "backend")):
        pool = GENERAL_PROBLEMS
    else:
        pool = {**GENERAL_PROBLEMS, **AI_ML_PROBLEMS}
    return random.choice(list(pool.values()))


def get_problem(problem_id: str) -> dict | None:
    return GENERAL_PROBLEMS.get(problem_id) or AI_ML_PROBLEMS.get(problem_id)
