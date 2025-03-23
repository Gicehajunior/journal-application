class Dashboard {
    constructor() {
        this.categoryChart = undefined;
        this.entryCountChart = undefined;
    }

    getResourceOnDateFilterOnchange() {
        $('.dashboard-date-filter').on('change', function (event) {
            const date_filter = parseDateRange($('.dashboard-date-filter').val());
            const start_date = date_filter['startDate'];
            const end_date = date_filter['endDate'];
            if (!start_date && !end_date) return;

            (new Journal()).getJournals();
            (new Dashboard()).buildPieChartVisual();
        });
    }

    buildPieChartVisual() {
        const date_filter = parseDateRange($('.journal-date-filter').val());
        $.ajax({
            type: "get",
            url: `/dashboard/journal/piechart-stat?start_date=${date_filter['startDate']}&end_date=${date_filter['endDate']}`,
            data: "data",
            dataType: "json",
            success: function (response) {
                if (response && response.data) {
                    (new Dashboard()).mapPieChartVisual(response.data);
                    (new Dashboard()).mapBarChartVisual(response.data);
                }
            }, 
            error: error => {
                try {
                    error = JSON.parse(error.responseText);
                } catch (e) {
                    error = { message: "An error occurred." };
                }

                console.log(`Ajax Error: ${error.message || JSON.stringify(error)}`);
                toast('error', 8000, error.message || 'An error occurred. Please try again!');
            } 
        });
    }

    mapPieChartVisual(data) { 
        let canvasElementContainer = document.querySelector('.visual-rep-1'); 
        if (documentContains(canvasElementContainer) && data && data?.length) {
            let canvasElement = createCanvas(canvasElementContainer, {id: 'categoryChart'});  
            const labels = data.map(d => d.category_name);
            const counts = data.map(d => d.count);    
            
            new Chart(canvasElement, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                    }]
                }
            });
        }
    }

    mapBarChartVisual(data) {
        let canvasElementContainer = document.querySelector('.visual-rep-2'); 
        if (documentContains(canvasElementContainer) && data && data?.length) { 
            let canvasElement = createCanvas(canvasElementContainer, {id: 'entryChart'}); 
            const labels = data.map(d => d.category_name);
            const counts = data.map(d => d.count);   
            new Chart(canvasElement, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Number of Entries',
                        data: counts,
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'],
                        borderColor: '#333',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dboardInstance = new Dashboard();
    dboardInstance.getResourceOnDateFilterOnchange();
    dboardInstance.buildPieChartVisual();
});
