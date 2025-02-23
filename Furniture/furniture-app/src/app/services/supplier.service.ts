import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable ,of} from 'rxjs';

export interface Supplier{
    supplierID: number,
    supplierCode : string, 
    supplierName : string, 
    supplierAddress : string,
  }

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private apiUrl = 'https://fakestoreapi.com/supplier';  

  supplier_items: Supplier[] = [
    {
      supplierID: 1,
      supplierCode: 'SUP12',
      supplierName: 'Robert',
      supplierAddress: 'Washington, DC'
    },
    {
      supplierID: 2,
      supplierCode: 'SUP34',
      supplierName: 'Alice',
      supplierAddress: 'New York, NY'
    },
    {
      supplierID: 3,
      supplierCode: 'SUP56',
      supplierName: 'Michael',
      supplierAddress: 'Los Angeles, CA'
    },
    {
      supplierID: 4,
      supplierCode: 'SUP78',
      supplierName: 'Sophia',
      supplierAddress: 'Chicago, IL'
    },
    {
      supplierID: 5,
      supplierCode: 'SUP90',
      supplierName: 'David',
      supplierAddress: 'Houston, TX'
    }
  ];
  
  
  constructor(private http: HttpClient) {}

  // Fetch all products
//   getProducts(): Observable<Product[]> {
//     return this.http.get<Product[]>(this.apiUrl);
//   }

   getSupplier_items(): Observable<Supplier[]> {
    return of(this.supplier_items);
   }
}