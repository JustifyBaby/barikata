import { z } from "zod";

// 1. 戻り値の型定義
export type FormGetter<Schema extends z.ZodObject<any>> = {
  field: <Key extends keyof z.infer<Schema>>(
    key: Key,
  ) => z.infer<Schema>[Key] | undefined;

  safeParse: (
    params?: z.core.ParseContext<z.core.$ZodIssue> | undefined,
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
    return isZodArraySchema(schema.unwrap());
  }
  // z.preprocess() や z.transform() などのEffectsの裏にあるスキーマをチェック
  if (schema.def && "schema" in schema.def) {
    return isZodArraySchema(schema.def.schema as z.ZodTypeAny);
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
    return result.success ? result.data : undefined;
  };

  const safeParse: FormGetter<Schema>["safeParse"] = (params) => {
    const rawData: Record<string, any> = {};

    for (const key of Object.keys(schema.shape)) {
      const fieldSchema = schema.shape[key];
      const isArray = isZodArraySchema(fieldSchema);

      rawData[key] = isArray ? formData.getAll(key) : formData.get(key);
    }

    return schema.safeParse(rawData, params);
  };

  const parsed = safeParse();

  return { field, safeParse, parsed };
};
