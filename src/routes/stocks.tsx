import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stocks")({
  component: StocksLayout,
});

function StocksLayout() {
  return <Outlet />;
}