import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Supplier } from '../models/supplier.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = 'http://localhost:5000/furniture/supplier'; // Backend API URL

  constructor(private http: HttpClient, private authService : AuthService) {}

  // Set headers for session-based authentication
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // Ensures cookies/session persistence
  };

  // Fetch all suppliers
  getSupplierDetails(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl, this.httpOptions)
      .pipe(catchError(this.handleError<Supplier[]>('getSupplierDetails', [])));
  }

  // Add a new supplier
  addSupplier(supplier: Supplier): Observable<Supplier> {
    const currentUserEmail = this.authService.getCurrentUser().email; // Fetch logged-in user's email
    const supplierData = { ...supplier, Created_by: currentUserEmail }; // Add Created_by field

    return this.http.post<Supplier>(this.apiUrl, supplierData, this.httpOptions)
      .pipe(catchError(this.handleError<Supplier>('addSupplier')));
  }

  // Update an existing supplier
  updateSupplier(supplier: Supplier): Observable<Supplier> {
    const currentUserEmail = this.authService.getCurrentUser().email;
    const supplierData = {...supplier, Changed_by : currentUserEmail};
    return this.http.put<Supplier>(`${this.apiUrl}/${supplier.SupplierID}`, supplierData, this.httpOptions)
      .pipe(catchError(this.handleError<Supplier>('updateSupplier')));
  }

  // Delete a supplier
  deleteSupplier(supplierID: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${supplierID}`, this.httpOptions)
      .pipe(catchError(this.handleError<void>('deleteSupplier')));
  }
   // Search Suppliers with Pagination
   searchSuppliers(query: string): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(
      `${this.apiUrl}/search?query=${encodeURIComponent(query)}`,
      this.httpOptions
    ).pipe(catchError(this.handleError<Supplier[]>('searchSuppliers', [])));
  }

  // Sort Suppliers with Pagination
  sortSuppliers(column: string, order: 'asc' | 'desc', page: number, limit: number): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(
      `${this.apiUrl}/sort?column=${column}&order=${order}&page=${page}&limit=${limit}`,
      this.httpOptions
    ).pipe(catchError(this.handleError<Supplier[]>('sortSuppliers', [])));
  }
  

  // Handle HTTP errors
  private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);
    alert(`${operation} failed: ${error.message}`); // Show error to user
    return new Observable<T>((observer) => {
      observer.next(result as T);
      observer.complete();
    });
  };
}

}
