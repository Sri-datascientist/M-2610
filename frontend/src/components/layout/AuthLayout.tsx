import React from "react";
import { Outlet } from "@tanstack/react-router";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
