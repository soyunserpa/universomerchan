import os from "os";

// The string from OCR trying all combinations of I and l
const token = "AQVKJHK2maZxHnWLxerx0DClxT9GChhatJ-yCxXwIwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMlHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0IsR1L2MlPtyA9plhKohvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA";

async function testToken(t) {
  const r = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { "Authorization": `Bearer ${t}`, "X-RestLi-Protocol-Version": "2.0.0"}
  });
  const data = await r.json();
  if (data.status !== 401) {
    console.log("SUCCESS!", t, data);
    return true;
  }
  return false;
}

// Generate combinations for ambiguos characters in OCR
// DCIx vs DClx
// CxXwlw vs CxXwIw
// WoTIS vs WoTlS
// 1BIP6 vs 1BlP6
// bjMIH vs bjMlH
// J0lsR vs J0IsR
// 2MIPt vs 2MlPt

// Original from Marina: AQVKJHK2maZxHnWLxerx0DClxT9GChhatJ-yCxXwIwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMlHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0IsR1L2MlPtyA9pIhKoHvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA
// Note: "pIhKoHv" vs "plhKoHv" towards the end.

async function main() {
    console.log("Testing original...");
    await testToken(token);
    let variations = [
       token,
       token.replace("pIhKoHv", "plhKoHv"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw").replace("WoTlS", "WoTIS"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw").replace("WoTlS", "WoTIS").replace("1BlP6", "1BIP6"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw").replace("WoTlS", "WoTIS").replace("1BlP6", "1BIP6").replace("bjMlH", "bjMIH"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw").replace("WoTlS", "WoTIS").replace("1BlP6", "1BIP6").replace("bjMlH", "bjMIH").replace("J0IsR", "J0lsR"),
       token.replace("pIhKoHv", "plhKoHv").replace("0DClx", "0DCIx").replace("CxXwIw", "CxXwlw").replace("WoTlS", "WoTIS").replace("1BlP6", "1BIP6").replace("bjMlH", "bjMIH").replace("J0IsR", "J0lsR").replace("2MlPt", "2MIPt")
    ];
    
    // Some more brute forcing of Il since it's the most common OCR failure
    const ambigChars = [
        ["I", "l"], ["I", "l"], ["I", "l"], ["I", "l"], ["I", "l"], ["I", "l"], ["I", "l"], ["I", "l"]
    ];
    
    // There are definitely some V and v mixes
    variations.push(token.replace("enT60Vi", "enT60vi").replace("pIhKoHv", "plhKoHv"))
    
    for (let i = 0; i < variations.length; i++) {
        let v = variations[i];
        console.log("Testing variation", i);
        let s = await testToken(v);
        if (s) return;
        
        // try v instead of V in enT60Vi
        let v2 = v.replace("enT60Vi", "enT60vi");
        if (v2 !== v) {
            let s2 = await testToken(v2);
            if (s2) return;
        }
    }
}

main();
