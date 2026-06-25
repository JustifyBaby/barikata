# barikata

# Install

```shell
npm i barikata
```

```shell
pnpm i barikata
```

```shell
bun i barikata
```

```shell
yarn add barikata
```

# Notice

**This package is more robust when used with React Hook Form because it helps prevent invalid values from being assigned to the `name` attribute.**

# Motivation

With the arrival of Next.js 14, Server Actions have become the de facto standard for application development.
However, `FormData.get()` accepts the field name as a plain string, so it is not type-safe.
For example, in the following scenario it can be difficult to catch errors:

```ts
import z from "zod";
export const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
});
```

```tsx
// imports
export default function PostForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof PostSchema>>({
    resolver: zodResolver(PostSchema),
  });

  // SOME LOGIC...

  return (
    <form>
      {/* ... */}
      <input {...register("title")} />
      {/* ... */}
      <textarea {...register("content")} />
    </form>
  );
}
```

```ts
"use server";
// imports...

export async function addPostAction(formData: FormData) {
  // Typo
  const title = formData.get("tytle") as string;
  // Wrong field name
  const body = formData.get("body") as string;

  // other logic...
}
```

In this case, both `title` and `body` are forced to `string` even though the values may be `null`.

I created this package to solve that problem in a type-safe way:

```ts
"use server";
import { zFormGetter } from "barikata";
// other imports...

export async function addPostAction(formData: FormData) {
  const { parsed, safeParse, field } = zFormGetter(formData, PostSchema);

  if (!parsed.success) {
    // handle validation errors...
  }

  const data = parsed.data;

  // parse with options
  const asyncData = safeParse({ jitless: false });
  // safely get a single field
  const title = field("title");
  const content = field("content");

  // other logic...
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

  // 1. Validate the whole form once with parsed
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.format(),
    };
  }

  // 2. Safely get individual fields with field()
  const title = field("title");
  const content = field("content");
  const tags = field("tags");

  // 3. Re-validate with options using safeParse()
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

- `parsed` is a `z.ZodSafeParseResult`, so you can inspect validation success and the parsed data.
- `field("key")` only accepts keys defined in the schema and returns values with the expected types.
- `safeParse()` re-parses the `FormData` with Zod and allows options like `jitless`.
- For array fields such as `tags`, it automatically uses `FormData.getAll()`.
