"use strict";

let Blockchain = require('./blockchain.js');
let Client = require('./client.js');
const { exec } = require('child_process');
const utils = require('./utils.js');

/**
 * Miners are clients, but they also mine blocks looking for "proofs".
 */
module.exports = class Miner extends Client {

  /**
   * When a new miner is created, but the PoW search is **not** yet started.
   * The initialize method kicks things off.
   * 
   * @constructor
   * @param {Object} obj - The properties of the client.
   * @param {String} [obj.name] - The miner's name, used for debugging messages.
   * * @param {Object} net - The network that the miner will use
   *      to send messages to all other clients.
   * @param {Block} [startingBlock] - The most recently ALREADY ACCEPTED block.
   * @param {Object} [obj.keyPair] - The public private keypair for the client.
   * @param {Number} [miningRounds] - The number of rounds a miner mines before checking
   *      for messages.  (In single-threaded mode with FakeNet, this parameter can
   *      simulate miners with more or less mining power.)
   */
  constructor({ name, net, startingBlock, keyPair, miningRounds = Blockchain.NUM_ROUNDS_MINING } = {}) {
    super({ name, net, startingBlock, keyPair });
    this.miningRounds = miningRounds;
    this.prevBlockTime = 0;

    // Set of transactions to be added to the next block.
    this.transactions = new Set();
  }

  /**
   * Starts listeners and begins mining.
   */
  initialize() {
    this.startNewSearch();

    this.on(Blockchain.START_MINING, this.findProof);
    this.on(Blockchain.POST_TRANSACTION, this.addTransaction);

    setTimeout(() => this.emit(Blockchain.START_MINING), 0);
  }

  /**
   * Sets up the miner to start searching for a new block.
   * 
   * @param {Set} [txSet] - Transactions the miner has that have not been accepted yet.
   */
  async startNewSearch(txSet = new Set()) {
    this.startTime = new Date();


    this.currentBlock = Blockchain.makeBlock(this.address, this.lastBlock);
    this.currentBlock.sudoku_result = null;
    this.currentBlock.moves_made = null;
    this.currentBlock.sudoku_puzzle = null;
    this.currentBlock.blockTime = 0;
    const pythonScript = "puzzle_scripts/puzzle_solve.py";

    const puzzle_str = utils.createPuzzle(this.currentBlock);

    this.currentBlock.sudoku_puzzle = puzzle_str;
    let res = await new Promise((resolve, reject) => {
      exec(`python ${pythonScript} ${puzzle_str}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`Error: ${error}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
        }
        resolve(stdout);
      });
    });

    let json_res = JSON.parse(res);
    let solved_solution = json_res.solution;
    let moves_made = json_res.moves_made;

    let hash_val = utils.hash(solved_solution.replace('\n', ''));
    let n = `0x${hash_val}`;
    this.currentBlock.sudoku_result = n;

    let serialized_moves = JSON.stringify(moves_made);
    let encodedMoves = Buffer.from(serialized_moves).toString('base64');
    this.currentBlock.moves_made = encodedMoves;
    // Merging txSet into the transaction queue.
    // These transactions may include transactions not already included
    // by a recently received block, but that the miner is aware of.
    txSet.forEach((tx) => this.transactions.add(tx));

    // Add queued-up transactions to block.
    this.transactions.forEach((tx) => {
      this.currentBlock.addTransaction(tx, this);
    });
    this.transactions.clear();


  }

  /**
   * Looks for a "proof".  It breaks after some time to listen for messages.  (We need
   * to do this since JS does not support concurrency).
   * 
   * The 'oneAndDone' field is used for testing only; it prevents the findProof method
   * from looking for the proof again after the first attempt.
   * 
   * @param {boolean} oneAndDone - Give up after the first PoW search (testing only).
   */
  findProof(oneAndDone = false) {
    if (this.currentBlock.sudoku_result) {
      if (this.currentBlock.hasValidProof()) {
        console.log('Miner solved puzzle hash: ' + this.currentBlock.sudoku_result);
        this.log(`found proof for block ${this.currentBlock.chainLength}: ${this.currentBlock.sudoku_result}`);
        let endTime = new Date(); // Capture the end time when proof is found and being announced
        let duration = endTime - this.startTime; // Calculate duration in milliseconds
        this.currentBlock.blockTime = duration;
        console.log(`Duration of mining (useful work) by ${this.name}: ${duration} ms`);
        this.startTime = null;

        this.announceProof();
        // Note: calling receiveBlock triggers a new search.
        this.receiveBlock(this.currentBlock);
      }
    }
    if (!oneAndDone) {
      // Check if anyone has found a block, and then return to mining.
      setTimeout(() => this.emit(Blockchain.START_MINING), 0);
    }
  }

  /**
   * Broadcast the block, with a valid proof included.
   */
  announceProof() {
    this.net.broadcast(Blockchain.PROOF_FOUND, this.currentBlock);
  }

  /**
   * Receives a block from another miner. If it is valid,
   * the block will be stored. If it is also a longer chain,
   * the miner will accept it and replace the currentBlock.
   * 
   * @param {Block | Object} b - The block
   */
  receiveBlock(s) {
    let b = super.receiveBlock(s);

    if (b === null) return null;

    // We switch over to the new chain only if it is better.
    if (this.currentBlock && b.chainLength >= this.currentBlock.chainLength) {
      this.log(`cutting over to new chain.`);
      let txSet = this.syncTransactions(b);
      this.startNewSearch(txSet);
    }

    return b;
  }

  /**
   * This function should determine what transactions
   * need to be added or deleted.  It should find a common ancestor (retrieving
   * any transactions from the rolled-back blocks), remove any transactions
   * already included in the newly accepted blocks, and add any remaining
   * transactions to the new block.
   * 
   * @param {Block} nb - The newly accepted block.
   * 
   * @returns {Set} - The set of transactions that have not yet been accepted by the new block.
   */
  syncTransactions(nb) {
    let cb = this.currentBlock;
    let cbTxs = new Set();
    let nbTxs = new Set();

    // The new block may be ahead of the old block.  We roll back the new chain
    // to the matching height, collecting any transactions.
    while (nb.chainLength > cb.chainLength) {
      nb.transactions.forEach((tx) => nbTxs.add(tx));
      nb = this.blocks.get(nb.prevBlockHash);
    }

    // Step back in sync until we hit the common ancestor.
    while (cb && cb.id !== nb.id) {
      // Store any transactions in the two chains.
      cb.transactions.forEach((tx) => cbTxs.add(tx));
      nb.transactions.forEach((tx) => nbTxs.add(tx));

      cb = this.blocks.get(cb.prevBlockHash);
      nb = this.blocks.get(nb.prevBlockHash);
    }

    // Remove all transactions that the new chain already has.
    nbTxs.forEach((tx) => cbTxs.delete(tx));

    return cbTxs;
  }

  /**
   * Returns false if transaction is not accepted. Otherwise stores
   * the transaction to be added to the next block.
   * 
   * @param {Transaction | String} tx - The transaction to add.
   */
  addTransaction(tx) {
    tx = Blockchain.makeTransaction(tx);
    this.transactions.add(tx);
  }

  /**
   * When a miner posts a transaction, it must also add it to its current list of transactions.
   *
   * @param  {...any} args - Arguments needed for Client.postTransaction.
   */
  postTransaction(...args) {
    let tx = super.postTransaction(...args);
    return this.addTransaction(tx);
  }

};
