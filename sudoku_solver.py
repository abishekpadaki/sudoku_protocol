
import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import sys
import hashlib

import os

puzzle_num = sys.argv[1]
path = "./"
data = pd.read_csv(path+"partial_sudoku.csv")
try:
    data = pd.DataFrame({"quizzes":data["puzzle"],"solutions":data["solution"]})
except:
    pass
data.head()

def solve(bo):
    find = find_empty(bo)
    if not find:
        return True
    else:
        row, col = find

    for i in range(1,10):
        if valid(bo, i, (row, col)):
            bo[row][col] = i

            if solve(bo):
                return True

            bo[row][col] = 0

    return False


def valid(bo, num, pos):
    # Check row
    for i in range(len(bo[0])):
        if bo[pos[0]][i] == num and pos[1] != i:
            return False

    # Check column
    for i in range(len(bo)):
        if bo[i][pos[1]] == num and pos[0] != i:
            return False

    # Check box
    box_x = pos[1] // 3
    box_y = pos[0] // 3

    for i in range(box_y*3, box_y*3 + 3):
        for j in range(box_x * 3, box_x*3 + 3):
            if bo[i][j] == num and (i,j) != pos:
                return False

    return True


def print_board(bo):
    for i in range(len(bo)):
        if i % 3 == 0 and i != 0:
            print("- - - - - - - - - - - - - ")

        for j in range(len(bo[0])):
            if j % 3 == 0 and j != 0:
                print(" | ", end="")

            if j == 8:
                print(bo[i][j])
            else:
                print(str(bo[i][j]) + " ", end="")


def find_empty(bo):
    for i in range(len(bo)):
        for j in range(len(bo[0])):
            if bo[i][j] == 0:
                return (i, j)  # row, col

    return None

val_set = data.iloc[:500]


from tqdm import tqdm
quiz_list = list(val_set['quizzes'])
sol_list = list(val_set['solutions'])
val_quiz = []
val_sol = []
for i,j in tqdm(zip(quiz_list,sol_list), disable=True):
    q = np.array(list(map(int,list(i)))).reshape(9,9)
    s = np.array(list(map(int,list(j)))).reshape(9,9)
    val_quiz.append(q)
    val_sol.append(s)

# input_value = sys.argv[1:]

# print(val_quiz[1])

# print('Sol:')
# print(val_sol[1])

# print(val_quiz[1])
# print(val_set)
# solved_solution = solve(quiz_list[1])
# print(solved_solution)

# if solve(val_quiz[1]):
#     if (val_quiz[1]==val_sol[1]).all():
#             print('Correct')
#     else:
#         print('incorrect')

# game = '''
#           0 0 0 7 0 0 0 9 6
#           0 0 3 0 6 9 1 7 8
#           0 0 7 2 0 0 5 0 0
#           0 7 5 0 0 0 0 0 0
#           9 0 1 0 0 0 3 0 0
#           0 0 0 0 0 0 0 0 0
#           0 0 9 0 0 0 0 0 1
#           3 1 8 0 2 0 4 0 7
#           2 4 0 0 0 5 0 0 0
#       '''
# game = game.strip().split("\n")
# print("Problem:\n", val_quiz[1])
# print('\n')
game2 = val_quiz[int(puzzle_num)]
board = []
for i in game2:
    # t = i.replace(' ','').strip()
    t=i
    t = list(t)
    t = list(map(int,t))
    board.append(t)

solved = False
if solve(board):
    # print('Solved Board:')
    # print_board(board)
    solved =True

flat_str = ''.join(str(x) for sublist in board for x in sublist)
print(flat_str)


# hash_value = hashlib.sha256(flat_str.encode()).hexdigest()[:18]

# print(hash_value)