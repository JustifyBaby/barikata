import { z } from "zod";

// Zod の通常の safeParse が受け取る第2引数（params）の型を直接抽出する
type SafeParseParams = Parameters<z.ZodTypeAny["safeParse"]>[1];

// 1. 戻り値の型定義
export type FormGetter<Schema extends z.ZodObject<any>> = {
  // フィールドの値を Zodの型推論に基づいて正確に返す
  field: <Key extends keyof z.infer<Schema>>(
    key: Key,
  ) => z.infer<Schema>[Key] | undefined;

  // z.ParseParams を使うことで、内部Core型への依存を排除
  safeParse: (
    params?: SafeParseParams,
  ) => z.ZodSafeParseResult<z.infer<Schema>>;

  parsed: z.ZodSafeParseResult<z.infer<Schema>>;
};

/**
 * Zodスキーマからそのフィールドが配列（ZodArray）を期待しているかを再帰的に判定するヘルパー
 */
function isZodArraySchema(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodArray) return true;

  // .optional() や .nullable() などのラッパーを剥いて中身をチェック
  if ("unwrap" in schema && typeof schema.unwrap === "function") {
    return isZodArraySchema((schema as any).unwrap());
  }

  // z.preprocess() や z.transform() などのEffectsの裏にあるスキーマをチェック
  if (schema._def && "schema" in schema._def) {
    return isZodArraySchema((schema._def as { schema: z.ZodTypeAny }).schema);
  }
  return false;
}

// 2. 本体の実装
export const zFormGetter = <Schema extends z.ZodObject<any>>(
  formData: FormData,
  schema: Schema,
): FormGetter<Schema> => {
  // field の実装
  const field: FormGetter<Schema>["field"] = (key) => {
    if (typeof key === "number") return undefined;

    const fieldSchema = schema.shape[key.toString()];
    if (!fieldSchema) return undefined;

    const isArray = isZodArraySchema(fieldSchema);
    const rawValue = isArray
      ? formData.getAll(key.toString())
      : formData.get(key.toString());

    const result = fieldSchema.safeParse(rawValue);
    return result.success ? (result.data as any) : undefined;
  };

  // safeParse の実装
  const safeParse: FormGetter<Schema>["safeParse"] = (params) => {
    const rawData: Record<string, any> = {};

    for (const key of Object.keys(schema.shape)) {
      const fieldSchema = schema.shape[key];
      if (!fieldSchema) continue;

      const isArray = isZodArraySchema(fieldSchema);
      rawData[key] = isArray ? formData.getAll(key) : formData.get(key);
    }

    return schema.safeParse(rawData, params);
  };

  const parsed = safeParse();

  return { field, safeParse, parsed };
};
