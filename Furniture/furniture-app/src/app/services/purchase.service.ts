import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Purchase } from '../models/purchases.model';
import { of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private apiUrl = 'http://localhost:5000/furniture/purchase'; // Adjust URL if needed

  constructor(private http: HttpClient, private authService : AuthService) {}

  // Set headers for session-based authentication
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // Ensures cookies/session persistence
  };

  getPurchases(): Observable<any> {
    return this.http.get<any>(this.apiUrl, this.httpOptions)
    .pipe(catchError(this.handleError<any>('getPurchases', [])));
  }
  editPurchase(purchase : Purchase) : Observable<any>{
    const currentUserEmail = this.authService.getCurrentUser().email;
    const purchaseData= {... purchase, Changed_by : currentUserEmail};
    return this.http.put<any>(`${this.apiUrl}/${purchase.PurchaseID}`,purchaseData,  this.httpOptions)
    .pipe(catchError(this.handleError<any>('Error on updating purchase', [])));
  }

  deletePurchase(purchaseID: number) : Observable<any> {
    
    return this.http.delete<any> (`${this.apiUrl}/${purchaseID}`,this.httpOptions).
    pipe(catchError(this.handleError<any>('Error on delete purchase', [])));
  }

  searchPurchases(query : string) : Observable<Purchase[]> {
    if (!query.trim()) {
      return of([]); // Prevent unnecessary requests
    }
      return this.http.get<Purchase[]>( `${this.apiUrl}/search?query=${encodeURIComponent(query)}`,
      this.httpOptions
    ).pipe(catchError(this.handleError<any>('Error on searching purchases', [])));
  }


  sendMail(purchases : Purchase[]):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/send-mails`, purchases,  this.httpOptions)
    .pipe(catchError(this.handleError<any>('error sending mails', [])));
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
