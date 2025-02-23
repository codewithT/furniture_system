import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable ,of} from 'rxjs';

export interface Product {
    ProductID: number;
    ProductCode: string;
    ProductName: string;
    SupplierID: number;
    SupplierItemNumber: string;
    FinalPrice: number;
    Picture: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'https://fakestoreapi.com/products'; // Example API URL
 products: Product[] = [
    {
      ProductID: 1,
      ProductCode: 'PO1',
      ProductName: 'Geyser',
      SupplierID: 1234,
      SupplierItemNumber: '123geyer',
      FinalPrice: 32999,
      Picture: 'assets/geyser.jpg'
    },
    {
      ProductID: 2,
      ProductCode: 'PO2',
      ProductName: 'Air Conditioner',
      SupplierID: 5678,
      SupplierItemNumber: '456ac',
      FinalPrice: 45999,
      Picture: 'assets/ac.jpg'
    },
    {
      ProductID: 3,
      ProductCode: 'PO3',
      ProductName: 'Washing Machine',
      SupplierID: 9101,
      SupplierItemNumber: '789wm',
      FinalPrice: 24999,
      Picture: 'assets/washing_machine.jpg'
    },
    {
      ProductID: 4,
      ProductCode: 'PO4',
      ProductName: 'Refrigerator',
      SupplierID: 1213,
      SupplierItemNumber: '101rf',
      FinalPrice: 52999,
      Picture: 'assets/refrigerator.jpg'
    },
    {
      ProductID: 5,
      ProductCode: 'PO5',
      ProductName: 'Microwave Oven',
      SupplierID: 1415,
      SupplierItemNumber: '111mo',
      FinalPrice: 15999,
      Picture: 'assets/microwave.jpg'
    },
    {
      ProductID: 6,
      ProductCode: 'PO6',
      ProductName: 'Smart TV',
      SupplierID: 1617,
      SupplierItemNumber: '121stv',
      FinalPrice: 39999,
      Picture: 'assets/smart_tv.jpg'
    },
    {
      ProductID: 7,
      ProductCode: 'PO7',
      ProductName: 'Vacuum Cleaner',
      SupplierID: 1819,
      SupplierItemNumber: '131vc',
      FinalPrice: 8999,
      Picture: 'assets/vacuum_cleaner.jpg'
    },
    {
      ProductID: 8,
      ProductCode: 'PO8',
      ProductName: 'Induction Stove',
      SupplierID: 2021,
      SupplierItemNumber: '141is',
      FinalPrice: 6999,
      Picture: 'assets/induction_stove.jpg'
    },
    {
      ProductID: 9,
      ProductCode: 'PO9',
      ProductName: 'Ceiling Fan',
      SupplierID: 2223,
      SupplierItemNumber: '151cf',
      FinalPrice: 3999,
      Picture: 'assets/ceiling_fan.jpg'
    },
    {
      ProductID: 10,
      ProductCode: 'PO10',
      ProductName: 'Water Purifier',
      SupplierID: 2425,
      SupplierItemNumber: '161wp',
      FinalPrice: 12999,
      Picture: 'assets/water_purifier.jpg'
    }
  ];
  
  constructor(private http: HttpClient) {}

  // Fetch all products
//   getProducts(): Observable<Product[]> {
//     return this.http.get<Product[]>(this.apiUrl);
//   }

   getProducts(): Observable<Product[]> {
    return of(this.products);
   }
  // Fetch a single product by ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Add a new product
  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // Update an existing product
  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  // Delete a product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
