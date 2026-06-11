import { Navigate } from "react-router-dom";
import Docs from "./Docs";

const ProtectedDocs = () => {
  const token = localStorage.getItem("docs_token");

  // Directly return based on condition
  if (token === import.meta.env.VITE_DOCS_PASSWORD) {
    return <Docs />;
  } else {
    return <Navigate to="/docs/login" replace />;
  }
};

export default ProtectedDocs;
