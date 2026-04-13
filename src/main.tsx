
  import { createRoot } from "react-dom/client";
  import { RouterProvider } from "react-router";
  import { router } from "./app/routes.tsx";
  import { Toaster } from "sonner";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <>
      <RouterProvider router={router} />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: { fontSize: "13px" },
        }}
      />
    </>
  );
