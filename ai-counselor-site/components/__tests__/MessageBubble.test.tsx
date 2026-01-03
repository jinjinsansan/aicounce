import { render } from "@testing-library/react";
import MessageBubble from "../MessageBubble";
import type { Message } from "@/types";

const baseMessage: Message = {
  id: "msg-1",
  conversationId: "conv-1",
  role: "user",
  content: "こんにちは",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("MessageBubble", () => {
  it("renders a user message on the right", () => {
    const { container, getByText } = render(<MessageBubble message={baseMessage} />);

    expect(getByText("こんにちは")).toBeInTheDocument();
    const wrapper = container.querySelector(".flex");
    expect(wrapper).toHaveClass("justify-end");
  });

  it("renders an assistant message on the left", () => {
    const assistantMessage: Message = {
      ...baseMessage,
      id: "msg-2",
      role: "assistant",
      content: "お手伝いします",
    };
    const { container, getByText } = render(<MessageBubble message={assistantMessage} />);

    expect(getByText("お手伝いします")).toBeInTheDocument();
    const wrapper = container.querySelector(".flex");
    expect(wrapper).toHaveClass("justify-start");
  });
});
