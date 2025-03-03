import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ManageOrderService } from '../../services/manageOrders.service';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Order } from '../../models/order.model';
 
@Component({
  selector: 'app-manage-order',
  standalone: true,
  imports: [
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatButtonModule, 
    MatInputModule, 
    CommonModule, 
    FormsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatIconModule,
    RouterModule,
    MatPseudoCheckboxModule,
  ],
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.css'],
})
export class ManageOrderComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['select','SalesID', 'Created_date', 'ProductID', 'ProductName', 'CustomerEmail', 'Qty', 'Delivery_date', 'Payment_Status', 'action'];
  dataSource = new MatTableDataSource<Order>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchTerm: string = '';
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 15];
  // searchTerm: string = '';
  constructor(private manageOrderService: ManageOrderService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.manageOrderService.getOrders().subscribe((orders) => {
      this.dataSource.data = orders.map((order : Order) => ({
        ...order,
        Created_date: new Date(order.Created_date).toISOString().split('T')[0], 
        Delivery_date: new Date(order.Delivery_date).toISOString().split('T')[0],
        selected: false ,
      }));
    });
  }
  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applySearchFilter() {
    const filterValue = this.searchTerm.toLowerCase();
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  getSelectedOrders(): Order[] {
    const orders =  this.dataSource.data.filter((order: Order) => order.selected);
    console.log(orders);
    return orders;
  }
  
  removeOrder(order: Order) {
    // this.manageOrderService.removeOrder(order.SalesID);
  }

  sendEmailsToCustomers(){
      const selectedOrders = this.getSelectedOrders();
      console.log(selectedOrders);
      if (selectedOrders.length === 0) {
        alert("No orders selected!");
        return;
      }
      this.manageOrderService.sendMails(selectedOrders).subscribe(
        (response) => {
          alert("Emails sent successfully!");
        },
        (error) => {
          console.error("Error sending email:", error);
          alert("Failed to send emails!");
        }

      );

  }
  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }
  toggleAllSelection(event: any) {
    const checked = event.checked;
    this.dataSource.data.forEach(order => order.selected = checked);
  }
  performAction(order: Order) {
    alert('Performing action on Order #${order.SalesID}');
  }
}
