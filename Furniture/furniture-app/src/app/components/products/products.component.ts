import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
 
import { Modal } from 'bootstrap';
import { ProductService } from '../../services/product.service';

export interface Product {
  ProductID: number;
  ProductCode: string;
  ProductName: string;
  SupplierID: number;
  SupplierItemNumber: string;
  FinalPrice: number;
  Picture: string;
}
export interface ProductModal{
  ProductID : number;
  ProductName: string;
  SupplierID: number;
  FinalPrice: number;
  Picture: string;
}
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ],
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  @ViewChild('addProductModal') addProductModal!: ElementRef;
  private modal: Modal | null = null;

  products : Product[] = [];
 
  searchTerm: string = '';
  selectedFile: File | null = null;
 
  // Pagination properties
  entriesPerPage: number = 20;
  currentPage: number = 1;
  newProduct : Product = {
    ProductID: 0,
    ProductCode: '',
    ProductName: '',
    SupplierID: 0,
    SupplierItemNumber: '',
    FinalPrice: 0,
    Picture: ''
  };
  constructor (private productService : ProductService){

  }
  ngOnInit(): void{
      this.productService.getProducts().subscribe((data) =>{
        this.products = data;
      });
  }

  ngAfterViewInit() {
    if (this.addProductModal) {
      this.modal = new Modal(this.addProductModal.nativeElement);
    }
  }
  
  isEdit : boolean = false;
  openModal() {
    if(this.isEdit == false){
      this.newProduct= {
        ProductID: 0,
        ProductCode: '',
        ProductName: '',
        SupplierID: 0,
        SupplierItemNumber: '',
        FinalPrice: 0,
        Picture: ''
      };
    }
    if(this.modal) {
      this.modal.show();
    }
  }
  
  closeProduct(){
    this.isEdit = false;
  }
  // Handle Image Upload
  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newProduct.Picture = e.target.result; // Store image as base64
      };
      if(this.selectedFile){
        reader.readAsDataURL(this.selectedFile);
      }
     else{
      alert('select an image');
     }
    }
  }

  // Save Product
 
  saveProduct() {
    if (!this.newProduct.ProductName || !this.newProduct.SupplierID || !this.newProduct.FinalPrice) {
      alert('Please fill all the required fields.');
      return;
    }
    // implement add product
    // implement update product
    if (this.modal) {
      this.modal.hide();
    }
  
    this.newProduct  = {
      ProductID: 0,
      ProductCode: '',
      ProductName: '',
      SupplierID: 0,
      SupplierItemNumber: '',
      FinalPrice: 0,
      Picture: ''
    };
    this.isEdit = false;
    this.updatePagination();
  }
  

  // Edit Product
  editProduct(product : Product) {
    this.newProduct = { ...product };
    this.isEdit = true;
    this.openModal();
  }

  // Delete Product
  deleteProduct(ProductID: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.products = this.products.filter(p => p.ProductID !== ProductID);
      this.updatePagination();
    }
  }

  // Search Filter
  get filteredProducts() {
    return this.products.filter(product =>
      product.ProductName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      product.ProductCode.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Pagination Methods
  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.entriesPerPage);
  }

  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.entriesPerPage;
    return this.filteredProducts.slice(start, start + this.entriesPerPage);
  }

  get startItem() {
    return (this.currentPage - 1) * this.entriesPerPage;
  }

  get endItem() {
    return Math.min(this.startItem + this.entriesPerPage, this.filteredProducts.length);
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
