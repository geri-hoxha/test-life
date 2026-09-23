import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { DatePicker } from "@/components/ui/date-picker";

describe("DatePicker manual entry", () => {
  it("keeps the caret where a digit was deleted", () => {
    function Harness() {
      const [value, setValue] = useState(new Date(2026, 8, 15));
      const [tick, setTick] = useState(0);
      return (
        <>
          <DatePicker value={value} onChange={(date) => setValue(date)} />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setTick((n) => n + 1)}>
            refresh {tick}
          </button>
        </>
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "dd/mm/yyyy" }) as HTMLInputElement;
    expect(input).toHaveValue("15/09/2026");

    fireEvent.focus(input);
    input.setRangeText("", 3, 4, "start");
    input.setSelectionRange(3, 3);
    expect(input).toHaveValue("15/9/2026");
    expect(input.selectionStart).toBe(3);

    fireEvent.click(screen.getByRole("button", { name: /refresh/ }));
    expect(input).toHaveValue("15/9/2026");
    expect(input.selectionStart).toBe(3);
  });

  it("formats the date when editing finishes", () => {
    function Harness() {
      const [value, setValue] = useState(new Date(2026, 8, 15));
      return <DatePicker value={value} onChange={(date) => setValue(date)} />;
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "dd/mm/yyyy" }) as HTMLInputElement;
    fireEvent.focus(input);
    input.setRangeText("1/2/2026", 0, input.value.length, "end");
    input.setSelectionRange(3, 3);
    fireEvent.blur(input);

    expect(input).toHaveValue("01/02/2026");
  });
});
