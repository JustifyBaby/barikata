# barikata

# Please wait npm publish...

# npmへの公開は少しお待ちください

# Notice

## このpackageはReact-hook-formを使うと、より堅牢になります。理由はname属性に間違った値を入れることを防ぐことができるためです。

# Motivate

Nextjs14の登場により、Server Actionが開発のデファクトスタンダードとなった。
しかし、FormDataのgetメソッドではname属性を文字列で受け取るためとても型安全とは言えない。
例えば以下の状況ではエラーを見つけることが困難である

```ts:schema.ts
import z from "zod";
export const PostSchema = z.object({
    title: z.string(),
    content: z.string(),
});
```

```tsx:PostForm.tsx
// imports
export default function PostForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof PostSchema>>({
        resolver: zodResolver(PostSchema)
    });

    // SOME LOGIC...

    return (
        <form>
            {/* ... */}
            <input {...register("title")} />
            {/* ... */}
            <textarea {...register("content")}>
            </textarea>
        </form>
    );
}
```

```ts:postAction.ts
"use server"
// imports...

export async function addPostAction(formData: FormData) {
    // Typo
    const title = formData.get("tytle") as string;
    // Misunderstanding key name
    const body = formData.get("body") as string;

    // other logics...
}
```

このとき、titleもbodyにもnullを無理やりstringにした値が代入されます。

これを私は以下の形で型安全にすることで解決しようと考えました。

```ts:postAction.ts
"use server"
import zFormGetter from "barikata";
// other imports...

export async function addPostAction(formData: FormData) {
    const {
        parsed,
        safeParse,
        field
    } = zFormGetter(formData, PostSchema);

    if(!parsed.success) {
        // error handle...
    }

    const data = parsed.data;

    // parse with option
    const asyncData = safeParse({ jitless: false });
    // Personal get
    const title = field("title");
    const content = field("content");

    // other logics...
}
```

## How to use

```ts
import { z } from "zod";
import { zFormGetter } from "barikata";

const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function addPostAction(formData: FormData) {
  const { parsed, safeParse, field } = zFormGetter(formData, PostSchema);

  // 1. parsed で全体を一度に検証
  if (!parsed.success) {
    // validation error handling
    return {
      success: false,
      errors: parsed.error.format(),
    };
  }

  // 2. 型安全な field() で個別フィールドを取得
  const title = field("title");
  const content = field("content");
  const tags = field("tags");

  // 3. safeParse() でオプションを指定して再検証
  const safeResult = safeParse({ jitless: false });

  return {
    success: true,
    data: parsed.data,
    title,
    content,
    tags,
    safeResult,
  };
}
```

### What it gives you

- `parsed` は `z.ZodSafeParseResult` なので全体検証の成否とパース済みデータを扱えます。
- `field("key")` はスキーマで定義したキーのみを受け付け、型に従った値を返します。
- `safeParse()` は `FormData` を `Zod` によって再解析し、`jitless` などのオプションを指定できます。
- `tags` のような配列フィールドでも `FormData.getAll()` を自動で使います。

# LICENSE

MIT
