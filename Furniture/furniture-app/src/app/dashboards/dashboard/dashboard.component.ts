import { Component } from '@angular/core';
import { DashboardDataService } from '../services/dashboard-data.service';
import { ChartWidgetComponent } from '../components/chart-widget/chart-widget.component';
import { StatsCardComponent } from '../components/stats-card/stats-card.component';
import { TableWidgetComponent } from '../components/table-widget/table-widget.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-dashboard',
  imports: [ChartWidgetComponent,StatsCardComponent, TableWidgetComponent, MatToolbarModule],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
 
export class DashboardComponent {
  stats: any = [];

  constructor(private dashboardService: DashboardDataService) {
    this.stats = this.dashboardService.getStats();
  }
}
