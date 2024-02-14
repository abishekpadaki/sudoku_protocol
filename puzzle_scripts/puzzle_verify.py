import sys

def is_valid_sudoku(puzzle, n):
    # Check rows and columns
    for i in range(n):
        if (len(set(puzzle[i * n:(i + 1) * n])) != n or
            len(set(puzzle[i::n])) != n):
            return False

    # Check subgrids
    subgrid_size = int(n**0.5)
    for i in range(0, n, subgrid_size):
        for j in range(0, n, subgrid_size):
            subgrid = []
            for k in range(subgrid_size):
                subgrid.extend(puzzle[i*n + j + k*n : i*n + j + k*n + subgrid_size])
            if len(set(subgrid)) != n:
                return False

    return True

def puzzle_solve(input_string):
    try:
        # Parsing the input
        dimension, puzzle_str = input_string.split('_')
        n = int(dimension)

        # Validate dimensions
        if len(puzzle_str) != n * n:
            return "Invalid puzzle length for the given dimension."

        # Convert the string into a list of integers
        puzzle = [int(x) for x in puzzle_str]

        # Validate the puzzle
        if is_valid_sudoku(puzzle, n):
            return "Valid"
        else:
            return "Invalid"
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python puzzle_solve.py '9_<solved_puzzle_string>'")
    else:
        input_string = sys.argv[1]
        print(puzzle_solve(input_string))

