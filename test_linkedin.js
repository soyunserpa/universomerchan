fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { "Authorization": "Bearer AQVKJHK2maZxHnWLxerx0DCIxT9GChhatJ-yCxXwlwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPSЗLh1_I9S63CyWVmbv7323VqQCtJHzNQХgK1BIP6IfHQUxsmwWoTlS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OIvyFbN4n2po2u0bjMIHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0IsR1L2MIPtyA9plhKoHvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA", "X-RestLi-Protocol-Version": "2.0.0"}
}).then(res => res.json()).then(console.log)
