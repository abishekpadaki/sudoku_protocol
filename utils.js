"use strict";

let crypto = require('crypto');
const fs = require('fs');
const csv = require('csv-parser');
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
  
  // const scaledValue = Number(intValue % 499n) + 1;
  const scaledValue = Number(intValue % 100000n) + 1;
  return scaledValue;

  }
};

exports.generateSudoku = function(seed) {
  // Seeding the random function is not as straightforward in JS as in Python.
  // A custom random generator based on the seed can be implemented or an external library can be used.
  // For simplicity, we'll use Math.random() and note that for reproducible puzzles, a seed-based RNG should be used.
  seedrandom(seed, { global: true });

  // Math.seedrandom(seed); // Assuming seedrandom.js is included for seedable randomness

  const base = 3;
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
  const empties = Math.floor(squares * 3 / 4);
  for (let p of shuffle(Array.from({length: squares}, (_, i) => i)).slice(0, empties)) {
      board[Math.floor(p / side)][p % side] = 0;
  }

  return board;
};

exports.puzzleToString = function(puzzle) {
  return puzzle.map(row => row.map(cell => cell.toString()).join('')).join('');
};

exports.createPuzzle = function(currBlock) {
  if (!currBlock.isGenesisBlock() && currBlock.prevBlockHash) {
    let puzzle_num = exports.htonum(currBlock.prevBlockHash);
    const sudokuPuzzle = exports.generateSudoku(puzzle_num);
    return '9_' + exports.puzzleToString(sudokuPuzzle);
  }
  else {
    const sudokuPuzzle = exports.generateSudoku(0);
    return '9_' + exports.puzzleToString(sudokuPuzzle);
  }
  
};