import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import { Modal } from 'bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Supplier } from '../../models/supplier.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-supplier',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css'
})
export class SupplierComponent implements OnInit, AfterViewInit {
  @ViewChild('supplierModal') modalElement!: ElementRef;
  private modal!: Modal;

  suppliers: Supplier[] = [];
  entriesPerPage: number = 20;
  currentPage: number = 1;
  searchTerm: string = '';
  isEdit: boolean = false;

  newSupplier: Supplier = {
    SupplierID: -1,
    SupplierCode: '',
    SupplierName: '',
    SupplierAddress: '', 
    EmailAddress: '',
  };
  private searchSubject = new Subject<string>(); // Helps debounce search input
  constructor(private supplierService: SupplierService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after the last keystroke
      distinctUntilChanged() // Only call API if value actually changes
    ).subscribe(query => {
      this.searchSuppliers(query);
    });
  }

  ngAfterViewInit() {
    this.modal = new Modal(this.modalElement.nativeElement);
  }

  loadSuppliers() {
    this.supplierService.getSupplierDetails().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.suppliers = data;
          this.updatePagination();
          this.cdr.detectChanges();
        } else {
          console.error('Data is not an array:', data);
        }
      },
      error: (error) => {
        console.error('Error fetching suppliers', error);
      }
    });
  }

  openModal() {
    if (!this.isEdit) {
      this.resetSupplier();
    }
    this.modal.show();
  }

  closeModal() {
    this.modal.hide();
    this.resetSupplier();
    this.isEdit = false;
  }

  resetSupplier() {
    this.newSupplier = {
      SupplierID: -1,
      SupplierCode: '',
      SupplierName: '',
      SupplierAddress: '', 
      EmailAddress: '',
    };
  }

  editSupplier(supplier: Supplier) {
    this.newSupplier = { ...supplier };
    this.isEdit = true;
    this.openModal();
  }

  deleteSupplier(supplierID: number) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.supplierService.deleteSupplier(supplierID).subscribe(() => {
        this.suppliers = this.suppliers.filter(p => p.SupplierID !== supplierID);
        this.updatePagination();
      }, (error) => {
        console.error('Error deleting supplier', error);
      });
    }
  }

  saveSupplier() {
    if (!this.newSupplier.SupplierCode || !this.newSupplier.SupplierName || !this.newSupplier.SupplierAddress) {
      alert('Please fill all the required fields.');
      return;
    }

    if (this.isEdit) {
      this.supplierService.updateSupplier(this.newSupplier).subscribe(() => {
        const index = this.suppliers.findIndex(s => s.SupplierID === this.newSupplier.SupplierID);
        if (index !== -1) {
          this.suppliers[index] = { ...this.newSupplier };  
        }
        this.loadSuppliers();
        this.cdr.detectChanges();
        this.closeModal();
      }, (error) => {
        console.error('Error updating supplier', error);
      });
    } else {
      this.supplierService.addSupplier(this.newSupplier).subscribe((newSupplier) => {
        
        this.suppliers = [...this.suppliers, newSupplier]; 
        this.cdr.detectChanges();
        this.closeModal();
        this.updatePagination();
      }, (error) => {
        console.error('Error adding supplier', error);
      });
    }
  }

  sortColumn: keyof Supplier | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  sortBy(column: keyof Supplier) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.supplierService.sortSuppliers(this.sortColumn, this.sortDirection, this.currentPage, this.entriesPerPage).subscribe(
      (data: Supplier[]) => {
        this.suppliers = data;
      },
      (error) => console.error('Error sorting suppliers:', error)
    );
  }
  onSearchChange() {
    this.searchSubject.next(this.searchTerm); // Push value into the Subject
  }

  searchSuppliers(query: string) {
    this.supplierService.searchSuppliers(query).subscribe(
      (data: Supplier[]) => {
        this.suppliers = data;
        this.updatePagination();
      },
      error => console.error('Error fetching suppliers:', error)
    );
  }


  get totalPages() {
    return Math.ceil(this.suppliers.length / this.entriesPerPage);
  }

  get paginatedSuppliers() {
    const start = (this.currentPage - 1) * this.entriesPerPage;
    return this.suppliers.slice(start, start + this.entriesPerPage);
  }

  updatePagination() {
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.searchSuppliers(this.searchTerm);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.searchSuppliers(this.searchTerm);
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.searchSuppliers(this.searchTerm);
  }

  get totalPagesArray() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
