#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = resolve(repositoryRoot, "v1");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function safeContentPath(relativePath) {
  const resolved = resolve(contentRoot, relativePath);
  assert(
    resolved.startsWith(`${contentRoot}/`),
    `内容路径越界：${relativePath}`,
  );
  return resolved;
}

const manifestData = await readFile(resolve(contentRoot, "manifest.json"));
const manifest = JSON.parse(manifestData);

assert(manifest.schemaVersion === 1, "manifest.schemaVersion 必须为 1");
assert(Number.isInteger(manifest.contentVersion) && manifest.contentVersion > 0, "contentVersion 无效");
assert(Array.isArray(manifest.packs) && manifest.packs.length > 0, "manifest.packs 不能为空");

const packIDs = new Set();
for (const entry of manifest.packs) {
  assert(typeof entry.id === "string" && entry.id.length > 0, "卡包 id 无效");
  assert(!packIDs.has(entry.id), `卡包 id 重复：${entry.id}`);
  packIDs.add(entry.id);

  const packData = await readFile(safeContentPath(entry.url));
  assert(sha256(packData) === entry.checksum.toLowerCase(), `${entry.id} checksum 不一致`);

  const pack = JSON.parse(packData);
  assert(pack.schemaVersion === 1, `${entry.id} schemaVersion 无效`);
  assert(pack.id === entry.id, `${entry.id} 卡包 id 不一致`);
  assert(pack.version === entry.version, `${entry.id} 卡包版本不一致`);
  assert(pack.categoryID === entry.categoryID, `${entry.id} 分类不一致`);
  assert(Array.isArray(pack.cards), `${entry.id} cards 无效`);
  assert(pack.cards.length === entry.cardCount, `${entry.id} 卡片数量不一致`);

  const cardIDs = new Set();
  for (const card of pack.cards) {
    assert(typeof card.id === "string" && card.id.length > 0, `${entry.id} 存在无 id 卡片`);
    assert(!cardIDs.has(card.id), `${entry.id} 卡片 id 重复：${card.id}`);
    cardIDs.add(card.id);
    assert(card.topicID === entry.id, `${entry.id}/${card.id} topicID 不一致`);
  }
}

process.stdout.write(
  `内容校验通过：version ${manifest.contentVersion}，${manifest.packs.length} 个卡包，` +
    `${manifest.packs.reduce((sum, pack) => sum + pack.cardCount, 0)} 张卡片\n`,
);
