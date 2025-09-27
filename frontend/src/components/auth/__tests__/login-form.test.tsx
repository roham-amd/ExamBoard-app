import { NextIntlClientProvider } from "next-intl";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/src/i18n/messages/fa.json";
import { LoginForm } from "@/src/components/auth/login-form";

const fetchMock = vi.fn();

vi.mock("@/src/components/ui/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "گذرواژه اشتباه است." }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it("submits credentials and shows server error feedback", async () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <LoginForm />
      </NextIntlClientProvider>,
    );

    await userEvent.type(screen.getByLabelText("نام کاربری"), "admin");
    await userEvent.type(screen.getByLabelText("گذرواژه"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "ورود" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "secret" }),
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "گذرواژه اشتباه است.",
    );
  });
});
