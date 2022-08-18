import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import { readFileSync } from "fs";
import path from "path";
const lo = require('buffer-layout');

const SOLANA_NETWORK = 'devnet';

let connection: Connection;
let programKeypair: Keypair;
let programId: PublicKey;

let ringoKeypair: Keypair;
let georgeKeypair: Keypair;
let paulKeypair: Keypair;
let johnKeypair: Keypair;

function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(readFileSync(path, 'utf-8')))
    )
}

async function sendLamports(from: Keypair, to:PublicKey, amount: number) {
    let data = Buffer.alloc(8) 
    //* Serialize하는 방법
    //* 메모리에 있는 데이터는 컴퓨터마다 메모리가 다르기 때문에, 네트워크에 올리려면 
    //* 대부분 시리얼라이즈를 해야 된다고 생각하면 된다
    lo.ns64("value").encode(amount, data);

    let instruction = new TransactionInstruction({
        keys: [
            {pubkey: from.publicKey, isSigner: true, isWritable: true}, //* true여야 되는게 아닌가? 데이터가 직접 바뀌어야하니까?
            {pubkey: to, isSigner: false, isWritable: true},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
        ],
        programId,
        data
    })

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [from]
    )
}

async function main() { 
    connection = new Connection(
        `https://api.${SOLANA_NETWORK}.solana.com`,
        "confirmed"
    )
    programKeypair = createKeypairFromFile(
        path.join(
            path.resolve(__dirname, "../_dist/program"),
            "program-keypair.json"
        )
    )
    programId = programKeypair.publicKey;
    ringoKeypair = createKeypairFromFile( path.resolve(__dirname , "../accounts/ringo.json"));
    georgeKeypair = createKeypairFromFile(path.resolve(__dirname , "../accounts/george.json"));
    paulKeypair = createKeypairFromFile(  path.resolve(__dirname , "../accounts/paul.json"));
    johnKeypair = createKeypairFromFile(  path.resolve(__dirname , "../accounts/john.json"));

    //* John sends some SOL to Ringo
    console.log("John sends some SOL to Ringo...");
    console.log(`   John's public key: ${johnKeypair.publicKey}`);
    console.log(`   Ringo's public key: ${ringoKeypair.publicKey}`);
    await sendLamports(johnKeypair, ringoKeypair.publicKey, 50000000)
    // Paul sends some SOL to George.
    console.log("Paul sends some SOL to George...");
    console.log(`   Paul's public key: ${paulKeypair.publicKey}`);
    console.log(`   George's public key: ${georgeKeypair.publicKey}`);
    await sendLamports(paulKeypair, georgeKeypair.publicKey, 30000000)
    
    // George sends some SOL over to John.
    console.log("George sends some SOL over to John...");
    console.log(`   George's public key: ${georgeKeypair.publicKey}`);
    console.log(`   John's public key: ${johnKeypair.publicKey}`);
    await sendLamports(georgeKeypair, johnKeypair.publicKey, 40000000)
}

main()
.then(
() => process.exit()
).catch(
    err => {
        console.error(err);
        process.exit(-1);
    }
)
