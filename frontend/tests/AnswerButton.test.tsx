import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AnswerButton } from "../components/AnswerButton";

describe("AnswerButton", () => {
  it("renders accessible pill buttons with aria metadata", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const { asFragment } = render(<AnswerButton option="A) Snapshot" index={0} onSelect={onSelect} />);

    const option = screen.getByRole("listitem");
    expect(option).toHaveAttribute("aria-label", "Option 1");
    expect(option).toHaveAttribute("aria-pressed", "false");

    await user.click(option);
    expect(onSelect).toHaveBeenCalled();

    expect(asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    aria-label="Option 1"
    aria-pressed="false"
    class="relative flex w-full items-center gap-3 rounded-full border px-6 py-4 text-left font-semibold text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brandBlue/40 border-primary/30 bg-white hover:shadow-lg"
    role="listitem"
  >
    <span
      class="flex h-10 w-10 items-center justify-center rounded-full bg-brandBlue/10 text-brandBlue font-bold"
    >
      1
    </span>
    <span
      class="flex-1 text-base sm:text-lg"
    >
      A) Snapshot
    </span>
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-full border-2 border-transparent"
    />
  </button>
</DocumentFragment>
`);
  });
});
