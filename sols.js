const fs = require('fs');
const csv = require('csv-parser');

async function getAllSolutions() {
    let solutions = [];
    const stream = fs.createReadStream('partial_sudoku.csv').pipe(csv());
  
    stream.on('data', (row) => {
      solutions.push(row.solution);
    });
  
    stream.on('end', () => {
      if (solutions) {
        console.log('returnedd');
        return solutions;
      } else {
        console.log('Index out of range');
      }
    });
  
    stream.on('error', (error) => {
      console.log('Error:', error);
    });
  }

let sols = getAllSolutions();

//console.log(sols);


  