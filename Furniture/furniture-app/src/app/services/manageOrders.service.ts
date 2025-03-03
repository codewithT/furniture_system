import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Order } from '../models/order.model';
@Injectable({
  providedIn: 'root'
})
export class ManageOrderService{
    private apiUrl = 'http://localhost:5000/furniture/manageOrders';  
    constructor(private http: HttpClient, private authService : AuthService) {}
    private httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        withCredentials: true // Ensures cookies/session persistence
      };
    getOrders() : Observable<any> {
        return this.http.get<any>(this.apiUrl, this.httpOptions)
    .pipe(catchError(this.handleError<any>('get orders', [])));
    }
    sendMails(orders: Order[]) : Observable<any>{
        return this.http.post<any>(`${this.apiUrl}/send-mails`,{ orders} , this.httpOptions)
        .pipe(catchError(this.handleError<any>('Error sending mails',[])));
    }
    
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