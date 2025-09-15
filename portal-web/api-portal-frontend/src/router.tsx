import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Apis from "./pages/Apis";
import ApiDetail from "./pages/ApiDetail";
import Consumers from "./pages/Consumers";
import ConsumerDetail from "./pages/ConsumerDetail";
import GettingStarted from "./pages/GettingStarted";
import Mcp from "./pages/Mcp";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './pages/Profile'
import McpDetail from "./pages/McpDetail";
import Callback from "./pages/Callback";
import OidcCallback from "./pages/OidcCallback";

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/getting-started" element={<GettingStarted />} />
      <Route path="/apis" element={<Apis />} />
      <Route path="/apis/:id" element={<ApiDetail />} />
      <Route path="/consumers" element={<Consumers />} />
      <Route path="/consumers/:consumerId" element={<ConsumerDetail />} />
      <Route path="/mcp" element={<Mcp />} />
      <Route path="/mcp/:mcpName" element={<McpDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/oidc/callback" element={<OidcCallback />} />

      {/* 其他页面可继续添加 */}
    </Routes>
  );
} 