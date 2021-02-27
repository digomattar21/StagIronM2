let info = getGraphInfo();
let labels = info[0];
let data = info[1];
let colors = info[2];

var config = {
  type: "doughnut",
  data: {
    labels: labels,
    datasets: [
      {
        backgroundColor: [
          "rgb(12, 146, 204)",
          "rgb(255, 67, 0)",
          "rgb(131, 0, 255)",
          "rgb(250, 255, 0)",
        ],
        borderColor: [
          "rgb(12, 146, 204)",
          "rgb(255, 67, 0)",
          "rgb(131, 0, 255)",
          "rgb(250, 255, 0)",
        ],
        data: data,
      },
    ],
  },
  options: {
    responsive: true,
    legend: {
      position: "bottom",
      labels: {
        fontColor: "black",
        boxWidth: 20,
        padding: 20,
      },
    },
  },
};

window.onload = function () {
  var ctx = document.getElementById("walletPieChart").getContext("2d");
  window.myPie = new Chart(ctx, config);
};

function getGraphInfo() {
  let labelsDirty = document.getElementById("labels").innerHTML;
  let dataDirty = document.getElementById("data").innerHTML;

  let labelsClean = labelsDirty.split(",");
  let dataClean = dataDirty.split(",");

  let colors = [];
  for (var i = 0; i < dataClean.length; i++) {
    colors.push(Math.floor(Math.random() * 255));
  }
  console.log(colors)
  return [labelsClean, dataClean, colors];
}
