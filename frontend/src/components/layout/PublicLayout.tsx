import React from "react";
import { Outlet } from "@tanstack/react-router";

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-foreground font-sans">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
