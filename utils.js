"use strict";

let crypto = require('crypto');
const seedrandom = require('seedrandom');



// CRYPTO settings
const HASH_ALG = 'sha256';
const SIG_ALG = 'RSA-SHA256';

exports.hash = function hash(s, encoding) {
  encoding = encoding || 'hex';
  return crypto.createHash(HASH_ALG).update(s).digest(encoding);
};

exports.generateKeypair = function() {
  const kp = crypto.generateKeyPairSync('rsa', {
    modulusLength: 512,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
  });
  return {
    public: kp.publicKey,
    private: kp.privateKey,
  };
};

exports.sign = function(privKey, msg) {
  let signer = crypto.createSign(SIG_ALG);
  // Convert an object to its JSON representation
  let str = (msg === Object(msg)) ? JSON.stringify(msg) : ""+msg;
  return signer.update(str).sign(privKey, 'hex');
};

exports.verifySignature = function(pubKey, msg, sig) {
  let verifier = crypto.createVerify(SIG_ALG);
  // Convert an object to its JSON representation
  let str = (msg === Object(msg)) ? JSON.stringify(msg) : ""+msg;
  return verifier.update(str).verify(pubKey, sig, 'hex');
};

exports.calcAddress = function(key) {
  let addr = exports.hash(""+key, 'base64');
  //console.log(`Generating address ${addr} from ${key}`);
  return addr;
};

exports.addressMatchesKey = function(addr, pubKey) {
  return addr === exports.calcAddress(pubKey);
};

exports.htonum = function hashToNumber(hashValue) {
  if (hashValue){
  const intValue = BigInt(`0x${hashValue}`);
  
  const scaledValue = Number(intValue % 100000n) + 1;
  return scaledValue;

  }
};

exports.generateSudoku = function(seed,base=3,emptinessFactor = 0.5) {
  // Seeding the random function is not as straightforward in JS as in Python.
  // A custom random generator based on the  seed can be implemented or an external library can be used.
  // For simplicity, we'll use Math.random() and note that for reproducible puzzles, a seed-based RNG should be used.
  seedrandom(seed, { global: true });

  // Math.seedrandom(seed); // Assuming seedrandom.js is included for seedable randomness

  const side = base * base;

  function pattern(r, c) {
      return (base * (r % base) + Math.floor(r / base) + c) % side;
  }

  function shuffle(s) {
      for (let i = s.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [s[i], s[j]] = [s[j], s[i]]; // Swap
      }
      return s;
  }

  const rows = Array.from({length: base}, (_, g) => shuffle(Array.from({length: base}, (_, r) => g * base + r)))
                    .flat();
  const cols = Array.from({length: base}, (_, g) => shuffle(Array.from({length: base}, (_, c) => g * base + c)))
                    .flat();
  const nums = shuffle(Array.from({length: side}, (_, i) => i + 1));

  let board = Array.from({length: side}, (_, r) => Array.from({length: side}, (_, c) => nums[pattern(rows[r], cols[c])]));

  // Randomly remove numbers to create puzzles
  const squares = side * side;
  const empties = Math.floor(squares * emptinessFactor);
  for (let p of shuffle(Array.from({length: squares}, (_, i) => i)).slice(0, empties)) {
      board[Math.floor(p / side)][p % side] = 0;
  }

  return board;
};

exports.puzzleToString = function(puzzle) {
  return puzzle.map(row => row.map(cell => cell.toString()).join('')).join('');
};

exports.createPuzzle = function(currBlock) {
  let base = 3; // Default Sudoku 9x9
  let emptinessFactor = 0.5; // Default emptiness factor

  if (!currBlock.isGenesisBlock() && currBlock.prevBlockHash) {
    let puzzle_num = exports.htonum(currBlock.prevBlockHash);
    let prevBlockTime = currBlock.prevBlockTime ? currBlock.prevBlockTime : 0;
  
    if (prevBlockTime < 60) { 
      emptinessFactor = 0.75; // Make it harder
      console.log("Puzzle Made Harder\n");
    } else if (prevBlockTime > 100) {
      emptinessFactor = 0.25; // Make it easier
      console.log("Puzzle Made Easier\n");
    }

    const sudokuPuzzle = exports.generateSudoku(puzzle_num, base, emptinessFactor);
    return base * base + '_' + exports.puzzleToString(sudokuPuzzle);
  }
  else {
    const sudokuPuzzle = exports.generateSudoku(0);
    return  base * base + '_' + exports.puzzleToString(sudokuPuzzle);
  }
  
};

exports.parseInput = function(inputString) {
  let [dimensions, puzzleString] = inputString.split('_');
  dimensions = parseInt(dimensions, 10);
  return { dimensions, puzzleString };
};

exports.parseSudoku=function (puzzleString, dimensions) {
  let puzzle = [];
  for (let i = 0; i < dimensions; i++) {
      puzzle.push(puzzleString.slice(i * dimensions, (i + 1) * dimensions).split('').map(Number));
  }
  return puzzle;
};

exports.applyMoves=function (puzzle, moves) {
  moves.forEach(({row, col, num}) => {
      puzzle[row - 1][col - 1] = num;
  });
};

 exports.serializePuzzle=function(puzzle) {
  return puzzle.map(row => row.join('')).join('');
};

 exports.hashPuzzle=function(puzzleString) {
  return crypto.createHash('sha256').update(puzzleString).digest('hex');
};

exports.verifySudokuSolution=function(inputString, hashedSolution, moves) {
  let { dimensions, puzzleString } = this.parseInput(inputString);
  let puzzle = this.parseSudoku(puzzleString, dimensions);
  this.applyMoves(puzzle, moves);
  let solvedPuzzleString = this.serializePuzzle(puzzle);
  let solvedPuzzleHash = this.hashPuzzle(solvedPuzzleString);
  return solvedPuzzleHash === hashedSolution;
};

