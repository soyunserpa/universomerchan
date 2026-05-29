const fs = require('fs');
let code = fs.readFileSync('src/app/api/favorites/route.ts', 'utf8');

code = code.replace(
  'import { getUserFromHeaders } from "@/lib/auth-service";',
  'import { requireAuth } from "@/lib/auth-service";'
);

code = code.replace(
  'const user = await getUserFromHeaders(req.headers.get("authorization"));\n    if (!user) {\n      return NextResponse.json({ error: "No autorizado" }, { status: 401 });\n    }',
  `const auth = await requireAuth(req.headers.get("authorization"));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;`
);

code = code.replace(
  'const user = await getUserFromHeaders(req.headers.get("authorization"));\n    if (!user) {\n      return NextResponse.json({ error: "No autorizado" }, { status: 401 });\n    }',
  `const auth = await requireAuth(req.headers.get("authorization"));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;`
);

fs.writeFileSync('src/app/api/favorites/route.ts', code);
console.log("Fixed API route");
