import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, FormsModule, CommonModule],
  templateUrl : './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'furniture-app';
  isDropdownOpen = false;
  isUserDropdownOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }
}