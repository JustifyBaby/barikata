# barikata

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
