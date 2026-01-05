import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInterface from "../ChatInterface";
import { useChatStore } from "@/store/chatStore";

const initialState = useChatStore.getState();

function resetStore() {
  useChatStore.setState(initialState, true);
}

describe("ChatInterface", () => {
  beforeEach(() => {
    resetStore();
  });

  it("sends a message and resolves new conversation id", async () => {
    const user = userEvent.setup();
    const sendMessage = jest.fn().mockResolvedValue("conv-123");
    useChatStore.setState({
      ...useChatStore.getState(),
      messages: [],
      input: "",
      isSending: false,
      sendMessage,
    });

    const handleResolved = jest.fn();
    render(
      <ChatInterface
        counselorId="michele"
        conversationId={undefined}
        onConversationResolved={handleResolved}
      />,
    );

    await user.type(
      screen.getByPlaceholderText("今の気持ちや相談内容を入力してください..."),
      "テスト",
    );

    expect(screen.getByRole("button", { name: "送信" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(sendMessage).toHaveBeenCalledWith({
      counselorId: "michele",
      conversationId: undefined,
      useRag: false,
    });
    expect(handleResolved).toHaveBeenCalledWith("conv-123");
  });

  it("disables the button while sending", async () => {
    const user = userEvent.setup();
    const sendMessage = jest.fn().mockResolvedValue(null);
    useChatStore.setState({
      ...useChatStore.getState(),
      messages: [],
      input: "準備中",
      isSending: true,
      sendMessage,
    });

    render(<ChatInterface counselorId="michele" conversationId="conv" />);

    const button = screen.getByRole("button", { name: "送信中..." });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("prevents sending when input is empty after trimming", async () => {
    const user = userEvent.setup();
    const sendMessage = jest.fn();
    useChatStore.setState({
      ...useChatStore.getState(),
      messages: [],
      input: "   ",
      isSending: false,
      sendMessage,
    });

    render(<ChatInterface counselorId="michele" conversationId="conv" />);

    const button = screen.getByRole("button", { name: "送信" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
