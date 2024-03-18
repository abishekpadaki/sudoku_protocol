import sys
import json

moves = []

def is_valid(board, row, col, num, n):
    for x in range(n):
        if board[row][x] == num or board[x][col] == num:
            return False

    start_row, start_col = n // 3 * (row // 3), n // 3 * (col // 3)
    for i in range(3):
        for j in range(3):
            if board[i + start_row][j + start_col] == num:
                return False
    return True

def solve_sudoku(board, n):
    global moves
    find = find_empty_location(board, n)
    if not find:
        return True
    else:
        row, col = find

    for num in range(1, n + 1):
        if is_valid(board, row, col, num, n):
            board[row][col] = num
            moves.append({'row':row+1, 'col':col+1, 'num':num})
            if solve_sudoku(board, n):
                return True
            moves.pop()
            board[row][col] = 0
    return False

def find_empty_location(board, n):
    for i in range(n):
        for j in range(n):
            if board[i][j] == 0:
                return i, j
    return None

def puzzle_solver(input_string):
    global moves
    try:
        dimension, puzzle_str = input_string.split('_')
        n = int(dimension)
        if len(puzzle_str) != n * n:
            return "Invalid puzzle length for the given dimension."

        puzzle = [int(x) for x in puzzle_str]
        board = [puzzle[i * n:(i + 1) * n] for i in range(n)]
        moves = []

        if solve_sudoku(board, n):
            solved_puzzle_str = ''.join(str(cell) for row in board for cell in row)
            return f"{dimension}_{solved_puzzle_str}", moves
        else:
            return "No solution exists for the given Sudoku puzzle."
    except Exception as e:
        return f"Error: {e}", moves

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python puzzle_solver.py '<dimension>_<puzzle_to_be_solved>'")
    else:
        input_string = sys.argv[1]
        solution, moves_made = puzzle_solver(input_string)
        #print(solution)
        #print(moves_made)
        output_obj = {
            'solution': solution,
            'moves_made': moves_made
        }

        json_output = json.dumps(output_obj)
        print(json_output)

    sys.exit(0)

