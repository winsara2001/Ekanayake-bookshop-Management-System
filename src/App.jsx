import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import BookDetails from './pages/BookDetails/BookDetails';
import CategoriesPage from './pages/Categories/Categories';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Cart from './pages/Cart/Cart';
import Wishlist from './pages/Wishlist/Wishlist';
import Checkout from './pages/Checkout/Checkout';
import Orders from './pages/Orders/Orders';
import OrderDetails from './pages/Orders/OrderDetails';
import Account from './pages/Account/Account';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminBooks from './pages/AdminBooks/AdminBooks';
import AddBook from './pages/AdminBooks/AddBook';
import EditBook from './pages/AdminBooks/EditBook';
import AdminCategories from './pages/AdminCategories/AdminCategories';
import AdminAuthors from './pages/AdminAuthors/AdminAuthors';
import AdminUsers from './pages/AdminUsers/AdminUsers';
import InventoryManagement from './pages/Inventory/InventoryManagement';
import AdminOrders from './pages/AdminOrders/AdminOrders';
import AdminCustomers from './pages/AdminCustomers/AdminCustomers';
import AdminPayments from './pages/AdminPayments/AdminPayments';
import CustomerRoute from './routes/CustomerRoute';
import AdminRoute from './routes/AdminRoute';
import InventoryManagerRoute from './routes/InventoryManagerRoute';
import SalesManagerRoute from './routes/SalesManagerRoute';
import InventoryManagerLayout from './layouts/InventoryManagerLayout';
import SalesManagerLayout from './layouts/SalesManagerLayout';
import InventoryManagerDashboard from './pages/InventoryManagerDashboard/InventoryManagerDashboard';
import SalesManagerDashboard from './pages/SalesManagerDashboard/SalesManagerDashboard';
import InventoryManagerSuppliers from './pages/InventoryManagerSuppliers/InventoryManagerSuppliers';
import AdminSuppliers from './pages/AdminSuppliers/AdminSuppliers';
import InventoryManagerPOList from './pages/InventoryManagerPurchaseOrders/InventoryManagerPOList';
import InventoryManagerPOEdit from './pages/InventoryManagerPurchaseOrders/InventoryManagerPOEdit';
import InventoryManagerPODetails from './pages/InventoryManagerPurchaseOrders/InventoryManagerPODetails';
import AdminPOList from './pages/AdminPurchaseOrders/AdminPOList';
import AdminPOEdit from './pages/AdminPurchaseOrders/AdminPOEdit';
import AdminPODetails from './pages/AdminPurchaseOrders/AdminPODetails';
import AdminLoyalty from './pages/AdminLoyalty/AdminLoyalty';
import AdminLayout from './layouts/AdminLayout';
import SalesReports from './pages/AdminReports/SalesReports';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import './App.css';

function App() {
  return (
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <div className="app">
                <Routes>
                  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="books" element={<AdminBooks />} />
                    <Route path="books/add" element={<AddBook />} />
                    <Route path="books/:id/edit" element={<EditBook />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="authors" element={<AdminAuthors />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="suppliers" element={<AdminSuppliers />} />
                    <Route path="purchase-orders" element={<AdminPOList />} />
                    <Route path="purchase-orders/new" element={<AdminPOEdit />} />
                    <Route path="purchase-orders/:id/edit" element={<AdminPOEdit />} />
                    <Route path="purchase-orders/:id" element={<AdminPODetails />} />
                    <Route path="loyalty" element={<AdminLoyalty />} />
                    <Route path="reports/sales" element={<SalesReports />} />
                  </Route>
                  
                  <Route path="/inventory" element={<InventoryManagerRoute><InventoryManagerLayout /></InventoryManagerRoute>}>
                    <Route path="dashboard" element={<InventoryManagerDashboard />} />
                    <Route path="books" element={<AdminBooks />} />
                    <Route path="books/add" element={<AddBook />} />
                    <Route path="books/:id/edit" element={<EditBook />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="authors" element={<AdminAuthors />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="suppliers" element={<InventoryManagerSuppliers />} />
                    <Route path="purchase-orders" element={<InventoryManagerPOList />} />
                    <Route path="purchase-orders/new" element={<InventoryManagerPOEdit />} />
                    <Route path="purchase-orders/:id/edit" element={<InventoryManagerPOEdit />} />
                    <Route path="purchase-orders/:id" element={<InventoryManagerPODetails />} />
                  </Route>

                  <Route element={<SalesManagerRoute><SalesManagerLayout /></SalesManagerRoute>}>
                    <Route path="/sales/dashboard" element={<SalesManagerDashboard />} />
                    <Route path="/sales/orders" element={<AdminOrders />} />
                    <Route path="/sales/reports" element={<SalesReports />} />
                  </Route>

                  <Route path="*" element={
                    <>
                      <Navbar />
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/books/:id" element={<BookDetails />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route 
                          path="/cart" 
                          element={
                            <CustomerRoute>
                              <Cart />
                            </CustomerRoute>
                          } 
                        />
                        <Route 
                          path="/wishlist" 
                          element={
                            <CustomerRoute>
                              <Wishlist />
                            </CustomerRoute>
                          } 
                        />
                        <Route 
                          path="/checkout" 
                          element={
                            <CustomerRoute>
                              <Checkout />
                            </CustomerRoute>
                          } 
                        />
                        <Route 
                          path="/orders" 
                          element={
                            <CustomerRoute>
                              <Orders />
                            </CustomerRoute>
                          } 
                        />
                        <Route 
                          path="/orders/:orderId" 
                          element={
                            <CustomerRoute>
                              <OrderDetails />
                            </CustomerRoute>
                          } 
                        />
                        <Route 
                          path="/account" 
                          element={
                            <CustomerRoute>
                              <Account />
                            </CustomerRoute>
                          } 
                        />
                      </Routes>
                      <Footer />
                    </>
                  } />
                </Routes>
              </div>
            </Router>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    );
  }
  
  export default App;
