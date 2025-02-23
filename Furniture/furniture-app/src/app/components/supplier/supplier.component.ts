import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import { Modal } from 'bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
export interface Supplier{
  supplierID: number,
  supplierCode : string, 
  supplierName : string, 
  supplierAddress : string,
}
@Component({
  selector: 'app-supplier',
 imports: [CommonModule, FormsModule, RouterModule, ],
  standalone : true,
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.css'
})
export class SupplierComponent implements OnInit{
     @ViewChild('addSupplierModal' ,{ static: false }) addSupplierModal!: ElementRef;
      private modal: Modal | null = null;
    

    suppliers : Supplier[] = [];
    entriesPerPage: number = 20;
      currentPage: number = 1;
      searchTerm : string = '';
      newSupplier ={
        supplierID: -1,
        supplierCode : '', 
        supplierName : '', 
        supplierAddress : '',
      }
  
    constructor(private supplierService : SupplierService){
    }

    ngOnInit(): void{
      this.supplierService.getSupplier_items().subscribe((data) =>{
        this.suppliers = data;
      });
    }
    ngAfterViewInit() {
      
        if (this.addSupplierModal) {
          this.modal = new Modal(this.addSupplierModal.nativeElement);
        } else {
          console.error("Modal element reference is not found.");
        }
    }
    
      isEdit : boolean = false;
      openModal() {
        if(this.isEdit == false){
          this.newSupplier ={
            supplierID: -1,
            supplierCode : '', 
            supplierName : '', 
            supplierAddress : '',
          }
        }
        
        if(this.modal) {
          this.modal.show();
        }
        else{
          console.log("modal is not initiated");
        }
      }
      closeSupplier(){
        this.isEdit = false;
        this.newSupplier =  this.newSupplier ={
          supplierID: -1,
          supplierCode : '', 
          supplierName : '', 
          supplierAddress : '',
        }
      }
      editSupplier(supplier : Supplier){
        this.newSupplier = {...supplier};
        this.isEdit = true;
        this.openModal();
      }
      deleteSupplier(supplierID  : number){
        // delete implementation
        if (confirm('Are you sure you want to delete this product?')) {
          this.suppliers = this.suppliers.filter(p => p.supplierID !== supplierID);
          // implement service 
          this.updatePagination();
        }
      }
    get filteredSuppliers() {
      return this.suppliers.filter(item =>
        item.supplierID.toString().toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.supplierCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.supplierAddress.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    saveSupplier(){
      if (!this.newSupplier.supplierCode || !this.newSupplier.supplierName || !this.newSupplier.supplierAddress) {
        alert('Please fill all the required fields.');
        return;
      }
      // implement add product
      // implement update product
      if (this.modal) {
        this.modal.hide();
      }
      this.isEdit = false;
      this.updatePagination();
    }
    //pagination
    get totalPages() {
      return Math.ceil(this.filteredSuppliers.length / this.entriesPerPage);
    }
  
    get paginatedProducts() {
      const start = (this.currentPage - 1) * this.entriesPerPage;
      return this.filteredSuppliers.slice(start, start + this.entriesPerPage);
    }
  
    get startItem() {
      return (this.currentPage - 1) * this.entriesPerPage;
    }
  
    get endItem() {
      return Math.min(this.startItem + this.entriesPerPage, this.filteredSuppliers.length);
    }
  
    updatePagination() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    }
  
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    }
  
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    }
  
    goToPage(page: number) {
      this.currentPage = page;
    }
  
    get totalPagesArray() {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
}
