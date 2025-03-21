class Dashboard {
    constructor() {}

    getResourceOnDateFilterOnchange() {
        $('.dashboard-date-filter').on('change', function (event) {
            const date_filter = parseDateRange($('.dashboard-date-filter').val());
            const start_date = date_filter['startDate'];
            const end_date = date_filter['endDate'];
            if (!start_date && !end_date) return;

            (new Journal()).getJournals();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dboardInstance = new Dashboard();
    dboardInstance.getResourceOnDateFilterOnchange();
});
