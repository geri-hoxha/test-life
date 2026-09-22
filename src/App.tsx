import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "./api/client";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProductsList from "./pages/products/ProductsList.tsx";
import CreateProduct from "./pages/products/CreateProduct.tsx";
import ProductDetail from "./pages/products/ProductDetail.tsx";
import PeopleList from "./pages/people/PeopleList.tsx";
import PersonForm from "./pages/people/PersonForm.tsx";
import PersonDetail from "./pages/people/PersonDetail.tsx";
import CompaniesList from "./pages/companies/CompaniesList.tsx";
import CompanyForm from "./pages/companies/CompanyForm.tsx";
import CompanyDetail from "./pages/companies/CompanyDetail.tsx";
import CustomersRedirect from "./pages/customers/CustomersRedirect.tsx";
import CurrencyExchange from "./pages/administration/CurrencyExchange.tsx";
import OffersList from "./pages/offers/OffersList.tsx";
import CreateOffer from "./pages/offers/CreateOffer.tsx";
import OfferDetail from "./pages/offers/OfferDetail.tsx";
import IssuePolicy from "./pages/offers/IssuePolicy.tsx";
import PoliciesList from "./pages/policies/PoliciesList.tsx";
import RenewalsList from "./pages/renewals/RenewalsList.tsx";
import RenewalDetail from "./pages/renewals/RenewalDetail.tsx";
import PolicyDetail from "./pages/policies/PolicyDetail.tsx";
import PaymentsList from "./pages/payments/PaymentsList.tsx";
import RecordPayment from "./pages/payments/RecordPayment.tsx";
import Reports from "./pages/reports/Reports.tsx";
import PermissionMatrix from "./pages/administration/PermissionMatrix.tsx";
import RatingTablesList from "./pages/administration/RatingTablesList.tsx";
import RatingTableDetail from "./pages/administration/RatingTableDetail.tsx";
import DocumentTypesList from "./pages/administration/DocumentTypesList.tsx";
import DocumentsList from "./pages/administration/DocumentsList.tsx";
import RiskList from "./pages/risk-list/RiskList.tsx";
import BankAccountsList from "./pages/bank-accounts/BankAccountsList.tsx";
import InvoicesList from "./pages/invoices/InvoicesList.tsx";
import InvoiceDetail from "./pages/invoices/InvoiceDetail.tsx";
import AgentCommissionsList from "./pages/agent-commissions/AgentCommissionsList.tsx";
import AgentCommissionDetail from "./pages/agent-commissions/AgentCommissionDetail.tsx";
import AgentsList from "./pages/agents/AgentsList.tsx";
import AgentDetail from "./pages/agents/AgentDetail.tsx";
import PartnersList from "./pages/partners/PartnersList.tsx";
import PartnerDetail from "./pages/partners/PartnerDetail.tsx";
import PartnerCommissionsList from "./pages/partner-commissions/PartnerCommissionsList.tsx";
import PartnerCommissionDetail from "./pages/partner-commissions/PartnerCommissionDetail.tsx";
import Login from "./pages/Login.tsx";
import UsersList from "./pages/users/UsersList.tsx";
import UserDetail from "./pages/users/UserDetail.tsx";
import RequireAuth from "./components/auth/RequireAuth.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/groups/:code" element={<ProductsList />} />
            <Route path="/products/new" element={<CreateProduct />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/people" element={<PeopleList />} />
            <Route path="/people/new" element={<PersonForm />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/people/:id/edit" element={<PersonForm />} />
            <Route path="/companies" element={<CompaniesList />} />
            <Route path="/companies/new" element={<CompanyForm />} />
            <Route path="/companies/:id" element={<CompanyDetail />} />
            <Route path="/companies/:id/edit" element={<CompanyForm />} />
            <Route path="/customers/new" element={<CustomersRedirect />} />
            <Route path="/customers/:id/edit" element={<CustomersRedirect />} />
            <Route path="/customers/:id" element={<CustomersRedirect />} />
            <Route path="/customers" element={<CustomersRedirect />} />
            <Route path="/offers" element={<OffersList />} />
            <Route path="/offers/new" element={<CreateOffer />} />
            <Route path="/offers/:id" element={<OfferDetail />} />
            <Route path="/offers/:offerId/issue" element={<IssuePolicy />} />
            <Route path="/policies" element={<PoliciesList />} />
            <Route path="/policies/:id" element={<PolicyDetail />} />
            <Route path="/renewals" element={<RenewalsList />} />
            <Route path="/renewals/:policyId/:renewalId" element={<RenewalDetail />} />
            <Route path="/invoices" element={<InvoicesList />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/agents" element={<AgentsList />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/agent-commissions" element={<AgentCommissionsList />} />
            <Route path="/agent-commissions/:id" element={<AgentCommissionDetail />} />
            <Route path="/partners" element={<PartnersList />} />
            <Route path="/partners/:id" element={<PartnerDetail />} />
            <Route path="/partner-commissions" element={<PartnerCommissionsList />} />
            <Route path="/partner-commissions/:id" element={<PartnerCommissionDetail />} />
            <Route path="/risk-list" element={<RiskList />} />
            <Route path="/bank-accounts" element={<BankAccountsList />} />
            <Route path="/payments" element={<PaymentsList />} />
            <Route path="/payments/new" element={<RecordPayment />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/administration" element={<CurrencyExchange />} />
            <Route path="/administration/currency-exchange" element={<CurrencyExchange />} />
            <Route path="/administration/permission-matrix" element={<PermissionMatrix />} />
            <Route path="/administration/rating-tables" element={<RatingTablesList />} />
            <Route path="/administration/rating-tables/:id" element={<RatingTableDetail />} />
            <Route path="/administration/document-types" element={<DocumentTypesList />} />
            <Route path="/administration/documents" element={<DocumentsList />} />
            <Route path="/administration/users" element={<UsersList />} />
            <Route path="/administration/users/:authUserId" element={<UserDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
