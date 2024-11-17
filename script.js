class HNVisualization {
    constructor() {
        this.plotDiv = document.getElementById('plotDiv');
        this.monthlyStoriesList = document.getElementById('monthlyStoriesList');
    }

    init() {
        this.loadData();
    }

    loadData() {
        Papa.parse('top_stories_cache.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => this.handleDataLoad(results)
        });
    }

    handleDataLoad(results) {
        const data = this.processData(results.data);
        this.createPlot(data);
        const storiesByMonth = this.getTopStoriesByMonth(data);
        this.renderMonthlyStories(storiesByMonth);
    }

    processData(rawData) {
        return rawData.filter(row => {
            const date = this.parseDate(row.date);
            if (date) {
                row.date = date;
                return true;
            }
            return false;
        });
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        
        const [year, month, day] = parts.map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        
        return new Date(year, month - 1, day);
    }

    createPlot(data) {
        const trace = {
            type: 'scatter',
            mode: 'markers',
            x: data.map(row => row.date),
            y: data.map(row => row.score),
            customdata: data.map(row => [row.id, row.title]),
            marker: {
                size: 8,
                color: data.map(row => row.score),
                colorscale: 'Viridis',
                opacity: 0.7,
                line: {
                    color: 'white',
                    width: 1
                }
            },
            hovertemplate: 
                '<b>%{customdata[1]}</b><br>' +
                'Date: %{x|%d %B %Y}<br>' +
                'Score: %{y}<br>' +
                '<extra></extra>'
        };

        const layout = {
            height: 700,
            margin: { t: 30, r: 30, l: 50, b: 50 },
            hovermode: 'closest',
            paper_bgcolor: 'white',
            plot_bgcolor: '#f8f9fa',
            xaxis: {
                title: 'Date',
                gridcolor: '#eee',
                zeroline: false
            },
            yaxis: {
                title: 'Score',
                gridcolor: '#eee',
                zeroline: false
            },
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        Plotly.newPlot(this.plotDiv, [trace], layout, config);
        this.setupPlotClickHandler();
    }

    setupPlotClickHandler() {
        this.plotDiv.on('plotly_click', (data) => {
            const id = data.points[0].customdata[0];
            window.open(`https://news.ycombinator.com/item?id=${id}`, '_blank');
        });
    }

    getTopStoriesByMonth(data) {
        const storiesByMonth = {};
        
        data.forEach(row => {
            const monthKey = row.date.toLocaleString('en-US', { year: 'numeric', month: 'long' });
            const sortKey = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!storiesByMonth[monthKey]) {
                storiesByMonth[monthKey] = {
                    stories: [],
                    sortKey: sortKey
                };
            }
            storiesByMonth[monthKey].stories.push(row);
        });

        Object.keys(storiesByMonth).forEach(month => {
            storiesByMonth[month].stories.sort((a, b) => b.score - a.score);
        });

        return storiesByMonth;
    }

    renderMonthlyStories(storiesByMonth) {
        const months = Object.entries(storiesByMonth)
            .sort((a, b) => b[1].sortKey.localeCompare(a[1].sortKey))
            .map(([month]) => month);

        const table = document.createElement('table');
        table.className = 'monthly-table';

        const tbody = document.createElement('tbody');
        months.forEach(month => {
            const topStory = storiesByMonth[month].stories[0];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-size: 1.1em">${month}</div>
                    <div style="font-size: 0.8em; color: #666;">Top Score: ${topStory.score}</div>
                </td>
                <td>
                    <a href="https://news.ycombinator.com/item?id=${topStory.id}" 
                       class="story-link" 
                       target="_blank">
                        ${topStory.title}
                    </a>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.monthlyStoriesList.appendChild(table);
    }
}

// Initialize the visualization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const visualization = new HNVisualization();
    visualization.init();
}); 