import z from "zod";
import { zFormGetter } from ".";

const formData = new FormData();

formData.append("title", "Hello This is example!");
formData.append(
  "content",
  "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Corrupti quod inventore optio nam, recusandae dolore esse dolorum eos ullam repellendus illum! Illo, nesciunt quos. Placeat iusto vitae illo ipsam cupiditate?",
);

const PostSchema = z.object({ title: z.string(), content: z.string() });

const isObjectEqualShallow = (
  obj1: Record<string, any> | null | undefined,
  obj2: Record<string, any> | null | undefined,
): boolean => {
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 1. プロパティの数が違えば一発でアウト
  if (keys1.length !== keys2.length) return false;

  // 2. すべてのキーと値（===による比較）が一致するかチェック
  return keys1.every((key) => obj1[key] === obj2[key]);
};

function postAction(formData: FormData) {
  const { field, parsed, safeParse } = zFormGetter(formData, PostSchema);
  console.log("Success Pattern");
  console.log("title", field("title"));
  console.log("content", field("content"));

  console.log("Error Pattern");
  //   This is typo pattern.
  console.log("tytle", field("tytle"));
  //   This is different key error pattern.
  console.log("body", field("body"));

  console.log("What safeParse returns?", parsed);

  console.log(
    "Does safeParse success?",
    isObjectEqualShallow(parsed.data, {
      title: field("title"),
      content: field("content"),
    }),
  );

  // option: jitless
  const jitlessParsed = safeParse({ jitless: false });
  console.log("Even if jitless-option? ", jitlessParsed.success);
}

postAction(formData);
