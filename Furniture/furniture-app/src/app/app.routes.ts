import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboards/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { UserLoginComponent } from './components/user-login/user-login.component';
import { AddOrderComponent } from './components/add-order/add-order.component';
import { ManageOrderComponent } from './components/manage-order/manage-order.component';
import { PurchaseComponent } from './components/purchase/purchase.component';
import { SupplierComponent } from './components/supplier/supplier.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';

// Import the new layout components
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout.component';

export const routes: Routes = [
  {path : '', component : UserLoginComponent},
  {
    
    path: 'furniture',
    component: MainLayoutComponent,  
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },  
      { path: 'supplier', component: SupplierComponent },
      { path: 'purchase', component: PurchaseComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'addOrders', component: AddOrderComponent },
      { path: 'manageOrders', component: ManageOrderComponent },
    ],
  },
  {
    path: 'furniture/auth',
    component: AuthLayoutComponent,  
    children: [
      { path: 'login', component: UserLoginComponent },  
      { path: 'signup', component: SignUpComponent },
    ],
  },
];
