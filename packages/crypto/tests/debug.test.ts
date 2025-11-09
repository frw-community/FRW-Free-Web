import { describe, test } from '@jest/globals';
import { SignatureManager } from '../src/signatures';

describe('Debug signature issue', () => {
  test('debug signPage and verifyPage', () => {
    const keyPair = SignatureManager.generateKeyPair();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

    console.log('=== ORIGINAL HTML ===');
    console.log(html);
    console.log('');

    // Step 1: Sign the page
    const signed = SignatureManager.signPage(html, keyPair.privateKey);
    console.log('=== SIGNED HTML ===');
    console.log(signed);
    console.log('');

    // Step 2: Extract signature
    const extractedSig = SignatureManager.extractSignature(signed);
    console.log('=== EXTRACTED SIGNATURE ===');
    console.log(extractedSig);
    console.log('');

    // Step 3: Remove signature to get canonical
    const canonical = SignatureManager.removeSignature(signed);
    console.log('=== CANONICAL (after removing signature) ===');
    console.log(canonical);
    console.log('');

    // Step 4: Compare canonical with original
    console.log('=== CANONICAL === ORIGINAL? ===');
    console.log(canonical === html);
    console.log('');

    // Step 5: Try verification manually
    if (extractedSig) {
      const manualVerify = SignatureManager.verify(canonical, extractedSig, keyPair.publicKey);
      console.log('=== MANUAL VERIFY ===');
      console.log(manualVerify);
    }

    // Step 6: Try full verifyPage
    const valid = SignatureManager.verifyPage(signed, keyPair.publicKey);
    console.log('=== VERIFY PAGE ===');
    console.log(valid);
  });
});
