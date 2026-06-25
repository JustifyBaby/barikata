import { describe, test, expect, beforeEach } from "vitest";
import z from "zod";
import { zFormGetter } from "../src/index";
import html from "./index.test.html?raw";

export const TEST_META = Object.freeze({
  username: "J.Doe",
  email: "foobar@example.com",
  private: "EXTRA Private mode",
  music: "PRO music",
  priory: "Fast priory Browsing",
});

const is_TEST_META_key = (key: string): key is keyof typeof TEST_META => {
  return Object.keys(TEST_META).includes(key);
};

describe("Raw FormData Test", () => {
  let fd: FormData;
  let form: HTMLFormElement | null;

  beforeEach(() => {
    document.body.innerHTML = html;

    Object.keys(TEST_META).forEach((key) => {
      const input = document.getElementById(key);

      if (!(input instanceof HTMLInputElement)) {
        console.log("input is not <INPUT />");
        return;
      }
      if (!is_TEST_META_key(key)) {
        console.log(key + " is not include");
        return;
      }

      input.value = TEST_META[key];
    });

    form = document.querySelector("form");
    if (!form) {
      console.log("Get form failed");
      return;
    }

    fd = new FormData(form);
  });

  test("FormDataからデータ取得", () => {
    expect(fd.get("username")).toBe(TEST_META.username);
    expect(fd.get("email")).toBe(TEST_META.email);
    expect(fd.getAll("options")).toEqual([TEST_META.private, TEST_META.music]);
  });

  test("barikata使用で型安全なデータ取得", () => {
    const UserSchema = z.object({
      username: z.string().min(1).max(32),
      email: z.email(),
      options: z.string().array(),
    });
    const { parsed: user } = zFormGetter(fd, UserSchema);
    expect(user.success).toBe(true);
    expect(user.data).toEqual<z.infer<typeof UserSchema>>({
      username: TEST_META.username,
      email: TEST_META.email,
      options: [TEST_META.private, TEST_META.music],
    });
  });
});
