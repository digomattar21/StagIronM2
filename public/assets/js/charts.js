var ticker = document.getElementById('ticker-text').innerHTML;


function getData(e) {
  var firstDate = document.getElementById("firstDate").value;
  var secondDate = document.getElementById("secondDate").value;
  var number = 'M28Y45NMXPD67RRV';
  

  var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${number}&outputsize=full`;
  console.log('entrou');
  axios
    .get(url)
    .then((response) => {
      
    
      
    

      createChart(response.data);
    })
    .catch((err) => {
      console.log(err);
    });
}


function createChart(stockData) {

  const dailyData = stockData['Time Series (Daily)'];
 
  const stockDates = Object.keys(dailyData);
  const stockPrices = stockDates.map(date => dailyData[date]['4. close']);


  var ctx = document.getElementById("myChart").getContext("2d");
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: stockDates,
      datasets: [
        {
          label: "My First dataset",
          backgroundColor: "rgb(15, 201, 45)",
          borderColor: "rgb(145, 201, 45)",
          data: stockPrices,
        },
      ],
    },

    // Configuration options go here
    options: {},
  });
}


