import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PurchasingProvider } from '@/contexts/PurchasingContext';
import { Layout } from '@/components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import WarehouseEntries from './pages/WarehouseEntries';
import InvoiceEntry from './pages/InvoiceEntry';
import DirectPurchase from './pages/DirectPurchase';
import Returns from './pages/Returns';
import TaxManagement from './pages/TaxManagement';
import Accounting from './pages/Accounting';
import TestDatabase from './pages/TestDatabase';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PurchasingProvider>
        <Toaster />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/warehouse-entries" element={<WarehouseEntries />} />
              <Route path="/invoices" element={<InvoiceEntry />} />
              <Route path="/invoice-entry" element={<InvoiceEntry />} />
              <Route path="/direct-purchase" element={<DirectPurchase />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/tax-management" element={<TaxManagement />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/test-database" element={<TestDatabase />} />
              <Route path="/reports" element={<div className="text-center py-8">Funcionalidad en desarrollo</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PurchasingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
