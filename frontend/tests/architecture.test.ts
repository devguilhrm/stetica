import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import ts from "typescript";

const source = resolve("src");
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : entry.name.endsWith(".ts")
        ? [join(directory, entry.name)]
        : [],
  );
}
function imports(file: string): string[] {
  const ast = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  return ast.statements.flatMap((node) =>
    ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)
      ? [node.moduleSpecifier.text]
      : [],
  );
}
for (const layer of ["domain", "application"]) {
  test(`${layer} depende somente de camadas internas e não conhece Angular ou browser`, () => {
    for (const file of files(join(source, layer))) {
      for (const module of imports(file)) {
        assert.ok(
          module.startsWith("."),
          `${file}: dependência externa ${module}`,
        );
        const target = resolve(dirname(file), module);
        const allowed = [layer, ...(layer === "application" ? ["domain"] : [])];
        assert.ok(
          allowed.some((value) => target.startsWith(join(source, value) + sep)),
          `${file}: dependência invertida ${module}`,
        );
      }
      assert.doesNotMatch(
        readFileSync(file, "utf8"),
        /\b(?:window|document|sessionStorage|localStorage|fetch|XMLHttpRequest)\b/,
      );
    }
  });
}
test("apresentação não acessa adapters, endpoints HTTP ou armazenamento diretamente", () => {
  for (const file of files(join(source, "presentation"))) {
    for (const module of imports(file)) {
      assert.ok(
        !resolve(dirname(file), module).startsWith(
          join(source, "infrastructure") + sep,
        ),
        file,
      );
      assert.notEqual(module, "@angular/common/http", file);
    }
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /\b(?:sessionStorage|localStorage|fetch|XMLHttpRequest)\b|['"]\/api\//,
    );
  }
});
