import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AddOrderService {
  private supplierApiUrl = 'http://localhost:5000/furniture/supplier';
  private addOrderApiUrl = 'http://localhost:5000/furniture/addOrders';

  constructor(private http: HttpClient) {}

  // Set headers for session-based authentication
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // Ensures cookies/session persistence
  };

  // Fetch supplier details based on productCode
  getSupplierCodesByProductCode(productCode: string): Observable<any> {
    return this.http.get<any>(`${this.supplierApiUrl}/${productCode}`, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('getSupplierCodes', []))
      );
  }

  // Fetch Product ID based on ProductCode and SupplierID
  getProductID(ProductCode: string, SupplierID: number): Observable<any[]> {
    const data = { ProductCode, SupplierID };
    return this.http.post<any[]>(`${this.supplierApiUrl}/getProductID`, data, this.httpOptions)
      .pipe(
        catchError(this.handleError<any[]>('getProductID', [])) // Ensure it always returns an array
      );
  }

  // Submit checked order
  submitCheckedOrder(orderData: any): Observable<any> {
    console.log(orderData);
    return this.http.post<any>(`${this.addOrderApiUrl}/submit-purchase`, orderData, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('submitCheckedOrder'))
      );
  }

  // Handle HTTP errors
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      alert(`${operation} failed: ${error.message}`); // Show error to user
      return of(result as T); // Return safe fallback value
    };
  }
}
