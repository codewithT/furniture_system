import { Component, ViewChild, AfterViewInit } from '@angular/core';
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
interface Order {
  SalesID: number;
  Created_date: string;
  ProductId: number;
  ProductName : string;
  customerEmail: string;
  totalOrderItem: number;
   
}

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
    MatMenuModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.css'],
})
export class ManageOrderComponent implements AfterViewInit {
  displayedColumns: string[] = ['SalesID', 'Created_date', 'ProductId','ProductName', 'customerEmail', 'totalOrderItem',  'action'];
  dataSource = new MatTableDataSource<Order>([
    { SalesID: 1, Created_date: '2025-02-04', ProductId: 5, ProductName : 'hell0',customerEmail: 'ram@gmail.com', totalOrderItem: 1  },
    { SalesID: 2, Created_date: '2025-02-05', ProductId: 6, ProductName : 'hell0',customerEmail: 'ram@gmail.com', totalOrderItem: 2  },
    { SalesID: 3, Created_date: '2025-02-06', ProductId: 8, ProductName : 'hell0',customerEmail: 'ram@gmail.com', totalOrderItem: 5 },
    { SalesID: 4, Created_date: '2025-02-07', ProductId: 7,ProductName : 'hell0' ,customerEmail: 'ram@gmail.com', totalOrderItem: 3 },
    { SalesID: 5, Created_date: '2025-02-08', ProductId: 10,ProductName : 'hell0', customerEmail: 'ram@gmail.com', totalOrderItem: 4  },
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  // construtor
  constructor(private router: Router,
    private route: ActivatedRoute,
  ){}
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 15];
  searchTerm: string = '';

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

 

  applySearchFilter() {
    const filterValue = this.searchTerm.toLowerCase();
    this.dataSource.filterPredicate = (order: Order, filter: string) =>
      order.ProductId.toString().toLowerCase().includes(filter) ||
      order.Created_date.toLowerCase().includes(filter) ||
      order.customerEmail.includes(filter)  ||
      order.ProductName.includes(filter)
     
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  performAction(order: Order) {
    alert(`Performing action on Order #${order.SalesID}`);
  }
  
   
  removeOrder(order: Order) {
    console.log('Removing order:', order);
    // Add your remove logic here
  }
}