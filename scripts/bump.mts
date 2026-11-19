import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const file = path.join(import.meta.dirname, '..', 'index.d.ts');
const changes = path.join(import.meta.dirname, '..', 'changes.json');

const read = (text: string) => {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const aliases = new Map<string, ts.TypeNode>();
  for (const statement of source.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      aliases.set(statement.name.text, statement.type);
    }
  }

  const collect = (node: ts.TypeNode, seen: Set<string>, out: Set<string>) => {
    if (ts.isUnionTypeNode(node)) {
      for (const type of node.types) collect(type, seen, out);
    } else if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) {
      out.add(node.literal.text);
    } else if (ts.isTemplateLiteralTypeNode(node)) {
      out.add(node.getText(source));
    } else if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const name = node.typeName.text;
      const target = aliases.get(name);
      if (target && !seen.has(name)) {
        seen.add(name);
        collect(target, seen, out);
        seen.delete(name);
      }
    }
  };

  const properties = new Map<string, Set<string>>();
  const root = aliases.get('CSSDefs');
  const literal =
    root && ts.isTypeReferenceNode(root) ? root.typeArguments?.[0] : root;
  if (literal && ts.isTypeLiteralNode(literal)) {
    for (const member of literal.members) {
      if (ts.isPropertySignature(member) && member.type) {
        const values = new Set<string>();
        collect(member.type, new Set(), values);
        properties.set(member.name.getText(source), values);
      }
    }
  }
  return properties;
};

let previous = '';
try {
  previous = execFileSync('git', ['show', 'HEAD:index.d.ts'], {
    encoding: 'utf8',
  });
} catch {}

const current = fs.readFileSync(file, 'utf8');

if (previous === current) {
  console.log('none');
} else if (!previous) {
  console.log('patch');
} else {
  const before = read(previous);
  const after = read(current);
  type Change = { property: string; values: string[] };
  const missing = (
    from: Map<string, Set<string>>,
    to: Map<string, Set<string>>,
  ) => {
    const result: Change[] = [];
    for (const [property, values] of from) {
      const other = to.get(property);
      if (!other) {
        result.push({ property, values: [] });
        continue;
      }
      const gone = [...values].filter((value) => !other.has(value));
      if (gone.length > 0) result.push({ property, values: gone });
    }
    return result;
  };
  const describe = (changes: Change[]) =>
    changes
      .map(({ property, values }) =>
        values.length ? `${property}: ${values.join(', ')}` : property,
      )
      .join('; ');
  const removed = missing(before, after);
  const added = missing(after, before);
  if (removed.length > 0 || added.length > 0) {
    fs.writeFileSync(
      changes,
      `${JSON.stringify(
        { date: new Date().toISOString().slice(0, 10), added, removed },
        null,
        2,
      )}\n`,
    );
  }
  if (removed.length > 0) {
    console.error(`Removed: ${describe(removed)}`);
    console.log('minor');
  } else if (added.length > 0) {
    console.error(`Added: ${describe(added)}`);
    console.log('patch');
  } else {
    console.log('none');
  }
}
