import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterOutlet, RouterModule } from '@angular/router';
import { createIcons, icons } from 'lucide'; // Import icons object
import { ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
   standalone: true,
    imports: [ RouterModule, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent  {
  isUserDropdownOpen = false;
  isDropdownOpen = false;
  isLoggedIn = false; 

  constructor(private cdRef: ChangeDetectorRef, private router: Router,
    private authService : AuthService
  ) {
  }

  // Toggle main dropdown menu
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Toggle user profile dropdown
  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    const dropdown = document.querySelector('.user-dropdown');
    if (this.isUserDropdownOpen) {
      dropdown?.classList.add('active');
    } else {
      dropdown?.classList.remove('active');
    }
  }

  logout() {
    
    this.router.navigate(['furniture/auth/login']); // 
  }

  login() {
     
    this.router.navigate(['furniture/auth/login']); // Navigate to login page
  }

  ngOnInit() {
    createIcons({icons});
    this.authService.isAuthenticated$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.cdRef.detectChanges(); // Ensure UI updates
    });
  }

  // Function to check if the current route is the login page
  isLoginPage(): boolean {
    return this.router.url === '/login'; // Adjust this if needed
  }
}
