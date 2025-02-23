import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-order',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  standalone: true,
  templateUrl: './add-order.component.html',
  styleUrls: ['./add-order.component.css']
})
export class AddOrderComponent implements OnInit {
  orderForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.orderForm = this.fb.group({
     
      clientEmail: ['', [Validators.required, Validators.minLength(3)]],
     
      items: this.fb.array([]),
      
      subAmount: [{ value: 0, disabled: true }],
      totalAmount: [{ value: 0, disabled: true }],
      grandTotal: [{ value: 0, disabled: true }],
      gst: [ 0 , Validators.required ],
      paidAmount: [0, Validators.required],
      dueAmount: [{ value: 0, disabled: true }],
       
    });

    this.addItem();
    this.setupFormListeners();
  }

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  addItem() {
    const item = this.fb.group({
      ProductId : [0, Validators.required],
      ProductName: ['', [Validators.required]],
      rate: [0, [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      total: [{ value: 0, disabled: true }]
    });

    // Update total price when quantity or rate changes
    item.get('quantity')?.valueChanges.subscribe((qty) => {
      const rate = item.get('rate')?.value ?? 0;
      qty = qty ?? 0;
      item.get('total')?.setValue(rate * qty);
      this.updateSubAmount();
    });

    item.get('rate')?.valueChanges.subscribe((rate) => {
      const qty = item.get('quantity')?.value ?? 0;
      rate = rate ?? 0;
      item.get('total')?.setValue(rate * qty);
      this.updateSubAmount();
    });

    this.items.push(item);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.updateSubAmount();
  }

  setupFormListeners() {
    this.orderForm.get('gst')?.valueChanges.subscribe(()=>this.updateGrandTotal());
    this.orderForm.get('paidAmount')?.valueChanges.subscribe(() => this.updateDueAmount());
  }
  
  updateSubAmount() {
    const subTotal = this.items.controls.reduce((sum, item) => sum + (item.get('total')?.value || 0), 0);
    this.orderForm.get('subAmount')?.setValue(subTotal);
    this.updateGrandTotal();
  }

  updateGrandTotal() {
    const subTotal = this.orderForm.get('subAmount')?.value || 0;
    const gstPercentage = this.orderForm.get('gst')?.value || 0;
    const gst = subTotal * (gstPercentage)*0.01 ; // Example: 13% HST
    const grandTotal = subTotal + gst ;

    this.orderForm.get('gst')?.setValue(gstPercentage);
    this.orderForm.get('grandTotal')?.setValue(grandTotal);
    this.updateDueAmount();
  }

  updateDueAmount() {
    const grandTotal = this.orderForm.get('grandTotal')?.value || 0;
    const paidAmount = this.orderForm.get('paidAmount')?.value || 0;
    const dueAmount = grandTotal - paidAmount;

    this.orderForm.get('dueAmount')?.setValue(dueAmount);
  }
  filteredProducts :any = [];
  onProductSearch(id: number, index: number) {
    const product = this.filteredProducts.find((p: { id: number }) => p.id === id);
    if (product) {
      this.items.at(index).patchValue({
        ProductName: product.name,
        rate: product.rate,
        quantity: 1,  // Default quantity
        total: product.rate * 1
      });
      this.updateSubAmount();
    } else {
      alert('Product not found');
    }
  }
  submitOrder() {
    if (this.orderForm.valid) {
      console.log('Order Submitted:', this.orderForm.getRawValue());
      alert('Order placed successfully!');
      
      // Reset form while keeping structure intact
      this.orderForm.reset();
      this.initializeForm();
    } else {
      alert('Please fill all required fields correctly.');
    }
  }
}
