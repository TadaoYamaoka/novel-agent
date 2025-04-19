import { BrowserRouter, Route, Routes } from "react-router";
import { ChatAgent } from "./pages/ChatAgent";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatAgent />} />
      </Routes>
    </BrowserRouter>
  );
}
