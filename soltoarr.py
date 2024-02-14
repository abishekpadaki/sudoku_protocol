import csv

# Read the CSV file
with open('partial_sudoku.csv', 'r') as csv_file:
    csv_reader = csv.reader(csv_file)
    
    # Read the 2nd column values
    second_column_values = [row[1] for row in csv_reader]

# Write to the TXT file
with open('output_arr.txt', 'w') as txt_file:
    txt_file.write('[')
    for value in second_column_values:
        txt_file.write(f"'{value}'")
        if value != second_column_values[-1]:
            txt_file.write(',')
        txt_file.write('\n')
    txt_file.write(']')
