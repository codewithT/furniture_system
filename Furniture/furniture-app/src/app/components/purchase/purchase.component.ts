import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../services/purchase.service';
import { Purchase
 } from '../../models/purchases.model';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgIf, NgFor],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 100, 200];
  searchQuery: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;
  selectedPurchase: Purchase | null = null;
  totalPages: number = 0;

  // Sorting properties
  sortColumn: keyof Purchase | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  constructor(private purchaseService : PurchaseService){}
  ngOnInit() {
    this.loadPurchases();
  }
  loadPurchases() {
    this.purchaseService.getPurchases().subscribe((purchases: Purchase[]) => {
      console.log(purchases);
      this.purchases = purchases.map(purchase => ({ ...purchase, selected: false }));
      this.refreshList();
    });
  }
  
  
  refreshList() {
    this.purchaseService.getPurchases().subscribe((purchases : Purchase[]) =>{
        this.purchases = purchases.map(purchase =>({...purchase, selected : false}));
    })
    this.applySorting();
    this.updateTotalPages();
  }

  updateTotalPages() {
    console.log("filtered purchases " , this.filteredPurchases);
    this.totalPages = Math.ceil(this.purchases.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
  }
  getSelectedPurchases() {
    return this.purchases.filter((purchase: Purchase) => purchase.selected);
  }
  
  sendEmails() {
    const selectedPurchases = this.getSelectedPurchases();
    if (selectedPurchases.length === 0) {
      alert('Please select at least one purchase to send emails.');
      return;
    }
     console.log("Selected"  ,selectedPurchases);
    this.purchaseService.sendMail(selectedPurchases).subscribe(
      () => alert('Emails sent successfully!'),
      (error) => {
        console.error('Error sending email:', error);
        alert('Failed to send emails.');
      }
    );
  }
  
  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.pageSize = Number(target.value);
      this.currentPage = 1;
      this.updateTotalPages();
    }
  }

  decrementPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  incrementPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  get paginatedPurchases(): Purchase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.purchases.slice(start, start + this.pageSize);
  }

  sortTable(column: keyof Purchase) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  
    this.applySorting();
  }
  
  applySorting() {
    if (!this.sortColumn) return;
  
    const key = this.sortColumn as keyof Purchase;
    this.filteredPurchases.sort((a, b) => {
      let valueA = a[key] as string | number;
      let valueB = b[key] as string | number;
  
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
  
      return valueA < valueB ? (this.sortDirection === 'asc' ? -1 : 1) :
             valueA > valueB ? (this.sortDirection === 'asc' ? 1 : -1) : 0;
    });
  }
  searchPurchases() {
    if (!this.searchQuery.trim()) {
      this.loadPurchases(); // Load all purchases if search query is empty
      return;
    }
    console.log(this.searchQuery);
    this.purchaseService.searchPurchases(this.searchQuery).subscribe(
      (data : Purchase[]) => {
        this.purchases = data;
        this.currentPage = 1;
        this.updateTotalPages();
      },
      (error) => {
        console.error('Search error:', error);
      }
    );
  }

  addPurchase() {
    this.isEditing = false;
    this.selectedPurchase = {
      PurchaseID: 0,
      ProductCode: 0,
      SupplierCode: 0,
      SONumber: '',
      POStatus: '',
      Delivery_date: new Date().toISOString().split('T')[0],
      PONumber: '',
      Ordered_Qty : 0,
      // selected: false
    };
    this.showModal = true;
    console.log('Modal state:', this.showModal); // Add this line

  }

  editPurchase(purchase: Purchase) {
    this.isEditing = true;
    
    this.selectedPurchase = { ...purchase };
    this.showModal = true;
  }

  savePurchase() {
    if (!this.selectedPurchase) return;
    if(!this.selectedPurchase.PurchaseID || !this.selectedPurchase.POStatus || 
      !this.selectedPurchase.ProductCode
    ){
      return;
    }
    if (this.isEditing) {
      this.purchaseService.editPurchase(this.selectedPurchase).subscribe({
        next: () => {
           
          this.refreshList();
          this.closeModal();
        },
        error: (err) => console.error('Failed to update purchase:', err)
      });
    } else {
      this.selectedPurchase.PurchaseID = Math.max(0, ...this.purchases.map(p => p.PurchaseID)) + 1;
      this.purchases.push({ ...this.selectedPurchase });
    }

    this.refreshList();
    this.closeModal();
  }

  deletePurchase(id: number) {
    if (confirm('Are you sure you want to delete this purchase?')) {
      this.purchaseService.deletePurchase(id).subscribe(
        {
          next: ()=>{
            console.log("purchase delete sucessfully");
            this.refreshList();
          }
          ,
        error: (err) => console.error('Failed to delete purchase:', err)
        }
      )
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedPurchase = null;
  }

  preventModalClose(event: Event) {
    event.stopPropagation();
  }

  // Adding the missing methods
  selectAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.purchases.forEach(purchase => {
      purchase.selected = isChecked;
    });
  }
  

 
}