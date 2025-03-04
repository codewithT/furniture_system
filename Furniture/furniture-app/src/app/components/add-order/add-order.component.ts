import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddOrderService } from '../../services/addOrder.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-order',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  standalone: true,
  templateUrl: './add-order.component.html',
  styleUrls: ['./add-order.component.css']
})
export class AddOrderComponent implements OnInit {
  orderForm!: FormGroup;
 
  constructor(private fb: FormBuilder,
    private addOrderService : AddOrderService,
    private authService : AuthService
  ) {}

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
      
      paymentStatus: ['', Validators.required],
      shipToParty: [''],
      internalNote : [''],
    });

    this.addItem();
    this.setupFormListeners();
  }

  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }
  SupplierCodes: { [index: number]: any[] } = {}; // Store supplier codes per row
  markedForPurchase : any = [];
  storeProductSupplierIdCodes : any = [];
  nonCheckedProductSupplierIdCodes : any = [];
  addItem() {
    const index = this.items.length; // Track index for each row
    this.SupplierCodes[index] = [];
    const item = this.fb.group({
      selected :[false],
      SupplierCode :['', Validators.required],
      ProductCode : ['', Validators.required],
      ProductName: ['', [Validators.required]],
      rate: [0, [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      total: [{ value: 0, disabled: true }]
    });

    item.get('ProductCode')?.valueChanges.subscribe((productCode)=>{
      if(productCode){
          this.addOrderService.getSupplierCodesByProductCode(productCode).subscribe(
          (data: any[]) =>{
            if (data && data.length) {
            
              // Map data to store supplierId, supplierCode, and productCode
              // this.addOrderService.getProductID()
              this.SupplierCodes[index] = data.map(supplier => ({
                  SupplierID: supplier.SupplierID,
                  SupplierCode: supplier.SupplierCode,
                  ProductCode: productCode
              }));

              console.log(`Supplier codes for row ${index}:`, this.SupplierCodes[index]);
          }
          },
          (error) =>{
            console.error('Error fetching supplier codes:', error);
          }
       );
      }
    });

    item.get('rate')?.valueChanges.subscribe((rate) => {
      const qty = item.get('quantity')?.value ?? 0;
      rate = rate ?? 0;
      const total = rate * qty;
      if (item.get('total')?.value !== total) {
          item.get('total')?.setValue(total, { emitEvent: false });
      }
      this.updateSubAmount();
  });

    item.get('quantity')?.valueChanges.subscribe((qty) => {
      const rate = item.get('rate')?.value ?? 0;
      qty = qty ?? 0;
      const total = rate * qty;
      if (item.get('total')?.value !== total) {
          item.get('total')?.setValue(total, { emitEvent: false });
      }
      this.updateSubAmount();
  });
    this.items.push(item);
  }
 
 handleSupplierSelect(event: Event, index: number) {
 const selectedSupplierCode : any = [];
  const value = (event.target as HTMLSelectElement).value;
  
  selectedSupplierCode.push(this.SupplierCodes[index].find(s => s.SupplierCode === value));
  console.log("Selected" , selectedSupplierCode);
  this.addOrderService.getProductID( selectedSupplierCode[0].ProductCode,selectedSupplierCode[0].SupplierID)
  .subscribe(
    (data : any) =>{
      console.log("API Response:", data); 
      const item = this.items.at(index).getRawValue();
      console.log("ITEM VALUE" , item);
      if (data && data.ProductID) {
         
        const formattedData = [{
          SupplierID: selectedSupplierCode[0].SupplierID,
          SupplierCode: selectedSupplierCode[0].SupplierCode,
          ProductCode: selectedSupplierCode[0].ProductCode,
          ProductID: data.ProductID,
          Check : false,
          index : index,
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          total: item.total || 0
      }];
        this.storeProductSupplierIdCodes.push(...formattedData); // Spread operator to avoid nested arrays

        console.log("STORED" , this.storeProductSupplierIdCodes);
    }
    },
    (error) => {
      console.error('Error fetching Product ID:', error);
    }
  );
  this.onSupplierSelect(value, index);
}

  onSupplierSelect(supplierCode : string, index: number) {
    const item = this.items.at(index);
    if (item) {
      item.patchValue({ SupplierCode: supplierCode }); // Store supplierCode for this row
    }
  }
  onCheckboxChange(index: number, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    // Find the object in storeProductSupplierIdCodes based on the index
    const itemIndex = this.storeProductSupplierIdCodes.findIndex((item: any) => item.index === index);
  
    if (itemIndex !== -1) {
      // Update the Check property
      this.storeProductSupplierIdCodes[itemIndex].Check = isChecked;
    }
    
    console.log("Updated storeProductSupplierIdCodes:", this.storeProductSupplierIdCodes);
    console.log("Updated nonCheckedProductSupplierIdCodes:", this.nonCheckedProductSupplierIdCodes);
  }
  


  removeItem(index: number) {
    this.items.removeAt(index);
    this.updateSubAmount();
  }

  setupFormListeners() {
    this.orderForm.get('gst')?.valueChanges.subscribe(()=>this.updateGrandTotal());
    // this.orderForm.get('paidAmount')?.valueChanges.subscribe(() => this.updateDueAmount());
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

    if (this.orderForm.get('grandTotal')?.value !== grandTotal) {
      this.orderForm.get('grandTotal')?.setValue(grandTotal, { emitEvent: false });
  }
     
  }

  //  checkedItems : any = [];
  //  nonCheckedItems : any = [];
  // filterBasedOnCheck(){
  //   this.checkedItems = this.storeProductSupplierIdCodes.filter((item : any) => item.Check);
  //   this.nonCheckedItems  = this.storeProductSupplierIdCodes.filter((item : any) => !item.Check);
  //   console.log("CHECKED " ,this.checkedItems);
  //   console.log("NON checked",this.nonCheckedItems);
  // }
  submitOrder() {
    if (this.orderForm.valid) {
      console.log('Order Submitted:', this.orderForm.getRawValue());
      const orderData = this.orderForm.getRawValue();
  
      // Filter only checked items
      // this.filterBasedOnCheck();
  
      // Prepare checked items for API
      console.log(this.storeProductSupplierIdCodes);
      const ItemsData = this.storeProductSupplierIdCodes.map((item: any) => ({
        ProductID: item.ProductID || null,
        SupplierID: item.SupplierID || null,
        ProductCode: item.ProductCode || '',
        SupplierCode: item.SupplierCode || '',
        Qty : item.quantity || 0,
        Price : item.rate || 0,
        TotalPrice : item.total || 0,
        Check : item.Check || false,
      }));
  
      // Final data to send
     console.log( this.authService.getCurrentUser());
      const finalData = {
        Created_by: this.authService.getCurrentUser(),   // Get from session or user input
        Delivery_date: orderData.Delivery_date || '',
        POStatus: orderData.POStatus || 'Not Ordered',
        PONumber: orderData.PONumber || '',
        CustomerEmail : orderData.clientEmail || '',
        GST : orderData.gst || 0,
        ShipToParty : orderData.shipToParty || '',
        InternalNote : orderData.internalNote || '',
        Payment_Status : orderData.paymentStatus,
        items: ItemsData
      };
  
      // Call API
      this.addOrderService.submitCheckedOrder(finalData).subscribe(
        (response) => {
          console.log('Checked items order response:', response);
          alert('Order placed successfully!');
          this.orderForm.reset({}, { emitEvent: false });
          this.initializeForm();
        },
        (error) => {
          console.error('Error submitting checked items order:', error);
        }
      );
    } else {
      alert('Please fill all required fields correctly.');
    }
  }
  
  
}
