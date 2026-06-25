import { describe, test, expect, beforeEach } from "vitest";
import z from "zod";
import { zFormGetter } from "../src/index";

const TEST_META = Object.freeze({
  username: "J.Doe",
  email: "foobar@example.com",
  private: "EXTRA Private mode",
  music: "PRO music",
  priory: "Fast priory Browsing",
});

describe("Raw FormData Test", () => {
  let fd: FormData;
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="form">
        <input name="username" value="${TEST_META.username}" />
        <input name="email" value="${TEST_META.email}" />

        <input type="checkbox" name="options" value="${TEST_META.private}" checked />
        <input type="checkbox" name="options" value="${TEST_META.music}" checked />
        <input type="checkbox" name="options" value="${TEST_META.priory}" />
      </form>

    `;

    form = document.querySelector("form")!;
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
    expect(user.data).toBe<z.infer<typeof UserSchema>>({
      username: TEST_META.username,
      email: TEST_META.email,
      options: [TEST_META.private, TEST_META.music],
    });
  });
});
