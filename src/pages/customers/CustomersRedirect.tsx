import { Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { parseCustomerPartyType } from "@/api/adapters/customers";

/** Send legacy `/customers` URLs to `/people` or `/companies`. */
const CustomersRedirect = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const type = parseCustomerPartyType(params.get("type"));
  const prefix = type === "company" ? "/companies" : "/people";
  const isNew = location.pathname.endsWith("/new");
  const isEdit = location.pathname.endsWith("/edit");
  if (isNew) return <Navigate to={`${prefix}/new`} replace />;
  if (id) return <Navigate to={`${prefix}/${id}${isEdit ? "/edit" : ""}`} replace />;
  return <Navigate to={prefix} replace />;
};

export default CustomersRedirect;
