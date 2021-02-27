let info = getGraphInfo();
let labels = info[0];
let data = info[1];



  var config = {
    // The type of chart we want to create
    type: "bar",

    // The data for our dataset
    data: {
      labels: labels,
      datasets: [
        {
          label: "Proventos",
          backgroundColor: "rgb(15, 201, 45)",
          borderColor: "rgb(145, 201, 45)",
          data: data,
        },
      ],
    },

    // Configuration options go here
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
  
}

window.onload = function () {
  var ctx = document.getElementById("dividendsChart").getContext("2d");
  window.myPie = new Chart(ctx, config);
};

function getGraphInfo() {
  let labelsDirty = document.getElementById("dividendsDate").innerHTML;
  let dataDirty = document.getElementById("dividendsNumber").innerHTML;

  let labelsClean = labelsDirty.split(",");
  let dataClean = dataDirty.split(",");

  console.log(labelsClean);
  console.log(dataClean);
  
  return [labelsClean, dataClean];
}
