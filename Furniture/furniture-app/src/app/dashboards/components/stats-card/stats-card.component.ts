import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stats-card',
  imports: [MatCardModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css'
})
 

 
export class StatsCardComponent {
  @Input() data: any;
}
