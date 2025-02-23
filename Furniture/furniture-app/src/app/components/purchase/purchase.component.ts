import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Purchase {
  purchaseID: number;
  productID: number;
  supplierID: number;
  soNumber: string;
  recordMargin: number;
  createdDate: string;
}

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent implements OnInit {
  purchases: Purchase[] = [
    { purchaseID: 1, productID: 101, supplierID: 501, soNumber: 'SO1234', recordMargin: 15, createdDate: '2024-02-21' },
    { purchaseID: 2, productID: 102, supplierID: 502, soNumber: 'SO1235', recordMargin: 12, createdDate: '2024-02-20' },
    { purchaseID: 3, productID: 103, supplierID: 503, soNumber: 'SO1236', recordMargin: 18, createdDate: '2024-02-19' },
    { purchaseID: 4, productID: 104, supplierID: 504, soNumber: 'SO1237', recordMargin: 10, createdDate: '2024-02-18' },
  ];

  filteredPurchases: Purchase[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 100, 200];
  searchQuery: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;
  selectedPurchase: Purchase | null = null;
  totalPages: number = 0;

  ngOnInit() {
    this.filteredPurchases = [...this.purchases];
    this.updateTotalPages();
  }

  updateTotalPages() {
    this.totalPages = Math.ceil(this.filteredPurchases.length / this.pageSize);
    // Reset to page 1 if current page is now invalid
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onPageSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.currentPage = 1;
    this.updateTotalPages();
  }

  decrementPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  incrementPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  get paginatedPurchases(): Purchase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPurchases.slice(start, start + this.pageSize);
  }

  searchPurchases() {
    if (!this.searchQuery.trim()) {
      this.filteredPurchases = [...this.purchases];
    } else {
      this.filteredPurchases = this.purchases.filter(purchase =>
        purchase.soNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        purchase.purchaseID.toString().includes(this.searchQuery)
      );
    }
    this.currentPage = 1;
    this.updateTotalPages();
  }

  addPurchase() {
    this.isEditing = false;
    this.selectedPurchase = {
      purchaseID: 0,
      productID: 0,
      supplierID: 0,
      soNumber: '',
      recordMargin: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };
    this.showModal = true;
  }

  editPurchase(purchase: Purchase) {
    this.isEditing = true;
    this.selectedPurchase = { ...purchase };
    this.showModal = true;
  }

  savePurchase() {
    if (!this.selectedPurchase) return;

    if (this.isEditing) {
      const index = this.purchases.findIndex(p => p.purchaseID === this.selectedPurchase?.purchaseID);
      if (index !== -1) {
        this.purchases[index] = { ...this.selectedPurchase };
      }
    } else {
      const maxId = Math.max(...this.purchases.map(p => p.purchaseID), 0);
      this.selectedPurchase.purchaseID = maxId + 1;
      this.purchases.push({ ...this.selectedPurchase });
    }
    
    this.searchPurchases();
    this.closeModal();
  }

  deletePurchase(id: number) {
    if (confirm('Are you sure you want to delete this purchase?')) {
      this.purchases = this.purchases.filter(p => p.purchaseID !== id);
      this.searchPurchases();
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedPurchase = null;
  }

  preventModalClose(event: Event) {
    event.stopPropagation();
  }
}