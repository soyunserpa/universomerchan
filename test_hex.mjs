const token = "***REMOVED***";
let bad = false;
for (let i=0; i<token.length; i++) {
   const code = token.charCodeAt(i);
   if (code < 32 || code > 126) {
       console.log(`Bad char at ${i}: code ${code}`);
       bad = true;
   }
}
if (!bad) console.log("All characters are ASCII valid.");
