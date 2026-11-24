# my-circuit-client

Auto-generated Solana Groth16 verifier for a circuit with **1 public
input(s)**. The verifying key is embedded; re-run `xark export` to regenerate
when the circuit changes — this crate is the only dependency your program
updates.

## Use from your Solana program

```toml
[dependencies]
my-circuit-client = { path = "path/to/my-circuit-client" }   # or a git/published source
```

The proof comes in the instruction data (256 bytes: a client's `proof.toBytes()`).
The public inputs are what your program requires, from its own state (a policy, a
root, a nullifier): build a `PublicInputs`, the circuit's public inputs by name,
which packs them into field elements as the circuit's `#[input]` does:

```rust
let Some(proof) = instruction_data.first_chunk::<256>() else {
    return Err(ProgramError::InvalidInstructionData);
};
let proof = my_circuit_client::Proof::from_le_bytes(proof);
let inputs = my_circuit_client::PublicInputs { /* from your program's state */ };
if !my_circuit_client::verify(&proof, inputs) {
    return Err(ProgramError::InvalidArgument);
}
```

`verify` takes anything that converts into `my_circuit_client::Fields`, the `[[u8; 32]; 1]`
field elements in proof order: a `PublicInputs`, the elements themselves, or your
own struct with a `From` impl, packed with `my_circuit_client::fields` (const fns, so inputs
known at compile time are constants).

A transaction that carries the public inputs too (`proof || public_inputs`, a
client's `proof.toInstructionData()`) splits them off after the proof's 256 bytes
into `Fields`, and `verify` checks both.

## Trusted setup

`my_circuit_client::SETUP` is `single-party`. A single-party setup from OS randomness: sound unless whoever ran `xark setup` kept that randomness (xark doesn't). `xark ceremony` spreads that trust. See xark's
[trusted setup](https://github.com/blueshift-gg/xark/blob/master/docs/trusted-setup.md)
guide for a setup that no single party has to be trusted for.

## Replay protection

A valid proof is not unique: anyone holding one can re-randomize it into a
different valid proof of the same public inputs (a property of Groth16;
`verify_strict` does not change it). So never use proof bytes, or their hash,
as a replay or "already used" key. Put replay protection in the public inputs
instead: a nullifier or nonce the circuit derives from a secret, or the signer
or context the proof is for, and record *that* on-chain.

Export after `xark prove` to bundle a sample proof, which `cargo test` in this
crate then verifies against the embedded VK. A TypeScript client from `xark client` sends a proof in this format:
`proof.toBytes()`.
