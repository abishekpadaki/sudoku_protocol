import random
import sys

def generate_sudoku(seed,base=3):
    random.seed(seed)
    def pattern(r, c): 
        return (base * (r % base) + r // base + c) % side

    def shuffle(s): 
        return random.sample(s, len(s))

    base = base
    side = base * base

    # Generate the basic pattern
    rows = [g * base + r for g in shuffle(range(base)) for r in shuffle(range(base))]
    cols = [g * base + c for g in shuffle(range(base)) for c in shuffle(range(base))]
    nums = shuffle(range(1, base * base + 1))

    # Produce board using randomized baseline pattern
    board = [[nums[pattern(r, c)] for c in cols] for r in rows]

    return board

def puzzle_to_string(puzzle):
    return ''.join(str(cell) if cell != 0 else '0' for row in puzzle for cell in row)

def create_puzzle(seed):
    seed = seed
    sudoku_puzzle = generate_sudoku(seed=seed)
    return puzzle_to_string(sudoku_puzzle)

# Example usage
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python puzzle_solve.py <seed_value>")
    else:
        input_string = sys.argv[1]
        puzzle = create_puzzle(int(input_string))
        print(f'9_{puzzle}')
