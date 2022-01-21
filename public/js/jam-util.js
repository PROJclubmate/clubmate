import {
  keyPairFromSeed,
} from '/js/watsign/mod.js';

function toBase64(b) {
  return btoa([...b].map(x => String.fromCharCode(x)).join(""));
}

function toUrl(url) {
  return url.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function encode(binaryData) {
  return toUrl(toBase64(binaryData));
}

async function seedToPublicKey(seedString) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(seedString))).slice(0, 32);
  const keypair = await keyPairFromSeed(hash);
  console.log(keypair);

  let publicKey = encode(keypair.publicKey);
  console.log("public key", publicKey);
}

seedToPublicKey("priyamxyz");

console.log("Hello");