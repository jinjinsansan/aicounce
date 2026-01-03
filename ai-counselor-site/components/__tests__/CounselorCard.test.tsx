import { fireEvent, render, screen } from "@testing-library/react";
import CounselorCard from "../CounselorCard";
import type { Counselor } from "@/types";

const mockCounselor: Counselor = {
  id: "michele",
  name: "ミシェル",
  specialty: "テープ式心理学",
  description: "テープ式心理学の専門家",
  tags: ["自己理解", "感情整理"],
  responseTime: "1-2 分",
  sessionCount: 1200,
  ragEnabled: true,
  modelType: "openai",
  modelName: "gpt-4o-mini",
  highlight: "",
};

describe("CounselorCard", () => {
  it("renders counselor information", () => {
    render(<CounselorCard counselor={mockCounselor} />);

    expect(screen.getByText("ミシェル")).toBeInTheDocument();
    expect(screen.getByText("テープ式心理学")).toBeInTheDocument();
    expect(screen.getByText("テープ式心理学の専門家")).toBeInTheDocument();
    expect(screen.getByText("#自己理解")).toBeInTheDocument();
    expect(screen.getByText(/1,200\+/)).toBeInTheDocument();
  });

  it("calls onSelect when action button is clicked", () => {
    const onSelect = jest.fn();
    render(<CounselorCard counselor={mockCounselor} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "相談する" }));

    expect(onSelect).toHaveBeenCalledWith("michele");
  });
});
