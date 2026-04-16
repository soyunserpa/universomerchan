import fs from "fs";

let baseToken = "AQVKJHK2maZxHnWLxerx0DClxT9GChhatJ-yCxXwIwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMlHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0IsR1L2MlPtyA9pIhKoHvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA";

// Fix some specific obvious ones from the screenshot:
// 1. "enT60Vi" -> "enT60vi" (this is lowercase 'v' in image)
baseToken = baseToken.replace("enT60Vi", "enT60vi");

// Identify ambiguous segments
// 0DClx or 0DCIx
// CxXwIw or CxXwlw
// 1BlP6 or 1BIP6
// WoTlS or WoTIS
// 0Olvy or 0OIvy
// bjMlH or bjMIH
// J0IsR or J0lsR
// 2MlPt or 2MIPt
// pIhKoHv or pIhKohv or plhKohv

// We can just find all indices of 'I' and 'l'
let indices = [];
for (let i = 0; i < baseToken.length; i++) {
   if (baseToken[i] === 'I' || baseToken[i] === 'l') {
       indices.push(i);
   }
}

// 12 indices. 2^12 = 4096 combinations.
// LinkedIn rate limit might block us. Let's do a smart subset based on the visual inspection against the screenshot:
// Screenshot clearly has these:
let smartTokens = [
  "AQVKJHK2maZxHnWLxerx0DCIxT9GChhatJ-yCxXwlwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMIHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0lsR1L2MlPtyA9plhKohvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA",
  "AQVKJHK2maZxHnWLxerx0DCIxT9GChhatJ-yCxXwlwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BIP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMIHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0lsR1L2MlPtyA9plhKohvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA",
  "AQVKJHK2maZxHnWLxerx0DCIxT9GChhatJ-yCxXwlwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BlP6IfHQUxsmwWoTIS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OlvyFbN4n2po2u0bjMIHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0lsR1L2MIPtyA9plhKohvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA"
];

async function check(t) {
  const r = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee", {
    headers: { "Authorization": `Bearer ${t}`, "X-RestLi-Protocol-Version": "2.0.0"}
  });
  if (r.status !== 401) {
    console.log("FOUND IT!!!!", t);
    process.exit(0);
  }
}

async function run() {
  for (let t of smartTokens) {
     await check(t);
  }
  console.log("Done checking smart ones.");
}
run();
