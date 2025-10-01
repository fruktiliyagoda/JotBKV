import { BKVDatabase } from "@src/storage/db.ts";

Deno.test("BKVDatabase basic CRUD", async () => {
  const db = new BKVDatabase("./test.bkv");
  await db.open();

  // set
  const key = "user:1";
  const value = new TextEncoder().encode(JSON.stringify({ name: "Alice" }));
  await db.set(key, value);

  // has
  if (!db.has(key)) {
    throw new Error("Key should exist after set()");
  }

  // get
  const got = await db.get(key);
  if (!got) throw new Error("Value should not be undefined");
  const decoded = JSON.parse(new TextDecoder().decode(got));
  if (decoded.name !== "Alice") {
    throw new Error("Decoded value is incorrect");
  }

  // delete
  await db.delete(key);
  if (db.has(key)) {
    throw new Error("Key should not exist after delete()");
  }

  await db.close();
  await Deno.remove("./test.bkv");
});