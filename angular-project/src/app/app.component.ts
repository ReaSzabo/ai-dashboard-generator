import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  title = 'angular-project';
  inputText: string = '';
  responseText: string = '';
  errorMessage: string = '';
  chartData: any = null;
  chart: Chart | null = null;

  ngOnInit() {
    // Component initialized - chart will only be created when user sends a query
  }

  ngAfterViewInit() {
    // Chart will be created when data is available
  }

  loadRegistrationData() {
    // Reset previous messages
    this.responseText = '';
    this.errorMessage = '';

    // Use natural language query instead of parameters
    const url = `http://localhost:3000/getData`;
    const body = { query: "Gmail regisztrációk január 1-5 között" };
    
    this.http.post(url, body).subscribe({
      next: (response: any) => {
        console.log('Received data:', response);
        this.chartData = response;
        
        // Determine data type and count
        const dataType = response.dataType || 'registrations';
        const dataKey = dataType === 'logins' ? 'logins' : 'registrations';
        const dataCount = response[dataKey]?.length || 0;
        const typeLabel = dataType === 'logins' ? 'bejelentkezések' : 'regisztrációk';
        
        this.responseText = `Loaded ${dataCount} records for ${response.type} ${typeLabel}`;
        
        // Create chart after view is ready
        setTimeout(() => {
          if (this.chartCanvas) {
            this.createChart();
          } else {
            console.error('Chart canvas not available yet');
          }
        }, 200);
      },
      error: (error: any) => {
        this.errorMessage = `Hiba a szerver elérésekor: ${error.message}`;
        console.error('HTTP Error:', error);
      }
    });
  }

  createChart() {
    // Determine data type and key
    const dataType = this.chartData?.dataType || 'registrations';
    const dataKey = dataType === 'logins' ? 'logins' : 'registrations';
    
    if (!this.chartData || !this.chartData[dataKey]) {
      console.error('No chart data available');
      return;
    }
    
    if (!this.chartCanvas) {
      console.error('Chart canvas not available');
      return;
    }

    console.log('Creating chart with data:', this.chartData);

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Cannot get 2D context from canvas');
      return;
    }

    // Prepare data for Chart.js
    const dataArray = this.chartData[dataKey];
    const labels = dataArray.map((item: any) => item.date);
    const registrationType = this.chartData.type;
    
    let data: number[] = [];
    let label = '';

    // Determine label based on data type
    const typeLabel = dataType === 'logins' ? 'bejelentkezés' : 'regisztráció';
    const typeLabelPlural = dataType === 'logins' ? 'bejelentkezések' : 'regisztrációk';

    if (registrationType === 'all') {
      // For all types, sum up all registration/login methods
      data = dataArray.map((item: any) => 
        (item.facebook || 0) + (item.gmail || 0) + (item.email || 0)
      );
      label = `Összes ${typeLabel}`;
    } else {
      // For specific type, use that data
      data = dataArray.map((item: any) => item[registrationType] || 0);
      label = `${registrationType.charAt(0).toUpperCase() + registrationType.slice(1)} ${typeLabelPlural}`;
    }

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Regisztrációs adatok (${this.chartData.dateRange?.startDate || ''} - ${this.chartData.dateRange?.endDate || ''})`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Regisztrációk száma'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Dátum'
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
    console.log('Chart created successfully:', this.chart);
  }

  // Debug method
  debugChart() {
    console.log('=== Chart Debug Info ===');
    console.log('Chart data:', this.chartData);
    console.log('Canvas element:', this.chartCanvas);
    console.log('Chart instance:', this.chart);
    console.log('========================');
  }

  sendData() {
    // Natural language query to the Express.js server
    if (this.inputText.trim() === '') {
      return;
    }

    // Reset previous messages
    this.responseText = '';
    this.errorMessage = '';
    this.chartData = null;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Send natural language query to Express.js server
    const url = `http://localhost:3000/getData`;
    const body = { query: this.inputText };
    
    this.http.post(url, body).subscribe({
      next: (response: any) => {
        console.log('Received data:', response);
        this.chartData = response;
        
        // Determine data type and count
        const dataType = response.dataType || 'registrations';
        const dataKey = dataType === 'logins' ? 'logins' : 'registrations';
        const dataCount = response[dataKey]?.length || 0;
        const typeLabel = dataType === 'logins' ? 'bejelentkezések' : 'regisztrációk';
        
        this.responseText = `Loaded ${dataCount} records for ${response.type} ${typeLabel}`;
        
        // Create chart after view is ready
        setTimeout(() => {
          if (this.chartCanvas) {
            this.createChart();
          } else {
            console.error('Chart canvas not available yet');
          }
        }, 200);
      },
      error: (error: any) => {
        this.errorMessage = `Hiba a szerver elérésekor: ${error.message}`;
        console.error('HTTP Error:', error);
      }
    });
  }
}