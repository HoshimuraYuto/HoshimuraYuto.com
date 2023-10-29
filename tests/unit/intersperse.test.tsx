import intersperse from "@/app/utils/intersperse";

describe("intersperse", () => {
  it("should insert separator between string elements", () => {
    const stringArray = ["1", "2"];
    const separator = ",";
    const result = intersperse(stringArray, separator);

    expect(result).toStrictEqual(["1", ",", "2"]);
  });

  it("should insert separator between React.ReactNode elements", () => {
    const stringArray = [<span key="1">1</span>, <span key="2">2</span>];
    const separator = <span key="separator">,</span>;
    const result = intersperse(stringArray, separator);

    expect(result).toStrictEqual([
      <span key="1">1</span>,
      <span key="separator">,</span>,
      <span key="2">2</span>,
    ]);
  });
});
