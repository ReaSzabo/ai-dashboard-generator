import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import {GenerateChartRequestBody,  GenerateChartResponse, ApiError } from './interfaces';

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
  chartData: GenerateChartResponse | null = null;
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
    const body: GenerateChartRequestBody = { query: "Gmail regisztrációk január 1-5 között" };
    
    this.http.post<GenerateChartResponse>(url, body).subscribe({
      next: (response: GenerateChartResponse) => {
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
      error: (error: HttpErrorResponse) => {
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
    if (!dataArray) {
      console.error('No data array available');
      return;
    }
    const registrationType = this.chartData.type;
    const chartType = this.chartData.chartType || 'line';
    const aggregationType = this.chartData.aggregationType || 'total';
    
    let datasets: any[] = [];
    let labels: string[] = [];

    // Determine label based on data type
    const typeLabel = dataType === 'logins' ? 'bejelentkezés' : 'regisztráció';
    const typeLabelPlural = dataType === 'logins' ? 'bejelentkezések' : 'regisztrációk';

    // Set up labels (dates for line/bar charts, types for pie charts)
    if (chartType === 'pie') {
      if (aggregationType === 'breakdown' && registrationType === 'all') {
        // Pie chart showing distribution of registration types
        const totalFacebook = dataArray.reduce((sum: number, item: any) => sum + (item.facebook || 0), 0);
        const totalGmail = dataArray.reduce((sum: number, item: any) => sum + (item.gmail || 0), 0);
        const totalEmail = dataArray.reduce((sum: number, item: any) => sum + (item.email || 0), 0);
        
        labels = ['Facebook', 'Gmail', 'Email'];
        datasets = [{
          label: `${typeLabelPlural} típusok szerint`,
          data: [totalFacebook, totalGmail, totalEmail],
          backgroundColor: [
            'rgba(59, 89, 152, 0.8)', // Facebook blue
            'rgba(234, 67, 53, 0.8)',  // Gmail red
            'rgba(52, 168, 83, 0.8)'   // Email green
          ],
          borderColor: [
            'rgba(59, 89, 152, 1)',
            'rgba(234, 67, 53, 1)',
            'rgba(52, 168, 83, 1)'
          ],
          borderWidth: 1
        }];
      } else {
        // Pie chart for daily breakdown of specific type or total
        labels = dataArray.map((item: any) => item.date);
        const pieData = registrationType === 'all' 
          ? dataArray.map((item: any) => (item.facebook || 0) + (item.gmail || 0) + (item.email || 0))
          : dataArray.map((item: any) => item[registrationType] || 0);
        
        datasets = [{
          label: registrationType === 'all' ? `Összes ${typeLabel}` : `${registrationType} ${typeLabelPlural}`,
          data: pieData,
          backgroundColor: this.generateColors(pieData.length),
          borderWidth: 1
        }];
      }
    } else {
      // Line and bar charts
      labels = dataArray.map((item: any) => item.date);
      
      if (aggregationType === 'breakdown' && registrationType === 'all') {
        // Multiple datasets for each registration type
        datasets = [
          {
            label: 'Facebook',
            data: dataArray.map((item: any) => item.facebook || 0),
            borderColor: 'rgba(59, 89, 152, 1)',
            backgroundColor: 'rgba(59, 89, 152, 0.2)',
            tension: chartType === 'line' ? 0.1 : undefined
          },
          {
            label: 'Gmail',
            data: dataArray.map((item: any) => item.gmail || 0),
            borderColor: 'rgba(234, 67, 53, 1)',
            backgroundColor: 'rgba(234, 67, 53, 0.2)',
            tension: chartType === 'line' ? 0.1 : undefined
          },
          {
            label: 'Email',
            data: dataArray.map((item: any) => item.email || 0),
            borderColor: 'rgba(52, 168, 83, 1)',
            backgroundColor: 'rgba(52, 168, 83, 0.2)',
            tension: chartType === 'line' ? 0.1 : undefined
          }
        ];
      } else {
        // Single dataset - either specific type or total
        const singleData = registrationType === 'all' 
          ? dataArray.map((item: any) => (item.facebook || 0) + (item.gmail || 0) + (item.email || 0))
          : dataArray.map((item: any) => item[registrationType] || 0);
        
        const label = registrationType === 'all' 
          ? `Összes ${typeLabel}`
          : `${registrationType.charAt(0).toUpperCase() + registrationType.slice(1)} ${typeLabelPlural}`;
        
        datasets = [{
          label: label,
          data: singleData,
          borderColor: chartType === 'bar' ? 'rgba(54, 162, 235, 1)' : 'rgb(75, 192, 192)',
          backgroundColor: chartType === 'bar' ? 'rgba(54, 162, 235, 0.6)' : 'rgba(75, 192, 192, 0.2)',
          tension: chartType === 'line' ? 0.1 : undefined,
          borderWidth: 2
        }];
      }
    }

    const config: ChartConfiguration = {
      type: chartType as ChartType,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${typeLabelPlural} adatok (${this.chartData.dateRange?.startDate || ''} - ${this.chartData.dateRange?.endDate || ''})`
          },
          legend: {
            display: true,
            position: chartType === 'pie' ? 'right' : 'top'
          }
        },
        scales: chartType === 'pie' ? {} : {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `${typeLabelPlural} száma`
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

  // Generate colors for pie chart segments
  generateColors(count: number): string[] {
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
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
    const url = `http://localhost:3000/api/generate-chart`;
    const body: GenerateChartRequestBody = { query: this.inputText };
    
    this.http.post<GenerateChartResponse>(url, body).subscribe({
      next: (response: GenerateChartResponse) => {
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
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Hiba a szerver elérésekor: ${error.message}`;
        console.error('HTTP Error:', error);
      }
    });
  }
}