import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProductsList from "./pages/products/ProductsList.tsx";
import CreateProduct from "./pages/products/CreateProduct.tsx";
import ProductDetail from "./pages/products/ProductDetail.tsx";
import CustomersList from "./pages/customers/CustomersList.tsx";
import CustomerForm from "./pages/customers/CustomerForm.tsx";
import CustomerDetail from "./pages/customers/CustomerDetail.tsx";
import CurrencyExchange from "./pages/administration/CurrencyExchange.tsx";
import OffersList from "./pages/offers/OffersList.tsx";
import CreateOffer from "./pages/offers/CreateOffer.tsx";
import OfferDetail from "./pages/offers/OfferDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/products/new" element={<CreateProduct />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route path="/offers" element={<OffersList />} />
          <Route path="/offers/new" element={<CreateOffer />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/administration" element={<CurrencyExchange />} />
          <Route path="/administration/currency-exchange" element={<CurrencyExchange />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
