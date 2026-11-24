// Prove `my-circuit` with its generated client, then verify the proof onchain with
// the `my-circuit` program in LiteSVM. `xark build` makes the circuit and its client;
// the program comes from its framework's build tools
import { generateKeyPairSigner, type Address } from "@solana/kit";
import { circuit, funded, program, send, vm } from "@blueshift-gg/xark/testing";
import { MyCircuit, type MyCircuitInputs, type MyCircuitProver } from "../clients/my-circuit/ts/my_circuit";

/** 3 squared is 9: the starter circuit's statement. */
const INPUTS: MyCircuitInputs = { secret: 3, result: 9 };

let id: Address;
let prover: MyCircuitProver;
beforeAll(async () => {
  id = (await generateKeyPairSigner()).address; // the program takes any address
  // Pinned to the circuit this client was generated from.
  prover = await MyCircuit.prover(circuit("my-circuit"), { digest: MyCircuit.digest });
});

/** `Verify`: its discriminator (0), then the proof and its public inputs. */
const verify = (data: Uint8Array) => ({ programAddress: id, data: new Uint8Array([0, ...data]) });

test("a proof verifies onchain", async () => {
  const proof = prover.prove(INPUTS);
  const svm = vm({ [id]: program("my-circuit") });
  const payer = await funded(svm);

  await send(svm, payer, verify(proof.toInstructionData()));

  const tampered = proof.toInstructionData();
  tampered[0] ^= 1;
  await expect(send(svm, payer, verify(tampered))).rejects.toThrow(/InvalidProof/);
});
