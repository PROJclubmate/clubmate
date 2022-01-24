import {keyPairFromSecretKey, keyPairFromSeed, newKeyPair} from 'watsign';
import {toBytes, toBase64} from 'fast-base64/js';
import {toUrl, fromUrl} from 'fast-base64/url';
import { webcrypto } from "crypto";

const { subtle } = webcrypto;

// const crypto = await import('crypto');
// console.log(crypto.subtle)
function decode(base64String) {
    return toBytes(fromUrl(base64String));
}

function encode(binaryData) {
    return toUrl(toBase64(binaryData));
}

async function createIdentityFromSeed(seedString) {
    const hash = new Uint8Array(await subtle.digest('SHA-512', new TextEncoder().encode(seedString))).slice(0, 32);
    const keypair = await keyPairFromSeed(hash);
    let publicKey = String(encode(keypair.publicKey));
    let secretKey = String(encode(keypair.secretKey));
    console.log(publicKey);
}

createIdentityFromSeed("priyamxyz")
