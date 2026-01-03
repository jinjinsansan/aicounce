import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Sidebar from "../Sidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const { usePathname } = jest.requireMock("next/navigation");

describe("Sidebar", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/counselor/chat/michele");
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders fetched conversations and highlights active", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({
        conversations: [
          {
            id: "1",
            counselor_id: "michele",
            title: "ミシェルとの相談",
            updated_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    });

    render(<Sidebar selectedCounselorId="michele" />);

    await waitFor(() =>
      expect(screen.getByText("ミシェルとの相談")).toBeInTheDocument(),
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
    expect(
      screen.getByRole("link", { name: /ミシェルとの相談/i }),
    ).toHaveClass("bg-blue-50");
  });

  it("keeps fallback state when API returns empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => ({ conversations: [] }),
    });

    render(<Sidebar selectedCounselorId="michele" />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("新しい会話を開始")).toBeInTheDocument();
  });

  it("creates a new conversation via button", async () => {
    const mockFetch = global.fetch as jest.Mock;
    const onCreated = jest.fn();

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ conversations: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: { id: "new-conv" } }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          conversations: [
            {
              id: "new-conv",
              counselor_id: "michele",
              title: "New session",
              updated_at: "2024-01-01T00:00:00.000Z",
            },
          ],
        }),
      });

    render(
      <Sidebar selectedCounselorId="michele" onConversationCreated={onCreated} />,
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("新しい会話を開始"));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("new-conv"));
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/conversations",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
