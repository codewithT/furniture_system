import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [ CommonModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitted = false;
  
  constructor(
    private fb: FormBuilder,
    private router: Router, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize the reactive form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
   
  onSubmit(): void {
    this.isSubmitted = true;
    
    if (this.loginForm.invalid) {
      return;
    }
    
    const { email, password } = this.loginForm.value;
    
    // Call login() which returns an Observable, and subscribe to it.
    this.authService.login(email, password).subscribe({
      next: () => {
        // On successful login, navigate to the dashboard.
        this.router.navigate(['/furniture/dashboard']);
      },
      error: err => {
        console.log('Invalid Credentials!', err);
        alert('Invalid email or password. Please try again.');
      }
    });
    
  }
}
