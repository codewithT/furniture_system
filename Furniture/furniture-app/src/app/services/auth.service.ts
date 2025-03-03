import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/furniture/auth'; 
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);
  
  isAuthenticated$ = this.isAuthenticated.asObservable();
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkLoginState();
  }

  // Returns an Observable so that the component can subscribe to the result.
  login(email: string, password: string): Observable<{ msg: string; user?: any }> {
    // Important: Set withCredentials to true to allow cookies to be sent with the request
    return this.http.post<{ msg: string; user?: any }>(`${this.apiUrl}/login`, 
      { email, password }, 
      { withCredentials: true }  // This is crucial for session cookies
    ).pipe(
      tap(response => {
        // Store user data if available
        if (response.user) {
          sessionStorage.setItem('user_data', JSON.stringify(response.user));
          console.log(sessionStorage.getItem('user_data'));
          this.userSubject.next(response.user);
        }
        else{
          console.log("Error in storing user data");
        }
        
        // Update authentication state
        this.isAuthenticated.next(true);
      })
    );
  }

  logout(): void {
    // Call server to invalidate session - with credentials flag for cookie
    this.http.post(`${this.apiUrl}/logout`, { withCredentials: true })
      .subscribe({
        next: () => this.handleLogout(),
        error: () => this.handleLogout() // Logout locally even if server request fails
      });
  }
  
  private handleLogout(): void {
    // Clear stored user data
    sessionStorage.removeItem('user_data');
    
    // Update authentication state
    this.isAuthenticated.next(false);
    this.userSubject.next(null);
    
    // Navigate to login page
    this.router.navigate(['furniture/auth/login']);
  }

  checkLoginState(): void {
    // Check if we have user data in session storage
    const userData = sessionStorage.getItem('user_data');
    
    if (userData) {
      this.userSubject.next(JSON.parse(userData));
      this.isAuthenticated.next(true);
    }
    
    // Verify with server if the session is still valid
    this.http.get<{ isAuthenticated: boolean; user?: any }>(`${this.apiUrl}/is-authenticated`, 
      { withCredentials: true }  // Important for session cookies
    ).subscribe({
      next: response => {
        this.isAuthenticated.next(response.isAuthenticated);
        console.log(response.isAuthenticated);

        if (response.isAuthenticated && response.user) {
          // Update user data if it changed
          sessionStorage.setItem('user_data', JSON.stringify(response.user));
          this.userSubject.next(response.user);
          
        } else if (!response.isAuthenticated) {
          // Clear session data if server says we're not authenticated
          this.handleLogout();
        }
      },
      error: () => {
        // If verification fails, assume session is invalid
        this.handleLogout();
      }
    });
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.getValue();
  }
  
  getCurrentUser(): any {
    console.log(this.userSubject.getValue().email);
    return this.userSubject.getValue().email;
  }
}