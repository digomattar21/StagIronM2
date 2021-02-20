
var config = {
  type: 'pie',
  data: {
      labels: ["USSD", "URP", "MyTsel App", "Chatbot"],
      datasets: [{
          backgroundColor: ['rgb(12, 146, 204)',
              'rgb(255, 67, 0)',
              'rgb(131, 0, 255)',
              'rgb(250, 255, 0)'
          ],
          borderColor: ['rgb(12, 146, 204)',
              'rgb(255, 67, 0)',
              'rgb(131, 0, 255)',
              'rgb(250, 255, 0)'
          ],
          data: [73, 17, 3, 7],
      }]
  },
  options: {
      responsive: true,
      legend: {
          position: 'bottom',
          labels: {
              fontColor: "black",
              boxWidth: 20,
              padding: 20
          }
      }
  }
};

window.onload = function() {
  var ctx = document.getElementById('walletPieChart').getContext('2d');
  window.myPie = new Chart(ctx, config);
};

