/* Shared glossary definitions for hover-terms across explorable pages.
 * Keyed by data-term. Reused by glossary-tooltip.js. Keep in sync with
 * reference/glossary.html (the canonical, fuller definitions). */
window.GLOSSARY = {
  "double-spending": { term: "Double-spending", def: "Spending the same coin twice. With no central authority, the only defense is everyone agreeing on which transfer came first." },
  "digital-signatures": { term: "Digital signature", def: "A value only the holder of a private key can produce, but anyone with the matching public key can verify. Proves authorization — not ordering." },
  "trusted-third-party": { term: "Trusted third party", def: "A bank or mint that sits between parties and vouches for transactions. Bitcoin's goal is to remove it entirely." },
  "proof-of-work": { term: "Proof-of-work", def: "Finding a hash below a target by brute force. Expensive to produce, trivial to verify — the engine that makes history costly to rewrite." },
  "cpu-power": { term: "CPU power", def: "Hashing throughput. In Bitcoin, voting weight is proportional to compute, not to the number of identities (one-CPU-one-vote)." },
  "longest-chain": { term: "Longest chain", def: "The chain with the most cumulative proof-of-work. Treated as the canonical history; honest nodes always extend it." },
  "hash": { term: "Hash", def: "A fixed-size fingerprint of data (SHA-256 here). Any change to the input changes the output unpredictably; you can't run it backwards." },
  "public-key": { term: "Public key", def: "The shareable half of a keypair. Acts as the payee's address: signing a coin over to this key transfers ownership to whoever holds the matching private key." },
  "private-key": { term: "Private key", def: "The secret half of a keypair. Used to sign — i.e. to authorize spending the coin. Whoever holds it controls the coin." },
  "electronic-coin": { term: "Electronic coin", def: "Not a file or token — literally a chain of digital signatures, each one transferring the coin to the next owner." },
  "mint": { term: "Mint", def: "A central issuer that re-issues coins after each transaction to guarantee they aren't double-spent. The single point of failure Bitcoin avoids." },
  "timestamp-server": { term: "Timestamp server", def: "A service that hashes a batch of items plus the previous hash and publishes it — proving the data existed at that time. The conceptual seed of the blockchain." },
  "nonce": { term: "Nonce", def: "A throwaway number in the block header that miners increment over and over, searching for one that makes the block hash fall below the target." },
  "hashcash": { term: "Hashcash", def: "Adam Back's 2002 proof-of-work scheme (originally anti-spam). Bitcoin borrows its 'find a hash with leading zero bits' mechanism." },
  "difficulty": { term: "Difficulty", def: "How many leading zero bits a valid hash needs. Auto-adjusts via a moving average so blocks arrive ~every 10 minutes regardless of total hash power." },
  "one-cpu-one-vote": { term: "One-CPU-one-vote", def: "Voting weight = hash power, not identities. Defeats Sybil attacks: spinning up many IPs/nodes adds zero compute, so it adds zero votes." },
  "merkle-tree": { term: "Merkle tree", def: "A binary tree of hashes over the block's transactions. Only the root goes in the header, so spent transactions can be pruned without changing the block's hash." },
  "merkle-root": { term: "Merkle root", def: "The single hash at the top of the Merkle tree, committed in the block header. It fingerprints every transaction in the block at once." },
  "merkle-branch": { term: "Merkle branch", def: "The short path of sibling hashes from one transaction up to the root. Lets a lightweight client prove a transaction is in a block without the whole block." },
  "block-header": { term: "Block header", def: "~80 bytes: previous block hash, Merkle root, timestamp, difficulty target, and nonce. The minimal data needed to verify the chain." },
  "spv": { term: "Simplified Payment Verification", def: "Verifying a payment with only block headers plus a Merkle branch — no full node required. Trusts that the longest chain reflects honest majority." },
  "incentive": { term: "Incentive", def: "The block reward + fees paid to whoever mines a block. Funds security and distributes coins, with no central issuer." },
  "transaction-fee": { term: "Transaction fee", def: "Input value minus output value. Goes to the block's miner; eventually replaces the block subsidy entirely as new-coin issuance stops." },
  "inputs-outputs": { term: "Inputs & outputs", def: "A transaction spends one or more inputs and creates outputs (typically the payment plus change). Lets value be split and combined freely." },
  "binomial-random-walk": { term: "Binomial random walk", def: "Models the honest-vs-attacker race: +1 when the honest chain extends, −1 when the attacker's does. The attacker is trying to reach 0 from behind." },
  "gamblers-ruin": { term: "Gambler's ruin", def: "Classic probability problem: a gambler starting at a deficit, with worse-than-even odds, almost surely never breaks even. Maps exactly onto the attacker catching up." },
  "poisson": { term: "Poisson distribution", def: "Models how many blocks the attacker likely found while honest miners found z, with expected value λ = z·(q/p)." }
};
