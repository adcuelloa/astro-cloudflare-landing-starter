export function duplicateJsonKeys(source) {
  const duplicates = [];
  const stack = [];
  const tokens = source.match(/"(?:\\.|[^"\\])*"|[{}[\],:]/g) ?? [];

  for (const token of tokens) {
    const parent = stack.at(-1);

    if (token === "{") {
      const path =
        parent?.type === "object" && parent.key
          ? [...parent.path, parent.key]
          : (parent?.path ?? []);
      stack.push({ type: "object", path, keys: new Set(), expectsKey: true, key: "" });
      continue;
    }

    if (token === "[") {
      const path =
        parent?.type === "object" && parent.key
          ? [...parent.path, parent.key]
          : (parent?.path ?? []);
      stack.push({ type: "array", path });
      continue;
    }

    if (token === "}" || token === "]") {
      stack.pop();
      continue;
    }

    const current = stack.at(-1);
    if (token === ",") {
      if (current?.type === "object") current.expectsKey = true;
      continue;
    }

    if (!token.startsWith('"') || current?.type !== "object" || !current.expectsKey) {
      continue;
    }

    const key = JSON.parse(token);
    const path = [...current.path, key].join(".");
    if (current.keys.has(key)) duplicates.push(path);
    current.keys.add(key);
    current.key = key;
    current.expectsKey = false;
  }

  return duplicates;
}
